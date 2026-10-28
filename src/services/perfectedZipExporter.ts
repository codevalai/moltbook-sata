import JSZip from 'jszip';
import {
  CrucibleReport,
  MultiZipCollisionReport,
  ParsedDossier,
  TemporalDeltaReport,
  TribunalVerdict,
  ZkpSoundnessProof,
} from '../types/tribunal';
import { computeSha256Hex } from './zipIngestor';

export async function exportCouncilPerfectedZip(params: {
  dossier: ParsedDossier;
  tribunalVerdict: TribunalVerdict;
  crucibleReport: CrucibleReport;
  zkpProof?: ZkpSoundnessProof | null;
  deltaReport?: TemporalDeltaReport | null;
  collisionReport?: MultiZipCollisionReport | null;
}): Promise<{ fileName: string; totalFiles: number; byteSize: number }> {
  const {
    dossier,
    tribunalVerdict,
    crucibleReport,
    zkpProof,
    deltaReport,
    collisionReport,
  } = params;

  const zip = new JSZip();
  const exportMap: Record<string, { content: string; sha256: string }> = {};

  // 1. Copy all files from the Crucible-hardened dossier
  for (const [filePath, entry] of Object.entries(dossier.files)) {
    exportMap[filePath] = {
      content: entry.content,
      sha256: entry.sha256,
    };
  }

  // Ensure council writ & crucible files are present
  if (!exportMap['council/TRIBUNAL_VERDICT_WRIT.md']) {
    const sha = await computeSha256Hex(tribunalVerdict.writMarkdown);
    exportMap['council/TRIBUNAL_VERDICT_WRIT.md'] = {
      content: tribunalVerdict.writMarkdown,
      sha256: sha,
    };
  }

  if (!exportMap['crucible/CRUCIBLE_REDTEAM_CHANGELOG.md']) {
    const sha = await computeSha256Hex(crucibleReport.changelogMarkdown);
    exportMap['crucible/CRUCIBLE_REDTEAM_CHANGELOG.md'] = {
      content: crucibleReport.changelogMarkdown,
      sha256: sha,
    };
  }

  // 2. Include v9.0 artifacts if generated
  if (zkpProof) {
    const zkpJson = JSON.stringify(zkpProof, null, 2);
    const sha = await computeSha256Hex(zkpJson);
    exportMap['provenance/ZKP_SOUNDNESS_PROOF.json'] = {
      content: zkpJson,
      sha256: sha,
    };
  }

  if (deltaReport) {
    const deltaJson = JSON.stringify(deltaReport, null, 2);
    const sha = await computeSha256Hex(deltaJson);
    exportMap['watchtower/delta_report.json'] = {
      content: deltaJson,
      sha256: sha,
    };
  }

  if (collisionReport) {
    const collisionJson = JSON.stringify(collisionReport, null, 2);
    const sha = await computeSha256Hex(collisionJson);
    exportMap['powermap/multi_zip_collision_nexus.json'] = {
      content: collisionJson,
      sha256: sha,
    };
  }

  // 3. Recompute final canonical SHA256SUMS across all exported files
  const sortedPaths = Object.keys(exportMap)
    .filter((p) => p !== 'SHA256SUMS')
    .sort();
  const sha256SumsText =
    sortedPaths.map((p) => `${exportMap[p].sha256}  ${p}`).join('\n') + '\n';
  exportMap['SHA256SUMS'] = {
    content: sha256SumsText,
    sha256: await computeSha256Hex(sha256SumsText),
  };

  // Write every file into the JSZip archive
  for (const [filePath, item] of Object.entries(exportMap)) {
    zip.file(filePath, item.content);
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const fileName = `project-${dossier.entitySlug}-council-perfected.zip`;

  // Trigger browser download
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 3000);

  return {
    fileName,
    totalFiles: Object.keys(exportMap).length,
    byteSize: blob.size,
  };
}
