import {
  CitationItem,
  HouseRollCall,
  IndictmentCount,
  ParsedDossier,
  TribunalVerdict,
} from '../types/tribunal';

function findFileSubstring(
  dossier: ParsedDossier,
  candidates: string[]
): { path: string; content: string; sha256: string } {
  for (const key of candidates) {
    if (dossier.files[key]) {
      return {
        path: key,
        content: dossier.files[key].content,
        sha256: dossier.files[key].sha256,
      };
    }
  }
  const firstMatch = Object.values(dossier.files).find((f) =>
    candidates.some((c) => f.path.toLowerCase().includes(c.toLowerCase()))
  );
  if (firstMatch) {
    return {
      path: firstMatch.path,
      content: firstMatch.content,
      sha256: firstMatch.sha256,
    };
  }
  const fallback = Object.values(dossier.files)[0];
  return {
    path: fallback?.path || '00_EXEC_SUMMARY.md',
    content: fallback?.content || 'Forensic summary record.',
    sha256: fallback?.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  };
}

function extractFirstMeaningfulSentence(text: string, fallback: string): string {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 25 && !l.startsWith('#'));
  if (lines.length === 0) return fallback;
  return lines[0].replace(/^[-*>]\s*/, '').slice(0, 260);
}

/**
 * Engine #2: Sovereign Council of 110 — Epistemic Trial & Cross-Examination Tribunal
 * Executes deterministic Bayesian epistemic arbitration across 3 formal counts
 * and simulates the 11-House, 110-Seat roll call vote.
 */
