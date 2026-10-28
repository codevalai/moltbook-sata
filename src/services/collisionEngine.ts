import {
  MultiZipCollisionReport,
  ParsedDossier,
  PowerEdge,
  PowerNode,
  SharedEntityCollision,
} from '../types/tribunal';

/**
 * v9.0 Upgrade #1: Recursive Multi-ZIP Collision & Cross-Dossier Nexus Engine
 * Iterates across all mounted ParsedDossier cartridges, merges graph/nodes.json
 * and powermap/edges.json into a unified super-graph, and flags shared institutional
 * investors, cloud infrastructure dependencies, and cross-sector chokepoints.
 */
export function runMultiZipCollisionEngine(
  dossiers: ParsedDossier[]
): MultiZipCollisionReport {
  const nodeMap = new Map<
    string,
    PowerNode & { sourceDossiers: string[]; maiValues: number[]; friValues: number[] }
  >();
  const superEdges: Array<PowerEdge & { sourceDossier: string }> = [];

  const safeDossiers = Array.isArray(dossiers) ? dossiers : [];

  for (const d of safeDossiers) {
    const safeNodes = Array.isArray(d.nodes) ? d.nodes : [];
    const safeEdges = Array.isArray(d.edges) ? d.edges : [];

    for (const n of safeNodes) {
      if (!n || !n.id) continue;
      const existing = nodeMap.get(n.id);
      if (existing) {
        if (!existing.sourceDossiers.includes(d.entityName)) {
          existing.sourceDossiers.push(d.entityName);
        }
        existing.maiValues.push(Number(n.mai) || 0.8);
        existing.friValues.push(Number(n.fri) || 0.75);
        existing.capitalWeightBn = Math.max(
          existing.capitalWeightBn || 0,
          n.capitalWeightBn || 0
        );
      } else {
        nodeMap.set(n.id, {
          ...n,
          mai: Number(n.mai) || 0.8,
          fri: Number(n.fri) || 0.75,
          sourceDossiers: [d.entityName],
          maiValues: [Number(n.mai) || 0.8],
          friValues: [Number(n.fri) || 0.75],
        });
      }
    }

    for (const e of safeEdges) {
      if (!e || !e.source || !e.target) continue;
      superEdges.push({
        ...e,
        weight: Number(e.weight) || 0.85,
        sourceDossier: d.entityName,
      });
    }
  }

  const sharedChokepoints: SharedEntityCollision[] = [];
  const superNodes: Array<
    PowerNode & { sourceDossiers: string[]; isCollisionNexus: boolean }
  > = [];

  for (const entry of nodeMap.values()) {
    const avgMai = Number(
      (entry.maiValues.reduce((a, b) => a + b, 0) / Math.max(1, entry.maiValues.length)).toFixed(2)
    );
    const avgFri = Number(
      (entry.friValues.reduce((a, b) => a + b, 0) / Math.max(1, entry.friValues.length)).toFixed(2)
    );
    const isCollisionNexus = entry.sourceDossiers.length > 1;

    superNodes.push({
      id: entry.id,
      label: entry.label,
      type: entry.type,
      mai: avgMai,
      fri: avgFri,
      jurisdiction: entry.jurisdiction,
      capitalWeightBn: entry.capitalWeightBn,
      sourceDossiers: entry.sourceDossiers,
      isCollisionNexus,
    });

    if (isCollisionNexus) {
      const crossDossierRiskScore = Number(
        Math.min(
          0.99,
          avgMai * 0.5 + avgFri * 0.35 + entry.sourceDossiers.length * 0.06
        ).toFixed(3)
      );

      sharedChokepoints.push({
        nodeId: entry.id,
        label: entry.label,
        nodeType: entry.type,
        dossiersInvolved: entry.sourceDossiers,
        combinedCapitalWeightBn: entry.capitalWeightBn || 0,
        averageMai: avgMai,
        averageFri: avgFri,
        chokepointClassification:
          entry.type === 'CLOUD_INFRA'
            ? 'Shared Hyperscale Enclave & Telemetry Backbone'
            : entry.type === 'INSTITUTIONAL_HOLDER'
              ? 'Cross-Sector Horizontal Common Ownership Syndicate'
              : 'Multi-Dossier Capital & Supply-Chain Chokepoint',
        crossDossierRiskScore,
        evidenceSummary: `Detected in ${entry.sourceDossiers.length} independent investigation cartridges (${entry.sourceDossiers.join(' + ')}). Creates coupled algorithmic/capital contagion across sectors.`,
      });
    }
  }

  sharedChokepoints.sort((a, b) => b.crossDossierRiskScore - a.crossDossierRiskScore);

  const systemicContagionIndex =
    sharedChokepoints.length > 0
      ? Number(
          (
            sharedChokepoints.reduce((acc, c) => acc + c.crossDossierRiskScore, 0) /
            sharedChokepoints.length
          ).toFixed(3)
        )
      : Number(
          (
            superNodes.reduce((acc, n) => acc + n.mai, 0) /
            Math.max(1, superNodes.length)
          ).toFixed(3)
        );

  return {
    computedAt: new Date().toISOString(),
    mountedDossierNames: safeDossiers.map((d) => d.entityName),
    totalSuperGraphNodes: superNodes.length,
    totalSuperGraphEdges: superEdges.length,
    sharedChokepoints,
    superNodes,
    superEdges,
    systemicContagionIndex,
  };
}
