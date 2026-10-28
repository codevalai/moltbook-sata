export type DossierCategory =
  | 'executive_markdown'
  | 'squad_raw'
  | 'graph_topology'
  | 'truth_arbitration'
  | 'evidence_locker'
  | 'cryptographic_manifest'
  | 'council_writ'
  | 'crucible_patch';

export interface DossierFileEntry {
  path: string;
  content: string;
  sizeBytes: number;
  sha256: string;
  category: DossierCategory;
  isPatched?: boolean;
  patchOrigin?: string;
}

export interface PowerNode {
  id: string;
  label: string;
  type: 'TARGET_ENTITY' | 'INSTITUTIONAL_HOLDER' | 'CLOUD_INFRA' | 'REGULATOR' | 'SUBSIDIARY' | 'BOARD_DIRECTOR';
  mai: number;
  fri: number;
  jurisdiction: string;
  capitalWeightBn?: number;
}

export interface PowerEdge {
  source: string;
  target: string;
  relationship: string;
  weight: number;
  lockInType: 'CAPITAL_CONTROL' | 'SDK_TELEMETRY' | 'GOVERNANCE_SEAT' | 'SUPPLY_CHAIN' | 'STATUTORY_DOCKET';
}

export interface TruthHierarchyRule {
  tier: number;
  sourceClass: string;
  epistemicWeight: number;
  description: string;
  canonicalExamples: string[];
}

export interface ArbitrationEntry {
  id: string;
  topic: string;
  squadAClaim: string;
  squadASource: string;
  squadAWeight: number;
  empiricalFinding: string;
  empiricalSource: string;
  empiricalWeight: number;
  contradictionDelta: number;
  ruling: 'INDICTMENT_SUSTAINED' | 'CLAIM_DISCOUNTED' | 'REMEDIATION_REQUIRED';
}

export interface EvidenceIndexItem {
  id: string;
  filePath: string;
  sourceTier: string;
  epistemicWeight: number;
  jurisdiction: string;
  sha256: string;
  summary: string;
}

export interface ParsedDossier {
  id: string;
  archiveName: string;
  entityName: string;
  entitySlug: string;
  jurisdiction: string;
  sector: string;
  ingestedAt: string;
  mai: number; // Monopoly / Antitrust Index (0.00 - 1.00)
  fri: number; // Fraud Risk Index (0.00 - 1.00)
  initialRigorScore: number; // e.g., 74.0 or 96.8
  currentRigorScore: number; // Elevated to 100.0 after Crucible
  isCrucibleHardened: boolean;
  files: Record<string, DossierFileEntry>;
  nodes: PowerNode[];
  edges: PowerEdge[];
  truthHierarchy: TruthHierarchyRule[];
  arbitrationLog: ArbitrationEntry[];
  evidenceIndex: EvidenceIndexItem[];
  hasSha256Sums: boolean;
  hasArtifactIndex: boolean;
  hasPqcSeal: boolean;
}

export interface CitationItem {
  filePath: string;
  sha256Prefix: string;
  extractedQuote: string;
  epistemicWeight: number;
  tierLabel: string;
}

export interface IndictmentCount {
  countNumber: 'COUNT I' | 'COUNT II' | 'COUNT III';
  code: string;
  title: string;
  statuteBasis: string;
  statutoryThreshold: number;
  computedCScore: number;
  findingStatus: 'INDICTED' | 'PROBATIONARY_REMEDIATION' | 'CLEARED';
  prosecutorThesis: string;
  prosecutorCitations: CitationItem[];
  defenseCounter: string;
  defenseCitations: CitationItem[];
  epistemicArbitrationSummary: string;
  contradictionPenalty: number;
}

export interface HouseRollCall {
  houseNumber: number;
  houseName: string;
  domainFocus: string;
  totalSeats: number;
  indictVotes: number;
  dissentVotes: number;
  abstainVotes: number;
  leadMagistrate: string;
  houseFinding: string;
  primaryCitation: string;
}

export interface TribunalVerdict {
  dossierId: string;
  entityName: string;
  executedAt: string;
  overallVerdict: 'HIGH_CHAMBER_INDICTMENT' | 'CONDITIONAL_DECREE' | 'CLEARED';
  aggregateCScore: number;
  totalSeats: number;
  totalIndictVotes: number;
  totalDissentVotes: number;
  totalAbstainVotes: number;
  counts: IndictmentCount[];
  houses: HouseRollCall[];
  mandatoryRemediationDecrees: string[];
  writMarkdown: string;
}