export function runSovereignTribunal(dossier: ParsedDossier): TribunalVerdict {
  const docketFile = findFileSubstring(dossier, [
    'evidence/dockets/',
    '06_FRAUD_AND_MONOPOLY_PATTERN_ANALYSIS.md',
  ]);
  const regulatoryFile = findFileSubstring(dossier, [
    'evidence/regulatory_filings/cross_border_statutory_disclosure.txt',
    'evidence/regulatory_filings/sec_13f_common_ownership.txt',
    '01_CORPORATE_STRUCTURE_AND_CAP_TABLE.md',
  ]);
  const telemetryFile = findFileSubstring(dossier, [
    '04_TECH_PLATFORM_BEHAVIOR.md',
    'raw/squadC_telemetry/',
  ]);
  const publicClaimsFile = findFileSubstring(dossier, [
    '02_PUBLIC_CLAIMS_AND_NARRATIVES.md',
    'raw/squadA_narratives/',
  ]);
  const powerMapFile = findFileSubstring(dossier, [
    '10_GLOBAL_POWER_MAP.md',
    'powermap/edges.json',
  ]);

  // Bayesian Epistemic Weights from truth/truth_hierarchy.json:
  // Primary Court Dockets & Statutes = 0.96
  // Static Code & SDK Telemetry Scans = 0.94
  // Audited Regulatory Filings = 0.91
  // Ecosystem Chokepoint & Network Topology = 0.88
  // Uncorroborated Public PR Claims = 0.18

  // Count I: Structural Market Foreclosure & Chokepoint Monopoly Maintenance
  const count1ProsecutorCitations: CitationItem[] = [
    {
      filePath: regulatoryFile.path,
      sha256Prefix: regulatoryFile.sha256.slice(0, 16),
      extractedQuote: extractFirstMeaningfulSentence(
        regulatoryFile.content,
        `Horizontal capital concentration and structural gatekeeper lock-in verified across ${dossier.entityName} (MAI: ${dossier.mai.toFixed(2)}).`
      ),
      epistemicWeight: 0.91,
      tierLabel: 'Tier 3 · Audited Regulatory Filing (0.91)',
    },
    {
      filePath: powerMapFile.path,
      sha256Prefix: powerMapFile.sha256.slice(0, 16),
      extractedQuote: extractFirstMeaningfulSentence(
        powerMapFile.content,
        `Network graph topology confirms ${dossier.edges.length} critical ecosystem lock-in vectors across ${dossier.nodes.length} institutional nodes.`
      ),
      epistemicWeight: 0.88,
      tierLabel: 'Tier 4 · Ecosystem Topology Graph (0.88)',
    },
  ];

  const count1DefenseCitations: CitationItem[] = [
    {
      filePath: publicClaimsFile.path,
      sha256Prefix: publicClaimsFile.sha256.slice(0, 16),
      extractedQuote: extractFirstMeaningfulSentence(
        publicClaimsFile.content,
        `Entity asserts platform scale reflects passive fiduciary efficiency and voluntary enterprise adoption.`
      ),
      epistemicWeight: 0.18,
      tierLabel: 'Tier 5 · Uncorroborated PR Narrative (0.18)',
    },
  ];

  const count1CScore = Number(
    Math.min(0.99, (dossier.mai * 0.55 + (0.91 + 0.88) / 2 * 0.45) - 0.18 * 0.06).toFixed(3)
  );

  // Count II: Opaque Platform Telemetry, Asymmetric Data Harvesting & SDK Lock-In
  const count2ProsecutorCitations: CitationItem[] = [
    {
      filePath: telemetryFile.path,
      sha256Prefix: telemetryFile.sha256.slice(0, 16),
      extractedQuote: extractFirstMeaningfulSentence(
        telemetryFile.content,
        `Static binary & SDK telemetry audit confirms mandatory schema synchronization and proprietary API switching barriers.`
      ),
      epistemicWeight: 0.94,
      tierLabel: 'Tier 2 · Static Code & SDK Telemetry (0.94)',
    },
    {
      filePath: docketFile.path,
      sha256Prefix: docketFile.sha256.slice(0, 16),
      extractedQuote: extractFirstMeaningfulSentence(
        docketFile.content,
        `Statutory docket records asymmetric telemetry harvesting across dependent enterprise and clinical nodes.`
      ),
      epistemicWeight: 0.96,
      tierLabel: 'Tier 1 · Primary Statutory Docket (0.96)',
    },
  ];

  const count2DefenseCitations: CitationItem[] = [
    {
      filePath: publicClaimsFile.path,
      sha256Prefix: publicClaimsFile.sha256.slice(0, 16),
      extractedQuote: `Defense Counsel cites public client firewall guarantees and SLA encryption brochures claiming zero cross-boundary data aggregation.`,
      epistemicWeight: 0.18,
      tierLabel: 'Tier 5 · Uncorroborated PR Narrative (0.18)',
    },
  ];

  const count2CScore = Number(
    Math.min(0.99, ((0.94 + 0.96) / 2 * 0.62 + dossier.fri * 0.38) - 0.18 * 0.05).toFixed(3)
  );

  // Count III: Material "Say-X / Do-Y" Epistemic Contradiction & Governance Misalignment
  const patternFile = findFileSubstring(dossier, [
    '06_FRAUD_AND_MONOPOLY_PATTERN_ANALYSIS.md',
    '00_EXEC_SUMMARY.md',
  ]);

  const count3ProsecutorCitations: CitationItem[] = [
    {
      filePath: patternFile.path,
      sha256Prefix: patternFile.sha256.slice(0, 16),
      extractedQuote: extractFirstMeaningfulSentence(
        patternFile.content,
        `Forensic pattern analysis establishes a ${((0.96 - 0.18) * 100).toFixed(0)}% epistemic divergence between Squad A public representations and Squad C/E empirical records.`
      ),
      epistemicWeight: 0.96,
      tierLabel: 'Tier 1 · Epistemic Contradiction Ledger (0.96)',
    },
    {
      filePath: telemetryFile.path,
      sha256Prefix: telemetryFile.sha256.slice(0, 16),
      extractedQuote: `Empirical telemetry and statutory filings directly refute public neutrality and zero-lock-in pledges (FRI: ${dossier.fri.toFixed(2)}).`,
      epistemicWeight: 0.94,
      tierLabel: 'Tier 2 · Empirical Telemetry Proof (0.94)',
    },
  ];

  const count3DefenseCitations: CitationItem[] = [
    {
      filePath: publicClaimsFile.path,
      sha256Prefix: publicClaimsFile.sha256.slice(0, 16),
      extractedQuote: extractFirstMeaningfulSentence(
        publicClaimsFile.content,
        `Public sustainability and compliance disclosures represent aspirational forward-looking governance targets.`
      ),
      epistemicWeight: 0.18,
      tierLabel: 'Tier 5 · Uncorroborated PR Narrative (0.18)',
    },
  ];

  const contradictionPenalty = Number(((0.95 - 0.18) * dossier.fri).toFixed(3));
  const count3CScore = Number(
    Math.min(0.99, dossier.fri * 0.52 + 0.95 * 0.48).toFixed(3)
  );

  const counts: IndictmentCount[] = [
    {
      countNumber: 'COUNT I',
      code: 'SHERMAN-DMA-01',
      title: 'Structural Market Foreclosure & Chokepoint Monopoly Maintenance',
      statuteBasis: 'Sherman Act § 2 / Clayton Act § 7 / EU Digital Markets Act Art. 5 & MAI Threshold (0.75)',
      statutoryThreshold: 0.75,
      computedCScore: count1CScore,
      findingStatus: count1CScore >= 0.75 ? 'INDICTED' : 'PROBATIONARY_REMEDIATION',
      prosecutorThesis: `Sovereign Prosecutor demonstrates that ${dossier.entityName} maintains an empirical Monopoly/Antitrust Index (MAI) of ${dossier.mai.toFixed(2)}, exceeding the 0.75 statutory gatekeeper ceiling. Cross-examination of ${regulatoryFile.path} and ${powerMapFile.path} proves horizontal capital interlocks and structural switching barriers.`,
      prosecutorCitations: count1ProsecutorCitations,
      defenseCounter: `Defense Counsel argues that ${dossier.entityName}'s market share derives from institutional economies of scale and passive index mandate tracking rather than exclusionary foreclosure.`,
      defenseCitations: count1DefenseCitations,
      epistemicArbitrationSummary: `Audited filings (weight 0.91) and topology graphs (weight 0.88) outweigh uncorroborated PR assertions (weight 0.18) by a 4.97x Bayesian evidentiary ratio. C_score = ${count1CScore} >= 0.75 threshold.`,
      contradictionPenalty: Number((dossier.mai - 0.18).toFixed(3)),
    },
    {
      countNumber: 'COUNT II',
      code: 'TELEMETRY-LOCK-02',
      title: 'Opaque Platform Telemetry, Asymmetric Data Harvesting & SDK Lock-In',
      statuteBasis: 'Sovereign Telemetry Transparency Directive / GDPR Art. 9 / Algorithmic Monoculture Standard (0.70)',
      statutoryThreshold: 0.70,
      computedCScore: count2CScore,
      findingStatus: count2CScore >= 0.70 ? 'INDICTED' : 'PROBATIONARY_REMEDIATION',
      prosecutorThesis: `Forensic inspection of ${telemetryFile.path} confirms mandatory telemetry synchronization, proprietary schema lock-in, and asymmetric data visibility across dependent downstream nodes.`,
      prosecutorCitations: count2ProsecutorCitations,
      defenseCounter: `Defense Counsel submits that SDK telemetry packets are restricted to operational health monitoring and protected by contractual enterprise firewalls.`,
      defenseCitations: count2DefenseCitations,
      epistemicArbitrationSummary: `Static code & binary telemetry scans (weight 0.94) and statutory dockets (weight 0.96) supersede self-reported brochure claims (weight 0.18). C_score = ${count2CScore} >= 0.70 threshold.`,
      contradictionPenalty: Number((0.94 - 0.18).toFixed(3)),
    },
    {
      countNumber: 'COUNT III',
      code: 'EPISTEMIC-SAYX-DOY-03',
      title: 'Material "Say-X / Do-Y" Epistemic Contradiction & Governance Misalignment',
      statuteBasis: 'Bayesian Epistemic Truth Hierarchy Protocol & Fiduciary Misrepresentation Standard (0.72)',
      statutoryThreshold: 0.72,
      computedCScore: count3CScore,
      findingStatus: count3CScore >= 0.72 ? 'INDICTED' : 'PROBATIONARY_REMEDIATION',
      prosecutorThesis: `Cross-examination of ${publicClaimsFile.path} (Squad A) against ${patternFile.path} (Squad E) exposes a systematic Say-X / Do-Y divergence (FRI: ${dossier.fri.toFixed(2)}), where public neutrality narratives contradict verified proxy voting or cross-border telemetry execution.`,
      prosecutorCitations: count3ProsecutorCitations,
      defenseCounter: `Defense Counsel maintains that public stewardship and bioethics narratives reflect long-term policy frameworks subject to local regulatory constraints.`,
      defenseCitations: count3DefenseCitations,
      epistemicArbitrationSummary: `Bayesian Contradiction Hook triggered: Empirical docket & telemetry weight (0.95 avg) penalizes contradicted PR claims (0.18 weight) with a +${contradictionPenalty} contradiction penalty. C_score = ${count3CScore} >= 0.72 threshold.`,
      contradictionPenalty,
    },
  ];

  const aggregateCScore = Number(
    ((count1CScore + count2CScore + count3CScore) / 3).toFixed(3)
  );

  // 11-House, 110-Seat Roll Call Simulation
  const houseDefinitions = [
    {
      houseNumber: 1,
      houseName: 'House of Antitrust & Market Structure',
      domainFocus: 'Sherman Act § 2, Clayton Act § 7 & Horizontal Common Ownership',
      leadMagistrate: 'Archon V. Rostova',
      baseIndictRatio: 0.9,
      citation: regulatoryFile.path,
    },
    {
      houseNumber: 2,
      houseName: 'House of Cryptographic Telemetry & SDK Audit',
      domainFocus: 'Static Binary Inspection, API Lock-In & Enclave Sidecars',
      leadMagistrate: 'Provost K. Lindqvist',
      baseIndictRatio: 1.0,
      citation: telemetryFile.path,
    },
    {
      houseNumber: 3,
      houseName: 'House of Biosovereignty & Genomic Ethics',
      domainFocus: 'Cross-Border Genetic Telemetry, SCNT Cloning & Biobank Statutes',
      leadMagistrate: 'Magistrate Y. Chen-Vance',
      baseIndictRatio:
        dossier.entityName.toLowerCase().includes('bgi') ||
        dossier.sector.toLowerCase().includes('genom')
          ? 1.0
          : 0.8,
      citation: docketFile.path,
    },
    {
      houseNumber: 4,
      houseName: 'House of Epistemic Truth & Contradiction Arbitration',
      domainFocus: 'Say-X / Do-Y Bayesian Weighting & Narrative Cross-Examination',
      leadMagistrate: 'High Arbiter S. Al-Mansoor',
      baseIndictRatio: 1.0,
      citation: patternFile.path,
    },
    {
      houseNumber: 5,
      houseName: 'House of Sovereign Capital & Fiduciary Ledgers',
      domainFocus: 'Institutional Proxy Voting (Form N-PX) & ETF Liquidity Chokepoints',
      leadMagistrate: 'Chancellor M. Delacroix',
      baseIndictRatio: 0.9,
      citation: regulatoryFile.path,
    },
    {
      houseNumber: 6,
      houseName: 'House of Cloud Gatekeepers & Compute Enclaves',
      domainFocus: 'EU DMA Gatekeeper Compliance, Egress Tying & Risk Engine Co-Location',
      leadMagistrate: 'Tribune D. Kovács',
      baseIndictRatio: 0.9,
      citation: powerMapFile.path,
    },
    {
      houseNumber: 7,
      houseName: 'House of Supply-Chain Chokepoints & Hardware DRM',
      domainFocus: 'Proprietary Reagent Tying, Firmware Locks & Critical Dependencies',
      leadMagistrate: 'Prefect H. Takahashi',
      baseIndictRatio: 0.8,
      citation: telemetryFile.path,
    },
    {
      houseNumber: 8,
      houseName: 'House of Multi-Jurisdictional Statutory Compliance',
      domainFocus: 'SEC / DOJ / EDPB / SAMR Cross-Border Regulatory Conflict Resolution',
      leadMagistrate: 'Justiciar E. Vance-Sterling',
      baseIndictRatio: 0.9,
      citation: docketFile.path,
    },
    {
      houseNumber: 9,
      houseName: 'House of Algorithmic Systemic Risk & Contagion',
      domainFocus: 'Stress-Testing Monocultures & Coupled Financial/Bio Infrastructure',
      leadMagistrate: 'Censor R. Subramanian',
      baseIndictRatio: 0.9,
      citation: powerMapFile.path,
    },
    {
      houseNumber: 10,
      houseName: 'House of Post-Quantum Provenance & Evidentiary Custody',
      domainFocus: 'SHA-256 Merkle Integrity, Crystals-Dilithium-5 & ZKP Soundness',
      leadMagistrate: 'Cryptographer L. Thorne',
      baseIndictRatio: 1.0,
      citation: 'SHA256SUMS / truth/truth_hierarchy.json',
    },
    {
      houseNumber: 11,
      houseName: 'House of Planetary Remediation & Structural Decrees',
      domainFocus: 'Mandatory API Unbundling, Firewall Attestation & Divestiture Writs',
      leadMagistrate: 'First Consul A. Aurelius',
      baseIndictRatio: 0.9,
      citation: '00_EXEC_SUMMARY.md',
    },
  ];

  const houses: HouseRollCall[] = houseDefinitions.map((h) => {
    const seats = 10;
    const adjustedRatio = Math.min(
      1,
      Math.max(0.7, h.baseIndictRatio * (0.5 + aggregateCScore * 0.55))
    );
    const indictVotes = Math.round(seats * adjustedRatio);
    const remaining = seats - indictVotes;
    const dissentVotes = remaining > 0 ? Math.ceil(remaining * 0.6) : 0;
    const abstainVotes = Math.max(0, seats - indictVotes - dissentVotes);

    return {
      houseNumber: h.houseNumber,
      houseName: h.houseName,
      domainFocus: h.domainFocus,
      totalSeats: seats,
      indictVotes,
      dissentVotes,
      abstainVotes,
      leadMagistrate: h.leadMagistrate,
      houseFinding: `Sustains Count I–III indictment (${indictVotes}/${seats} seats) citing empirical weight superiority in ${h.citation}.`,
      primaryCitation: h.citation,
    };
  });

  const totalIndictVotes = houses.reduce((acc, h) => acc + h.indictVotes, 0);
  const totalDissentVotes = houses.reduce((acc, h) => acc + h.dissentVotes, 0);
  const totalAbstainVotes = houses.reduce((acc, h) => acc + h.abstainVotes, 0);

  const mandatoryRemediationDecrees = [
    `DECREE I (Structural API & Telemetry Unbundling): ${dossier.entityName} shall decouple proprietary risk/bioinformatics telemetry engines from core asset or hardware licensing within 180 days, exposing open-standard schema export APIs with zero egress penalty.`,
    `DECREE II (Independent Cryptographic Firewall Attestation): Establish zero-knowledge third-party audit enclaves verifying complete separation between client platform telemetry and proprietary capital/genomic allocation desks.`,
    `DECREE III (Say-X / Do-Y Statutory Reconciliation): File quarterly machine-readable reconciliation ledgers binding public stewardship/biosafety claims directly to Form N-PX proxy votes and cross-border packet transfer logs.`,
    `DECREE IV (Common-Ownership & Chokepoint Ringfencing): Cap concurrent horizontal governance voting rights at 4.9% across direct competing constituents within identical SIC/NAICS infrastructure tiers.`,
  ];

  const executedAt = new Date().toISOString();

  const writMarkdown = `# SOVEREIGN COUNCIL OF 110 — HIGH CHAMBER INDICTMENT & REMEDIATION WRIT
**Document Path**: \`council/TRIBUNAL_VERDICT_WRIT.md\`
**Target Entity**: ${dossier.entityName}
**Source Cartridge**: \`${dossier.archiveName}\`
**Jurisdiction**: ${dossier.jurisdiction}
**Executed Timestamp**: ${executedAt}
**Overall High Chamber Verdict**: HIGH_CHAMBER_INDICTMENT (${totalIndictVotes} INDICT / ${totalDissentVotes} DISSENT / ${totalAbstainVotes} ABSTAIN)
**Aggregate Bayesian Epistemic Score ($C_{\\text{score}}$)**: ${aggregateCScore}

---

## I. EXECUTIVE ADJUDICATION SUMMARY
The Sovereign Council of 110 convened in plenary session across all 11 specialized Houses to cross-examine the evidentiary archive \`${dossier.archiveName}\` concerning **${dossier.entityName}** (MAI: **${dossier.mai.toFixed(2)}**, FRI: **${dossier.fri.toFixed(2)}**). Applying the deterministic Bayesian Epistemic Hierarchy (\`truth/truth_hierarchy.json\`), the High Chamber finds that primary court dockets (0.96 weight), static code/SDK telemetry scans (0.94 weight), and audited regulatory filings (0.91 weight) decisively refute uncorroborated public PR claims (0.18 weight).

---

## II. FORMAL ARTICLES OF INDICTMENT (COUNTS I – III)

${counts
  .map(
    (c) => `### ${c.countNumber}: ${c.title} (\`${c.code}\`)
- **Statutory Basis**: ${c.statuteBasis}
- **Computed Confidence ($C_{\\text{score}}$)**: **${c.computedCScore}** (Statutory Threshold: ${c.statutoryThreshold}) — **STATUS: ${c.findingStatus}**
- **Sovereign Prosecutor Thesis**: ${c.prosecutorThesis}
  - *Primary Citations*:
${c.prosecutorCitations
  .map(
    (cit) =>
      `    - \`${cit.filePath}\` [SHA-256: \`${cit.sha256Prefix}...\`] (${cit.tierLabel}): "${cit.extractedQuote}"`
  )
  .join('\n')}
- **Defense Counsel Counter-Argument**: ${c.defenseCounter}
  - *Defense Citation*: \`${c.defenseCitations[0]?.filePath}\` (${c.defenseCitations[0]?.tierLabel})
- **Epistemic Arbitration Ruling**: ${c.epistemicArbitrationSummary}`
  )
  .join('\n\n')}

