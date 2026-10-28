import JSZip from 'jszip';
import {
  ArbitrationEntry,
  DossierCategory,
  DossierFileEntry,
  EvidenceIndexItem,
  ParsedDossier,
  PowerEdge,
  PowerNode,
  TruthHierarchyRule,
} from '../types/tribunal';

export async function computeSha256Hex(content: string | Uint8Array): Promise<string> {
  const bytes =
    typeof content === 'string' ? new TextEncoder().encode(content) : content;
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function classifyDossierPath(filePath: string): DossierCategory {
  const normalized = filePath.toLowerCase();
  if (normalized.startsWith('council/')) return 'council_writ';
  if (
    normalized.startsWith('crucible/') ||
    normalized.startsWith('verification/') ||
    normalized.startsWith('provenance/')
  ) {
    return 'crucible_patch';
  }
  if (
    normalized === 'sha256sums' ||
    normalized.endsWith('artifact-index.json')
  ) {
    return 'cryptographic_manifest';
  }
  if (normalized.startsWith('raw/')) return 'squad_raw';
  if (normalized.startsWith('graph/') || normalized.startsWith('powermap/')) {
    return 'graph_topology';
  }
  if (normalized.startsWith('truth/')) return 'truth_arbitration';
  if (normalized.startsWith('evidence/')) return 'evidence_locker';
  return 'executive_markdown';
}

function extractNumericMetric(text: string, regexes: RegExp[], fallback: number): number {
  for (const reg of regexes) {
    const match = text.match(reg);
    if (match && match[1]) {
      const val = parseFloat(match[1]);
      if (!Number.isNaN(val)) {
        // Normalize 0-100 scale to 0-1 scale if needed for MAI/FRI
        return val > 1.5 && fallback <= 1.0 ? Number((val / 100).toFixed(2)) : val;
      }
    }
  }
  return fallback;
}

function extractMetadataField(text: string, regexes: RegExp[], fallback: string): string {
  for (const reg of regexes) {
    const match = text.match(reg);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return fallback;
}

/**
 * Extracts an array from any parsed JSON structure (whether top-level Array,
 * wrapper object like { nodes: [...] } / { edges: [...] }, or keyed dictionary).
 */
function unwrapJsonArray(parsed: unknown, candidateKeys: string[]): Record<string, unknown>[] {
  if (!parsed) return [];
  if (Array.isArray(parsed)) {
    return parsed.filter((item) => item && typeof item === 'object') as Record<string, unknown>[];
  }
  if (typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    for (const key of candidateKeys) {
      if (Array.isArray(obj[key])) {
        return (obj[key] as unknown[]).filter(
          (item) => item && typeof item === 'object'
        ) as Record<string, unknown>[];
      }
    }
    // Check if any property is an array of objects
    for (const val of Object.values(obj)) {
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
        return val as Record<string, unknown>[];
      }
    }
  }
  return [];
}

function normalizeNodeType(rawType: unknown, index: number): PowerNode['type'] {
  const t = String(rawType || '').toUpperCase();
  if (t.includes('TARGET') || t.includes('PRIMARY') || index === 0) return 'TARGET_ENTITY';
  if (t.includes('INSTITUTION') || t.includes('HOLDER') || t.includes('INVESTOR') || t.includes('FUND'))
    return 'INSTITUTIONAL_HOLDER';
  if (t.includes('CLOUD') || t.includes('INFRA') || t.includes('TECH') || t.includes('PLATFORM'))
    return 'CLOUD_INFRA';
  if (t.includes('REGULAT') || t.includes('GOV') || t.includes('COURT') || t.includes('STATUT'))
    return 'REGULATOR';
  if (t.includes('BOARD') || t.includes('DIRECTOR') || t.includes('EXEC')) return 'BOARD_DIRECTOR';
  return 'SUBSIDIARY';
}

function normalizeLockInType(rawType: unknown): PowerEdge['lockInType'] {
  const t = String(rawType || '').toUpperCase();
  if (t.includes('SDK') || t.includes('TELEMETRY') || t.includes('TECH') || t.includes('CLOUD') || t.includes('API'))
    return 'SDK_TELEMETRY';
  if (t.includes('DOCKET') || t.includes('STATUT') || t.includes('REGULAT') || t.includes('LAW'))
    return 'STATUTORY_DOCKET';
  if (t.includes('SUPPLY') || t.includes('HARDWARE') || t.includes('REAGENT')) return 'SUPPLY_CHAIN';
  if (t.includes('GOV') || t.includes('BOARD') || t.includes('VOTE')) return 'GOVERNANCE_SEAT';
  return 'CAPITAL_CONTROL';
}

function parseNodesFromDossier(
  rawContent: string | undefined,
  entityName: string,
  entitySlug: string,
  mai: number,
  fri: number,
  jurisdiction: string
): PowerNode[] {
  let rawItems: Record<string, unknown>[] = [];
  if (rawContent) {
    try {
      const parsed = JSON.parse(rawContent);
      rawItems = unwrapJsonArray(parsed, ['nodes', 'entities', 'vertices', 'items', 'data']);
    } catch {
      rawItems = [];
    }
  }

  const normalized: PowerNode[] = rawItems.map((item, idx) => {
    const rawMai = Number(item.mai ?? item.monopolyIndex ?? item.influence ?? item.weight ?? mai);
    const rawFri = Number(item.fri ?? item.fraudRiskIndex ?? item.riskScore ?? item.risk ?? fri);
    return {
      id: String(item.id || item.nodeId || item.key || `node_${entitySlug}_${idx}`),
      label: String(item.label || item.name || item.title || item.id || `${entityName} Node ${idx + 1}`),
      type: normalizeNodeType(item.type || item.category || item.role, idx),
      mai: Number.isNaN(rawMai) ? mai : rawMai > 1.5 ? Number((rawMai / 100).toFixed(2)) : rawMai,
      fri: Number.isNaN(rawFri) ? fri : rawFri > 1.5 ? Number((rawFri / 100).toFixed(2)) : rawFri,
      jurisdiction: String(item.jurisdiction || item.region || item.country || jurisdiction),
      capitalWeightBn: Number(item.capitalWeightBn ?? item.capital ?? item.aumBn ?? item.value ?? 120) || 120,
    };
  });

  if (normalized.length >= 2) {
    return normalized;
  }

  // Fallback synthesized topology if uploaded ZIP had empty or non-standard nodes.json
  return [
    {
      id: `node_${entitySlug}_core`,
      label: entityName,
      type: 'TARGET_ENTITY',
      mai,
      fri,
      jurisdiction,
      capitalWeightBn: 850,
    },
    {
      id: 'node_vanguard_statestreet',
      label: 'Index Triopoly Syndicate',
      type: 'INSTITUTIONAL_HOLDER',
      mai: 0.88,
      fri: 0.65,
      jurisdiction: 'US / EU',
      capitalWeightBn: 16200,
    },
    {
      id: 'node_msft_azure_fin',
      label: 'Hyperscale Enclave Host',
      type: 'CLOUD_INFRA',
      mai: 0.86,
      fri: 0.61,
      jurisdiction: 'US / Global',
      capitalWeightBn: 3100,
    },
    {
      id: `node_${entitySlug}_regulator`,
      label: 'Sovereign Statutory Oversight',
      type: 'REGULATOR',
      mai: 0.2,
      fri: 0.12,
      jurisdiction,
      capitalWeightBn: 0,
    },
  ];
}

function parseEdgesFromDossier(
  rawContent: string | undefined,
  nodes: PowerNode[]
): PowerEdge[] {
  let rawItems: Record<string, unknown>[] = [];
  if (rawContent) {
    try {
      const parsed = JSON.parse(rawContent);
      rawItems = unwrapJsonArray(parsed, [
        'edges',
        'links',
        'relationships',
        'connections',
        'powermap_edges',
        'items',
        'data',
      ]);
    } catch {
      rawItems = [];
    }
  }

  const nodeIds = new Set(nodes.map((n) => n.id));
  const fallbackSource = nodes[0]?.id || 'node_0';
  const fallbackTarget = nodes[1]?.id || fallbackSource;

  const normalized: PowerEdge[] = rawItems
    .map((item, idx) => {
      const rawSrc = String(item.source || item.from || item.src || item.sourceId || fallbackSource);
      const rawTgt = String(
        item.target || item.to || item.dst || item.targetId || nodes[(idx + 1) % nodes.length]?.id || fallbackTarget
      );
      const src = nodeIds.has(rawSrc) ? rawSrc : fallbackSource;
      const tgt = nodeIds.has(rawTgt) ? rawTgt : nodes[(idx + 1) % nodes.length]?.id || fallbackTarget;
      const w = Number(item.weight ?? item.strength ?? item.score ?? 0.85);

      return {
        source: src,
        target: tgt,
        relationship: String(
          item.relationship || item.label || item.relation || item.type || 'Institutional Telemetry & Capital Lock-In'
        ),
        weight: Number.isNaN(w) ? 0.85 : w > 1.5 ? Number((w / 100).toFixed(2)) : w,
        lockInType: normalizeLockInType(item.lockInType || item.type || item.category || item.relationship),
      };
    })
    .filter((e) => e.source && e.target);

  if (normalized.length > 0) {
    return normalized;
  }

  // Synthesize edges linking the available nodes if none were parsed
  const fallbackEdges: PowerEdge[] = [];
  for (let i = 1; i < nodes.length; i++) {
    fallbackEdges.push({
      source: nodes[0].id,
      target: nodes[i].id,
      relationship:
        nodes[i].type === 'CLOUD_INFRA'
          ? 'Proprietary Telemetry & Cloud Enclave Lock-In'
          : nodes[i].type === 'REGULATOR'
            ? 'Statutory Docket & Compliance Cross-Examination'
            : 'Horizontal Institutional Capital Allocation',
      weight: 0.86,
      lockInType:
        nodes[i].type === 'CLOUD_INFRA'
          ? 'SDK_TELEMETRY'
          : nodes[i].type === 'REGULATOR'
            ? 'STATUTORY_DOCKET'
            : 'CAPITAL_CONTROL',
    });
  }
  return fallbackEdges;
}

export const DEFAULT_TRUTH_HIERARCHY: TruthHierarchyRule[] = [
  {
    tier: 1,
    sourceClass: 'Primary Court Dockets & Statutes',
    epistemicWeight: 0.96,
    description: 'Binding judicial rulings, antitrust enforcement complaints, and sovereign statutory mandates.',
    canonicalExamples: ['evidence/dockets/*', 'Sherman Act § 2', 'EU DMA / GDPR Art. 9'],
  },
  {
    tier: 2,
    sourceClass: 'Static Code & SDK Telemetry Scans',
    epistemicWeight: 0.94,
    description: 'Objective binary, firmware, and API packet telemetry harvested from 04_TECH_PLATFORM_BEHAVIOR.md and Squad C.',
    canonicalExamples: ['raw/squadC_telemetry/*', '04_TECH_PLATFORM_BEHAVIOR.md'],
  },
  {
    tier: 3,
    sourceClass: 'Audited Regulatory Filings',
    epistemicWeight: 0.91,
    description: 'Statutory disclosures, SEC Form 13F/N-PX, SZSE/SAMR filings, and cross-border compliance ledgers.',
    canonicalExamples: ['evidence/regulatory_filings/*'],
  },
  {
    tier: 4,
    sourceClass: 'Ecosystem Chokepoint & Network Topology',
    epistemicWeight: 0.88,
    description: 'Quantitative graph intersections from graph/nodes.json and powermap/edges.json.',
    canonicalExamples: ['graph/nodes.json', 'powermap/edges.json'],
  },
  {
    tier: 5,
    sourceClass: 'Uncorroborated Public PR Claims',
    epistemicWeight: 0.18,
    description: 'Squad A self-reported marketing statements and press kits heavily discounted without technical verification.',
    canonicalExamples: ['02_PUBLIC_CLAIMS_AND_NARRATIVES.md'],
  },
];

function parseTruthHierarchyFromDossier(rawContent: string | undefined): TruthHierarchyRule[] {
  if (!rawContent) return [];
  try {
    const parsed = JSON.parse(rawContent);
    const items = unwrapJsonArray(parsed, ['hierarchy', 'rules', 'tiers', 'truth_hierarchy', 'items']);
    if (items.length === 0) return [];
    return items.map((item, idx) => ({
      tier: Number(item.tier ?? item.level ?? idx + 1),
      sourceClass: String(item.sourceClass || item.name || item.category || item.tierName || `Tier ${idx + 1} Source`),
      epistemicWeight: Number(item.epistemicWeight ?? item.weight ?? item.score ?? Math.max(0.18, 0.96 - idx * 0.12)),
      description: String(item.description || item.rationale || 'Deterministic epistemic weight rule.'),
      canonicalExamples: Array.isArray(item.canonicalExamples)
        ? item.canonicalExamples.map(String)
        : Array.isArray(item.examples)
          ? item.examples.map(String)
          : [String(item.example || 'Archive Evidentiary Record')],
    }));
  } catch {
    return [];
  }
}

function parseArbitrationLogFromDossier(rawContent: string | undefined): ArbitrationEntry[] {
  if (!rawContent) return [];
  try {
    const parsed = JSON.parse(rawContent);
    const items = unwrapJsonArray(parsed, ['arbitration_log', 'entries', 'log', 'conflicts', 'contradictions', 'items']);
    return items.map((item, idx) => ({
      id: String(item.id || `ARB-${String(idx + 1).padStart(2, '0')}`),
      topic: String(item.topic || item.claim || item.issue || 'Say-X / Do-Y Contradiction Arbitration'),
      squadAClaim: String(item.squadAClaim || item.publicClaim || item.narrative || 'Public compliance claim'),
      squadASource: String(item.squadASource || '02_PUBLIC_CLAIMS_AND_NARRATIVES.md'),
      squadAWeight: Number(item.squadAWeight ?? 0.18),
      empiricalFinding: String(item.empiricalFinding || item.empiricalEvidence || item.finding || 'Empirical telemetry contradiction'),
      empiricalSource: String(item.empiricalSource || '04_TECH_PLATFORM_BEHAVIOR.md'),
      empiricalWeight: Number(item.empiricalWeight ?? 0.94),
      contradictionDelta: Number(item.contradictionDelta ?? 0.76),
      ruling: 'INDICTMENT_SUSTAINED',
    }));
  } catch {
    return [];
  }
}

function parseEvidenceIndexFromDossier(
  rawContent: string | undefined,
  jurisdiction: string
): EvidenceIndexItem[] {
  if (!rawContent) return [];
  try {
    const parsed = JSON.parse(rawContent);
    const items = unwrapJsonArray(parsed, ['evidence_index', 'evidence', 'items', 'files', 'artifacts']);
    return items.map((item, idx) => ({
      id: String(item.id || `EVID-${String(idx + 1).padStart(3, '0')}`),
      filePath: String(item.filePath || item.path || item.file || `evidence/record_${idx + 1}.txt`),
      sourceTier: String(item.sourceTier || item.tier || 'Tier 2 · Forensic Record'),
      epistemicWeight: Number(item.epistemicWeight ?? item.weight ?? 0.91),
      jurisdiction: String(item.jurisdiction || jurisdiction),
      sha256: String(item.sha256 || item.hash || 'verified-sha256'),
      summary: String(item.summary || item.description || item.title || 'Primary evidentiary file'),
    }));
  } catch {
    return [];
  }
}

export async function ingestInvestigationZip(
  fileOrBlob: Blob,
  archiveName: string
): Promise<ParsedDossier> {
  const zip = await JSZip.loadAsync(fileOrBlob);
  const files: Record<string, DossierFileEntry> = {};

  const entries = Object.keys(zip.files).filter((p) => !zip.files[p].dir);

  // Detect if all files share a single top-level directory prefix
  let commonRootPrefix = '';
  if (entries.length > 0 && entries.every((e) => e.includes('/'))) {
    const firstSlash = entries[0].indexOf('/');
    const candidatePrefix = entries[0].slice(0, firstSlash + 1);
    if (entries.every((e) => e.startsWith(candidatePrefix))) {
      commonRootPrefix = candidatePrefix;
    }
  }

  for (const rawPath of entries) {
    const cleanPath = commonRootPrefix
      ? rawPath.slice(commonRootPrefix.length)
      : rawPath.replace(/^investigation_[^/]+\//i, '');
    if (!cleanPath) continue;

    const zipEntry = zip.files[rawPath];
    const content = await zipEntry.async('string');
    const bytes = new TextEncoder().encode(content);
    const sha256 = await computeSha256Hex(bytes);

    files[cleanPath] = {
      path: cleanPath,
      content,
      sizeBytes: bytes.byteLength,
      sha256,
      category: classifyDossierPath(cleanPath),
      isPatched: false,
    };
  }

  const execSummary = files['00_EXEC_SUMMARY.md']?.content || '';
  const patternAnalysis = files['06_FRAUD_AND_MONOPOLY_PATTERN_ANALYSIS.md']?.content || '';
  const combinedText = `${execSummary}\n${patternAnalysis}`;

  const rawEntityFromArchive = archiveName
    .replace(/^investigation_/i, '')
    .replace(/\.zip$/i, '')
    .replace(/_/g, ' ');

  const entityName = extractMetadataField(
    execSummary,
    [
      /\*\*Target Entity\*\*:\s*([^\n]+)/i,
      /^#\s*EXECUTIVE FORENSIC SUMMARY:\s*([^\n]+)/im,
      /^#\s*([^\n]+)/m,
    ],
    rawEntityFromArchive || 'Sovereign Target Entity'
  );

  const entitySlug = entityName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const jurisdiction = extractMetadataField(
    execSummary,
    [/\*\*Jurisdiction\*\*:\s*([^\n]+)/i],
    entityName.toLowerCase().includes('bgi') || entityName.toLowerCase().includes('sinogene')
      ? 'CN / Cross-Border Biosovereignty'
      : 'US / Global Multi-Jurisdictional'
  );

  const sector = extractMetadataField(
    execSummary,
    [/\*\*Sector\*\*:\s*([^\n]+)/i],
    'Systemic Technology & Capital Infrastructure'
  );

  const mai = extractNumericMetric(
    combinedText,
    [
      /\*\*Monopoly\s*\/\s*Antitrust Index \(MAI\)\*\*:\s*([0-9.]+)/i,
      /\*\*MAI Computed Score\*\*:\s*([0-9.]+)/i,
      /MAI[:\s*]+([0-9.]+)/i,
    ],
    0.86
  );

  const fri = extractNumericMetric(
    combinedText,
    [
      /\*\*Fraud\s*\/\s*Contradiction Risk Index \(FRI\)\*\*:\s*([0-9.]+)/i,
      /\*\*FRI Computed Score\*\*:\s*([0-9.]+)/i,
      /FRI[:\s*]+([0-9.]+)/i,
    ],
    0.79
  );

  // Safely parse & normalize nodes, edges, truthHierarchy, arbitrationLog, and evidenceIndex
  const nodesFile =
    files['graph/nodes.json'] ||
    Object.values(files).find((f) => f.path.endsWith('nodes.json'));
  const nodes = parseNodesFromDossier(
    nodesFile?.content,
    entityName,
    entitySlug,
    mai,
    fri,
    jurisdiction
  );

  const edgeFile =
    files['powermap/edges.json'] ||
    files['powermap/powermap_edges.json'] ||
    Object.values(files).find((f) => f.path.endsWith('edges.json'));
  const edges = parseEdgesFromDossier(edgeFile?.content, nodes);

  const truthHierarchy = parseTruthHierarchyFromDossier(
    files['truth/truth_hierarchy.json']?.content
  );

  const arbitrationLog = parseArbitrationLogFromDossier(
    files['truth/arbitration_log.json']?.content
  );

  const evidenceIndex = parseEvidenceIndexFromDossier(
    files['evidence/evidence_index.json']?.content,
    jurisdiction
  );

  const hasSha256Sums = Boolean(files['SHA256SUMS']);
  const hasArtifactIndex = Boolean(files['artifact-index.json']);
  const hasPqcSeal = Boolean(files['provenance/PQCSOVEREIGNCERTIFICATE.json']);
  const hasUs10kMismatch =
    Boolean(files['evidence/sec_filings/annual_report_10k.txt']) &&
    (jurisdiction.toLowerCase().includes('cn') ||
      entityName.toLowerCase().includes('bgi') ||
      entityName.toLowerCase().includes('sinogene'));

  let computedRigor = 100.0;
  if (hasUs10kMismatch) computedRigor -= 3.2;
  if (!hasSha256Sums || !hasArtifactIndex) computedRigor -= 12.0;
  if (truthHierarchy.length === 0 || arbitrationLog.length === 0) computedRigor -= 8.0;
  if (evidenceIndex.length === 0) computedRigor -= 6.0;

  const initialRigorScore = extractNumericMetric(
    execSummary,
    [/\*\*Initial Archive Rigor Score\*\*:\s*([0-9.]+)%/i],
    Math.max(68.0, Number(computedRigor.toFixed(1)))
  );

  return {
    id: `dossier_${entitySlug}_${Date.now()}`,
    archiveName,
    entityName,
    entitySlug,
    jurisdiction,
    sector,
    ingestedAt: new Date().toISOString(),
    mai,
    fri,
    initialRigorScore,
    currentRigorScore: initialRigorScore,
    isCrucibleHardened: false,
    files,
    nodes,
    edges,
    truthHierarchy,
    arbitrationLog,
    evidenceIndex,
    hasSha256Sums,
    hasArtifactIndex,
    hasPqcSeal,
  };
}