export interface CrucibleDefect {
  defectId: 'DEFECT-RT-01' | 'DEFECT-RT-02' | 'DEFECT-RT-03' | 'DEFECT-RT-04';
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'ELEVATED';
  auditorAgent: string;
  detectedStatus: 'VULNERABILITY_FOUND' | 'CLEAN_VERIFIED';
  diagnosticDetail: string;
  offendingPaths: string[];
  forgedPatchPaths: string[];
  remediationAction: string;
  rigorDelta: number;
}

export interface GateAuditItem {
  gateNumber: number;
  gateName: string;
  prePatchStatus: 'PASS' | 'FAIL' | 'WARN';
  postPatchStatus: 'PASS';
  verificationMetric: string;
}

export interface PqcLatticeCertificate {
  standard: 'NIST-FIPS-204 (CRYSTALS-Dilithium-5)';
  securityLevel: 'NIST Level 5 (Post-Quantum Sovereign Grade)';
  entitySubject: string;
  merkleRootSha256: string;
  publicKeyFingerprint: string;
  latticeSignatureHex: string;
  issuedAt: string;
  totalFilesSealed: number;
}

export interface CrucibleReport {
  dossierId: string;
  entityName: string;
  executedAt: string;
  initialRigorScore: number;
  hardenedRigorScore: number;
  defectsFoundCount: number;
  filesPatchedCount: number;
  filesStrippedCount: number;
  defects: CrucibleDefect[];
  twelveGates: GateAuditItem[];
  pqcCertificate: PqcLatticeCertificate;
  changelogMarkdown: string;
}

// ============================================================================
// v9.0 Planetary Intelligence Suite Schemas
// ============================================================================

export interface SharedEntityCollision {
  nodeId: string;
  label: string;
  nodeType: PowerNode['type'];
  dossiersInvolved: string[];
  combinedCapitalWeightBn: number;
  averageMai: number;
  averageFri: number;
  chokepointClassification: string;
  crossDossierRiskScore: number;
  evidenceSummary: string;
}

export interface MultiZipCollisionReport {
  computedAt: string;
  mountedDossierNames: string[];
  totalSuperGraphNodes: number;
  totalSuperGraphEdges: number;
  sharedChokepoints: SharedEntityCollision[];
  superNodes: Array<PowerNode & { sourceDossiers: string[]; isCollisionNexus: boolean }>;
  superEdges: Array<PowerEdge & { sourceDossier: string }>;
  systemicContagionIndex: number;
}

export interface DeltaWatchEvent {
  id: string;
  date: string;
  sourceAuthority: string;
  title: string;
  finding: string;
  impactOnMai: number;
  impactOnFri: number;
  verificationStatus: 'CONFIRMED_FILING' | 'ACTIVE_DOCKET' | 'SILENT_RETRACTION' | 'COMPLIANCE_AMENDMENT';
  sourceUrl: string;
}

export interface TemporalDeltaReport {
  dossierId: string;
  entityName: string;
  executedAt: string;
  isLiveGrounded: boolean;
  groundingNote: string;
  baselineMai: number;
  currentMai: number;
  deltaMai: number;
  baselineFri: number;
  currentFri: number;
  deltaFri: number;
  summary: string;
  events: DeltaWatchEvent[];
}

export interface ZkpCircuitConstraint {
  constraintId: string;
  gateExpression: string;
  witnessInputHash: string;
  publicOutputHash: string;
  satisfied: boolean;
}

export interface ZkpSoundnessProof {
  protocol: 'Groth16 / Fiat-Shamir WebCrypto Deterministic SNARK Circuit v9.0';
  curve: 'BN254-SHA256-Arithmetic-Commitment';
  dossierId: string;
  entityName: string;
  generatedAt: string;
  merkleEvidentiaryRoot: string;
  verdictCommitmentHash: string;
  cScorePublicInput: string;
  piA: [string, string];
  piB: [[string, string], [string, string]];
  piC: [string, string];
  constraints: ZkpCircuitConstraint[];
  isMathematicallySound: boolean;
  thirdPartyVerificationTimeMs: number;
}

export interface BriefingDialogueTurn {
  id: string;
  speaker: 'Prosecutor' | 'Defense';
  roleTitle: string;
  text: string;
  citationRef: string;
  durationSec: number;
}

export interface ExecutiveBriefingScript {
  dossierId: string;
  entityName: string;
  title: string;
  generatedAt: string;
  turns: BriefingDialogueTurn[];
}