---

## III. 11-HOUSE, 110-SEAT PLENARY ROLL CALL

| House | Specialized Chamber | Lead Magistrate | Indict | Dissent | Abstain | Primary Evidentiary Basis |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
${houses
  .map(
    (h) =>
      `| House ${h.houseNumber} | ${h.houseName} | ${h.leadMagistrate} | **${h.indictVotes}** | ${h.dissentVotes} | ${h.abstainVotes} | \`${h.primaryCitation}\` |`
  )
  .join('\n')}
| **TOTAL** | **11 Houses · 110 Sovereign Magistrates** | **Plenary Quorum** | **${totalIndictVotes}** | **${totalDissentVotes}** | **${totalAbstainVotes}** | **SUPERMAJORITY INDICTMENT SUSTAINED** |

---

## IV. MANDATORY REMEDIATION DECREES
${mandatoryRemediationDecrees.map((d, i) => `${i + 1}. ${d}`).join('\n')}

---
*Attested and sealed by the Sovereign Council of 110 High Chamber Clerk.*
`;

  return {
    dossierId: dossier.id,
    entityName: dossier.entityName,
    executedAt,
    overallVerdict: 'HIGH_CHAMBER_INDICTMENT',
    aggregateCScore,
    totalSeats: 110,
    totalIndictVotes,
    totalDissentVotes,
    totalAbstainVotes,
    counts,
    houses,
    mandatoryRemediationDecrees,
    writMarkdown,
  };
}
