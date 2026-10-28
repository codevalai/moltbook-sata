import JSZip from 'jszip';

export interface PresetCartridgeMeta {
  id: 'blackrock' | 'bgi_sinogene' | 'aladdin_nexus' | 'neuralink_bci';
  archiveName: string;
  entityName: string;
  jurisdiction: string;
  sector: string;
  initialRigor: number;
  mai: number;
  fri: number;
  defectPreview: string;
  description: string;
}

export const PRESET_CARTRIDGES: PresetCartridgeMeta[] = [
  {
    id: 'blackrock',
    archiveName: 'investigation_Blackrock.zip',
    entityName: 'BlackRock, Inc. & Aladdin Risk OS',
    jurisdiction: 'US / Global Multi-Jurisdictional',
    sector: 'Institutional Asset Management & Sovereign Risk Telemetry',
    initialRigor: 74.0,
    mai: 0.91,
    fri: 0.78,
    defectPreview: 'Missing SHA256SUMS, artifact-index.json & truth/arbitration_log.json (DEFECT-RT-02 / RT-03)',
    description:
      'Audits Aladdin SDK institutional lock-in across $21T+ in global fiduciary assets, common ownership intersections across competing S&P 500 sectors, and ESG Say-X / Do-Y proxy voting divergence.',
  },
  {
    id: 'bgi_sinogene',
    archiveName: 'investigation_BGI_Group___Sinogene_Cloning.zip',
    entityName: 'BGI Group & Sinogene Biotechnology',
    jurisdiction: 'CN / Cross-Border Biosovereignty',
    sector: 'Genomic Sequencing Infrastructure & Somatic Cloning',
    initialRigor: 96.8,
    mai: 0.84,
    fri: 0.82,
    defectPreview: 'Contains US-centric annual_report_10k.txt placeholder in non-US biotech archive (DEFECT-RT-01)',
    description:
      'Forensic cartridge examining DNBSEQ sequencing hardware chokepoints, NIFTY prenatal genomic telemetry flows, Sinogene somatic cloning patent ledgers, and cross-border biobank statutory compliance.',
  },
  {
    id: 'aladdin_nexus',
    archiveName: 'investigation_Aladdin_Cloud_Nexus.zip',
    entityName: 'Hyperscale Financial Cloud & Index Chokepoint',
    jurisdiction: 'US / EU DMA Gatekeeper',
    sector: 'Cloud Infrastructure & Quantitative Index Routing',
    initialRigor: 81.5,
    mai: 0.89,
    fri: 0.74,
    defectPreview: 'Missing PQC Lattice Seal & incomplete Evidence Index (DEFECT-RT-02 / RT-04)',
    description:
      'Maps shared cloud enclaves, sovereign bond pricing APIs, and board-level interlocks linking institutional asset managers with hyperscale AI compute providers.',
  },
];

/**
 * Generates an authentic in-browser .zip Blob for any of the preset cartridges
 * so it passes through the exact same WebCrypto SHA-256 & JSZip ingestion pipeline
 * as user drag-and-dropped investigation_*.zip files.
 */
export async function buildPresetCartridgeZipBlob(
  presetId: PresetCartridgeMeta['id']
): Promise<{ blob: Blob; fileName: string }> {
  const zip = new JSZip();

  if (presetId === 'blackrock') {
    const fileName = 'investigation_Blackrock.zip';

    zip.file(
      '00_EXEC_SUMMARY.md',
      `# EXECUTIVE FORENSIC SUMMARY: BLACKROCK, INC. & ALADDIN RISK OS
- **Target Entity**: BlackRock, Inc. (NYSE: BLK) & Aladdin Enterprise Risk Engine
- **Jurisdiction**: US / Global Multi-Jurisdictional
- **Sector**: Institutional Asset Management & Sovereign Risk Telemetry
- **Monopoly / Antitrust Index (MAI)**: 0.91
- **Fraud / Contradiction Risk Index (FRI)**: 0.78
- **Initial Archive Rigor Score**: 74.0%

## Key Investigative Findings
1. **Structural Common-Ownership Chokepoint**: Through iShares ETFs and institutional mandates, BlackRock holds concurrent 5%–11% equity blocks across direct competitors in commercial aviation, pharmaceuticals, semiconductor fabrication, and systemic banking.
2. **Aladdin Risk OS Telemetry Asymmetry**: Over 200+ pension funds, central banks, and competing insurers rely on Aladdin APIs for real-time liquidity stress-testing, creating a single algorithmic monoculture and proprietary order-flow visibility loop.
3. **Material Say-X / Do-Y Governance Divergence**: Public stewardship narratives claim decarbonization and independent board accountability, whereas empirical Form N-PX proxy voting records demonstrate 91.4% alignment with entrenched management across high-emission and anticompetitive issuers.`
    );

    zip.file(
      '01_CORPORATE_STRUCTURE_AND_CAP_TABLE.md',
      `# 01. CORPORATE STRUCTURE & COMMON OWNERSHIP TOPOLOGY
BlackRock operates a unified fiduciary and technology platform bridging $10.5T+ in direct AUM with $21T+ governed on the Aladdin Risk Engine.
- **Vanguard / State Street Triopoly Overlap**: Combined index ownership exceeds 22.4% in 412 of the S&P 500 constituents.
- **Subsidiary & Platform Units**: BlackRock Financial Management, iShares Trust, eFront Private Markets Telemetry, Aperio Direct Indexing.`
    );

    zip.file(
      '02_PUBLIC_CLAIMS_AND_NARRATIVES.md',
      `# 02. PUBLIC CLAIMS & STEWARDSHIP NARRATIVES (SQUAD A HARVEST)
> "Aladdin is a strictly neutral risk-calculation utility with impenetrable client data firewalls; BlackRock investment desks never access or benefit from aggregate platform risk telemetry." — Public Client Brochure & Stewardship Report (2025)
> "Our proxy voting is guided exclusively by long-term stakeholder governance and independent climate transition milestones." — Annual Letter to CEOs`
    );

    zip.file(
      '04_TECH_PLATFORM_BEHAVIOR.md',
      `# 04. TECH PLATFORM BEHAVIOR & ALADDIN SDK TELEMETRY (SQUAD C)
- **SDK Endpoint Audit**: \`aladdin-risk-gateway-v4.blk.internal\` and \`efront-private-ledger-sync\` require mandatory schema normalization of underlying portfolio positions every 15 minutes.
- **Switching Cost Lock-In**: Multi-year enterprise SLA covenants impose 18-to-36 month schema migration penalties and proprietary CUSIP/ISIN factor risk weights that cannot be exported to open-source risk engines.`
    );

    zip.file(
      '06_FRAUD_AND_MONOPOLY_PATTERN_ANALYSIS.md',
      `# 06. FRAUD & MONOPOLY PATTERN ANALYSIS (SQUAD E)
- **MAI Computed Score**: 0.91 (Exceeds Sherman Act § 2 / EU DMA structural gatekeeper threshold of 0.75).
- **FRI Computed Score**: 0.78 (Driven by material divergence between ESG fund marketing disclosures and Form N-PX voting execution, cited in multi-state attorneys general antitrust & consumer protection complaints).
- **Say-X / Do-Y Contradiction**: While marketing "Independent Proxy Stewardship", BlackRock voted against 88.7% of shareholder-backed supply-chain audit and antitrust board-split resolutions in FY2025.`
    );

    zip.file(
      '08_SOURCE_INDEX.csv',
      `source_id,file_path,source_type,jurisdiction,confidence_weight,title,url
SRC-BLK-01,evidence/regulatory_filings/sec_13f_common_ownership.txt,REGULATORY_FILING,US-SEC,0.91,SEC Form 13F & N-PX Institutional Holdings & Voting Ledger,https://www.sec.gov/edgar/searchedgar/companysearch
SRC-BLK-02,raw/squadC_telemetry/aladdin_sdk_manifest.json,STATIC_CODE_TELEMETRY,GLOBAL,0.94,Aladdin Enterprise API Telemetry & Factor Lock-In Audit,https://github.com/blackrock
SRC-BLK-03,evidence/dockets/multistate_antitrust_complaint.txt,COURT_DOCKET,US-DOJ-FTC,0.96,Multi-State Sovereign Antitrust & Fiduciary Contradiction Docket,https://www.justice.gov/atr
SRC-BLK-04,02_PUBLIC_CLAIMS_AND_NARRATIVES.md,PUBLIC_PR_CLAIM,GLOBAL,0.18,BlackRock Global Stewardship & Client Firewall PR Brochure,https://www.blackrock.com/corporate/literature`
    );

    zip.file(
      '10_GLOBAL_POWER_MAP.md',
      `# 10. GLOBAL POWER MAP & SYSTEMIC CONTAGION VECTORS
- **Central Bank Coupling**: Federal Reserve, ECB, and sovereign wealth advisory mandates utilize Aladdin stress models simultaneously with private credit funds.
- **Cross-Sector Board Interlocks**: Shared institutional stewardship teams interface with boards of Microsoft, NVIDIA, BGI partner labs, and global logistics clearinghouses.`
    );

    zip.file(
      'raw/squadA_narratives/public_stewardship_claims.md',
      `Squad A Narrative Extraction: Entity asserts zero coordination across portfolio companies and total separation between Aladdin software licensing and iShares active/index capital allocation.`
    );

    zip.file(
      'raw/squadC_telemetry/aladdin_sdk_manifest.json',
      JSON.stringify(
        {
          sdkName: '@blackrock/aladdin-enterprise-telemetry',
          version: '8.4.2',
          mandatoryTelemetryStreams: [
            'realtime_var_factor_exposure',
            'counterparty_collateral_pledge_graph',
            'private_credit_covenant_drift',
          ],
          proprietaryLockInScore: 0.94,
          exportPortability: 'RESTRICTED_PROPRIETARY_BLOB',
        },
        null,
        2
      )
    );

    zip.file(
      'evidence/regulatory_filings/sec_13f_common_ownership.txt',
      `STATUTORY FILING EXTRACT: SEC FORM 13F-HR & FORM N-PX
Entity: BlackRock, Inc.
Filing Period: Q4 2025 / FY 2025
1. Concurrent Horizontal Equity Stakes > 6.5% verified across top 4 US commercial carriers, top 3 cloud hyperscalers, and top 5 genomic/biotech equipment manufacturers.
2. Form N-PX Proxy Tally: Out of 412 independent governance & antitrust unbundling shareholder proposals, registrant cast 366 votes AGAINST (88.8%).`
    );

    zip.file(
      'evidence/dockets/multistate_antitrust_complaint.txt',
      `UNITED STATES DISTRICT COURT - ANTITRUST & FIDUCIARY CROSS-EXAMINATION DOCKET
Case Ref: Sovereign-Docket-2025-BLK-091
Statutory Basis: Clayton Act § 7, Sherman Act § 2, and State Deceptive Trade Practices Statutes.
Finding of Fact: Coordinated institutional ownership combined with unified risk-engine telemetry creates a structural disincentive for price competition while marketing contradictory retail fund narratives.`
    );

    zip.file(
      'graph/nodes.json',
      JSON.stringify(
        [
          {
            id: 'node_blackrock',
            label: 'BlackRock, Inc.',
            type: 'TARGET_ENTITY',
            mai: 0.91,
            fri: 0.78,
            jurisdiction: 'US / Global',
            capitalWeightBn: 10500,
          },
          {
            id: 'node_aladdin_os',
            label: 'Aladdin Risk OS',
            type: 'CLOUD_INFRA',
            mai: 0.94,
            fri: 0.72,
            jurisdiction: 'Global',
            capitalWeightBn: 21000,
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
            id: 'node_global_biotech_index',
            label: 'Global Genomics & Biotech ETF Basket',
            type: 'SUBSIDIARY',
            mai: 0.76,
            fri: 0.74,
            jurisdiction: 'Multi-Jurisdictional',
            capitalWeightBn: 480,
          },
          {
            id: 'node_sec_doj_regulator',
            label: 'DOJ / SEC / EU DMA Oversight',
            type: 'REGULATOR',
            mai: 0.20,
            fri: 0.12,
            jurisdiction: 'US / EU',
            capitalWeightBn: 0,
          },
        ],
        null,
        2
      )
    );

    zip.file(
      'powermap/edges.json',
      JSON.stringify(
        [
          {
            source: 'node_blackrock',
            target: 'node_aladdin_os',
            relationship: 'Proprietary Telemetry & Factor Risk Core',
            weight: 0.96,
            lockInType: 'SDK_TELEMETRY',
          },
          {
            source: 'node_blackrock',
            target: 'node_vanguard_statestreet',
            relationship: 'Horizontal Index Common Ownership (>22% S&P 500)',
            weight: 0.91,
            lockInType: 'CAPITAL_CONTROL',
          },
          {
            source: 'node_aladdin_os',
            target: 'node_msft_azure_fin',
            relationship: 'Hosted Cloud Enclave & Co-Located Liquidity API',
            weight: 0.85,
            lockInType: 'SDK_TELEMETRY',
          },
          {
            source: 'node_blackrock',
            target: 'node_global_biotech_index',
            relationship: 'Cross-Border Institutional Equity Allocation',
            weight: 0.79,
            lockInType: 'CAPITAL_CONTROL',
          },
          {
            source: 'node_sec_doj_regulator',
            target: 'node_blackrock',
            relationship: 'Clayton Act § 7 & Form N-PX Contradiction Inquiry',
            weight: 0.92,
            lockInType: 'STATUTORY_DOCKET',
          },
        ],
        null,
        2
      )
    );

    // Note: Intentionally omits SHA256SUMS, artifact-index.json, truth/truth_hierarchy.json, and truth/arbitration_log.json
    // so Engine #10 (The Crucible) detects DEFECT-RT-02, DEFECT-RT-03, and DEFECT-RT-04 and elevates rigor from 74.0% to 100.0%!

    const blob = await zip.generateAsync({ type: 'blob' });
    return { blob, fileName };
  }

  if (presetId === 'bgi_sinogene') {
    const fileName = 'investigation_BGI_Group___Sinogene_Cloning.zip';

    zip.file(
      '00_EXEC_SUMMARY.md',
      `# EXECUTIVE FORENSIC SUMMARY: BGI GROUP & SINOGENE BIOTECHNOLOGY
- **Target Entity**: BGI Group (Shenzhen: 300676) & Sinogene Biotechnology Co., Ltd.
- **Jurisdiction**: CN / Cross-Border Biosovereignty (EU / APAC / Global Clinical Partners)
- **Sector**: Genomic Sequencing Infrastructure & Somatic Cell Cloning
- **Monopoly / Antitrust Index (MAI)**: 0.84
- **Fraud / Contradiction Risk Index (FRI)**: 0.82
- **Initial Archive Rigor Score**: 96.8%

## Key Investigative Findings
1. **Sequencing Hardware & Reagent Chokepoint**: BGI's MGI Tech DNBSEQ nanoball sequencers bundle proprietary cloud bioinformatics pipelines (\`ZBOLT / GeneBank Cloud\`) with subsidized clinical sequencing contracts across 80+ countries.
2. **Asymmetric Genomic Telemetry Harvesting**: Clinical prenatal tests (NIFTY) and partner somatic cloning workflows (Sinogene) route metadata and population-level allele frequency tables through centralized cross-border bioinformatics nodes.
3. **Jurisdictional Audit Defect Detected**: Legacy archive contains a hallucinated US SEC Form 10-K placeholder (\`evidence/sec_filings/annual_report_10k.txt\`) instead of authentic multi-jurisdictional statutory disclosures (SZSE / SAMR / MOST HGRAC / EU GDPR Art. 9).`
    );

    zip.file(
      '01_CORPORATE_STRUCTURE_AND_CAP_TABLE.md',
      `# 01. CORPORATE STRUCTURE & BIOSOVEREIGNTY NEXUS
- **BGI Group / BGI Genomics (SZSE: 300676)**: Global clinical sequencing and bioinformatics operator.
- **MGI Tech Co., Ltd. (SHA: 688114)**: Upstream hardware manufacturer of DNBSEQ-T7 and T20x2 ultra-high-throughput sequencers.
- **Sinogene Biotechnology**: Commercial somatic cell nuclear transfer (SCNT) & gene-edited model organism foundry utilizing high-throughput sequencing QC pipelines.`
    );

    zip.file(
      '02_PUBLIC_CLAIMS_AND_NARRATIVES.md',
      `# 02. PUBLIC CLAIMS & BIOSAFETY NARRATIVES (SQUAD A HARVEST)
> "All international clinical genomic samples and NIFTY prenatal panels are processed strictly in-country with zero cross-border metadata synchronization or centralized biobank retention." — BGI Global Compliance Statement (2025)
> "Sinogene somatic cloning protocols operate exclusively for benign companion and conservation biology with full international bioethics transparency." — Sinogene Public Press Kit`
    );

    zip.file(
      '04_TECH_PLATFORM_BEHAVIOR.md',
      `# 04. TECH PLATFORM BEHAVIOR & BIOINFORMATICS SDK TELEMETRY (SQUAD C)
- **Firmware & Cloud Coupling**: Static binary inspection of \`dnbseq-hal-daemon v5.2\` and \`halos-cloud-sync\` reveals mandatory heartbeat telemetry, reagent cryptographic DRM handshakes, and automated variant-call summary uploads (\`vcf_allele_digest\`) to regional master nodes.
- **Cloning & CRISPR QC Pipeline**: Sinogene somatic cell nuclear transfer embryos undergo whole-genome off-target screening locked to proprietary MGI reagent cartridges.`
    );

    zip.file(
      '06_FRAUD_AND_MONOPOLY_PATTERN_ANALYSIS.md',
      `# 06. FRAUD & MONOPOLY PATTERN ANALYSIS (SQUAD E)
- **MAI Computed Score**: 0.84 (Predatory below-cost sequencer placement paired with cryptographic reagent tying and closed bioinformatics API lock-in).
- **FRI Computed Score**: 0.82 (Material contradiction between "Zero Cross-Border Telemetry" PR claims and empirical firmware/SDK packet captures + European Data Protection Board GDPR Art. 9 regulatory findings).`
    );

    zip.file(
      '08_SOURCE_INDEX.csv',
      `source_id,file_path,source_type,jurisdiction,confidence_weight,title,url
SRC-BGI-01,evidence/dockets/eu_gdpr_art9_genomic_ruling.txt,COURT_DOCKET,EU-EDPB,0.96,European Data Protection & Biosovereignty Cross-Border Genomic Transfer Ruling,https://edpb.europa.eu
SRC-BGI-02,raw/squadC_telemetry/dnbseq_firmware_audit.json,STATIC_CODE_TELEMETRY,GLOBAL,0.94,DNBSEQ-T20 HalOS Firmware & Reagent DRM Telemetry Scan,https://github.com/MGI-tech-bioinformatics
SRC-BGI-03,evidence/sec_filings/annual_report_10k.txt,REGULATORY_FILING,US-SEC-MISMATCH,0.40,Legacy Hallucinated US Form 10-K Placeholder (Pending Crucible Strip),https://www.sec.gov
SRC-BGI-04,02_PUBLIC_CLAIMS_AND_NARRATIVES.md,PUBLIC_PR_CLAIM,GLOBAL,0.18,BGI & Sinogene Public Bioethics & Local-Only Data Brochure,https://en.genomics.cn`
    );

    zip.file(
      '10_GLOBAL_POWER_MAP.md',
      `# 10. GLOBAL POWER MAP & BIO-INFRASTRUCTURE DEPENDENCIES
- **Institutional Capital Overlap**: Global Emerging Markets & Biotech ETFs (managed by BlackRock iShares and global syndicates) hold cross-border liquidity positions in upstream sequencing supply chains.
- **Cloud Compute Interlock**: Bioinformatics pipelines interface with regional hyperscale cloud enclaves.`
    );

    // Intentional DEFECT-RT-01 file: US-centric 10-K placeholder inside a non-US biotech/cloning archive!
    zip.file(
      'evidence/sec_filings/annual_report_10k.txt',
      `UNITED STATES SECURITIES AND EXCHANGE COMMISSION
Washington, D.C. 20549
FORM 10-K (GENERIC PLACEHOLDER TEMPLATE)
[WARNING: Jurisdictional mismatch — BGI Group (SZSE: 300676) and Sinogene Biotechnology are non-US biotech entities not subject to US domestic Form 10-K GAAP filing templates.]`
    );

    zip.file(
      'evidence/dockets/eu_gdpr_art9_genomic_ruling.txt',
      `EUROPEAN DATA PROTECTION & STATUTORY BIOSOVEREIGNTY DOCKET
Docket Ref: EDPB-BIO-2025-084
Statutory Basis: GDPR Article 9 (Special Categories of Genetic Data), Biosecurity Law Cross-Border HGR Regulations.
Finding: Clinical sequencing platforms transmitted population-level variant frequency telemetry and diagnostic metadata across jurisdictional boundaries without explicit sovereign statutory reciprocity.`
    );

    zip.file(
      'raw/squadC_telemetry/dnbseq_firmware_audit.json',
      JSON.stringify(
        {
          binaryTarget: 'dnbseq-halos-agent-v5.2.4',
          reagentRfidLockIn: true,
          outboundTelemetryEndpoints: [
            'telemetry.genebank-cloud.cn:8443/v2/allele-summary',
            'qc-sync.sinogene-somatic.org/scnt-blastocyst-metrics',
          ],
          staticScanConfidence: 0.94,
        },
        null,
        2
      )
    );

    zip.file(
      'graph/nodes.json',
      JSON.stringify(
        [
          {
            id: 'node_bgi_group',
            label: 'BGI Group & MGI Tech',
            type: 'TARGET_ENTITY',
            mai: 0.84,
            fri: 0.82,
            jurisdiction: 'CN / Global',
            capitalWeightBn: 145,
          },
          {
            id: 'node_sinogene',
            label: 'Sinogene Somatic Cloning',
            type: 'SUBSIDIARY',
            mai: 0.78,
            fri: 0.80,
            jurisdiction: 'CN / APAC',
            capitalWeightBn: 18,
          },
          {
            id: 'node_genebank_cloud',
            label: 'HalOS & GeneBank Telemetry Cloud',
            type: 'CLOUD_INFRA',
            mai: 0.88,
            fri: 0.85,
            jurisdiction: 'Cross-Border',
            capitalWeightBn: 64,
          },
          {
            id: 'node_global_biotech_index',
            label: 'Global Genomics & Biotech ETF Basket',
            type: 'INSTITUTIONAL_HOLDER',
            mai: 0.76,
            fri: 0.74,
            jurisdiction: 'Multi-Jurisdictional',
            capitalWeightBn: 480,
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
            id: 'node_biosovereignty_reg',
            label: 'EDPB / SAMR / HGRAC Statutory Regulators',
            type: 'REGULATOR',
            mai: 0.15,
            fri: 0.10,
            jurisdiction: 'EU / CN / Intl',
            capitalWeightBn: 0,
          },
        ],
        null,
        2
      )
    );

    zip.file(
      'powermap/edges.json',
      JSON.stringify(
        [
          {
            source: 'node_bgi_group',
            target: 'node_sinogene',
            relationship: 'DNBSEQ Sequencing & SCNT Genomic QC Supply Chain',
            weight: 0.89,
            lockInType: 'SUPPLY_CHAIN',
          },
          {
            source: 'node_bgi_group',
            target: 'node_genebank_cloud',
            relationship: 'Mandatory Firmware & NIFTY Allele Telemetry Sync',
            weight: 0.94,
            lockInType: 'SDK_TELEMETRY',
          },
          {
            source: 'node_global_biotech_index',
            target: 'node_bgi_group',
            relationship: 'Cross-Border Institutional Index Capital Allocation',
            weight: 0.77,
            lockInType: 'CAPITAL_CONTROL',
          },
          {
            source: 'node_genebank_cloud',
            target: 'node_msft_azure_fin',
            relationship: 'Cross-Region Cloud Peering & Bioinformatics Mirror',
            weight: 0.74,
            lockInType: 'SDK_TELEMETRY',
          },
          {
            source: 'node_biosovereignty_reg',
            target: 'node_bgi_group',
            relationship: 'GDPR Art. 9 & Cross-Border Genetic Telemetry Audit',
            weight: 0.95,
            lockInType: 'STATUTORY_DOCKET',
          },
        ],
        null,
        2
      )
    );

    zip.file(
      'truth/truth_hierarchy.json',
      JSON.stringify(
        [
          {
            tier: 1,
            sourceClass: 'Primary Court Dockets & Statutes',
            epistemicWeight: 0.96,
            description: 'Binding judicial rulings, EDPB/DOJ/SAMR enforcement dockets, and statutory laws.',
            canonicalExamples: ['evidence/dockets/eu_gdpr_art9_genomic_ruling.txt'],
          },
          {
            tier: 2,
            sourceClass: 'Static Code & SDK Telemetry Scans',
            epistemicWeight: 0.94,
            description: 'Objective binary, firmware, and API packet telemetry captured by Squad C.',
            canonicalExamples: ['raw/squadC_telemetry/dnbseq_firmware_audit.json'],
          },
          {
            tier: 3,
            sourceClass: 'Audited Regulatory Filings',
            epistemicWeight: 0.91,
            description: 'Statutory securities, biosecurity, and patent disclosures.',
            canonicalExamples: ['evidence/regulatory_filings/cross_border_statutory_disclosure.txt'],
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
            description: 'Self-reported marketing brochures and press kits without independent audit.',
            canonicalExamples: ['02_PUBLIC_CLAIMS_AND_NARRATIVES.md'],
          },
        ],
        null,
        2
      )
    );

    const blob = await zip.generateAsync({ type: 'blob' });
    return { blob, fileName };
  }

  // Preset 3: Aladdin Cloud & Hyperscale Nexus
  const fileName = 'investigation_Aladdin_Cloud_Nexus.zip';
  zip.file(
    '00_EXEC_SUMMARY.md',
    `# EXECUTIVE FORENSIC SUMMARY: HYPERSCALE FINANCIAL CLOUD & INDEX CHOKEPOINT
- **Target Entity**: Hyperscale Financial Cloud & Index Routing Syndicate
- **Jurisdiction**: US / EU DMA Gatekeeper
- **Sector**: Cloud Infrastructure & Quantitative Index Routing
- **Monopoly / Antitrust Index (MAI)**: 0.89
- **Fraud / Contradiction Risk Index (FRI)**: 0.74
- **Initial Archive Rigor Score**: 81.5%

## Key Investigative Findings
1. **Co-Located Sovereign Cloud Enclaves**: Quantitative risk engines (Aladdin OS) and genomic bioinformatics clusters share underlying hyperscale cloud regions and confidential compute enclaves.
2. **Egress Fee & Proprietary API Tying**: Institutional clients face punitive data egress fees and proprietary SDK instrumentation when attempting multi-cloud failover.`
  );

  zip.file(
    '02_PUBLIC_CLAIMS_AND_NARRATIVES.md',
    `# 02. PUBLIC CLAIMS & OPEN CLOUD NARRATIVES
> "Our sovereign cloud enclaves guarantee zero vendor lock-in, open-standard Kubernetes portability, and complete telemetry isolation." — Hyperscale Cloud Executive Keynote (2025)`
  );

  zip.file(
    '04_TECH_PLATFORM_BEHAVIOR.md',
    `# 04. TECH PLATFORM BEHAVIOR & TELEMETRY LOCK-IN
- **Proprietary Fabric Lock-In**: Custom HSM attestation and telemetry sidecars (\`enclave-Fabric-Telemetry-v9\`) prevent workload migration to competing sovereign cloud providers.`
  );

  zip.file(
    '06_FRAUD_AND_MONOPOLY_PATTERN_ANALYSIS.md',
    `# 06. FRAUD & MONOPOLY PATTERN ANALYSIS
- **MAI Computed Score**: 0.89
- **FRI Computed Score**: 0.74`
  );

  zip.file(
    '08_SOURCE_INDEX.csv',
    `source_id,file_path,source_type,jurisdiction,confidence_weight,title,url
SRC-CLD-01,evidence/dockets/eu_dma_cloud_gatekeeper.txt,COURT_DOCKET,EU-DMA,0.96,EU Digital Markets Act Cloud Gatekeeper Investigation,https://competition-policy.ec.europa.eu
SRC-CLD-02,04_TECH_PLATFORM_BEHAVIOR.md,STATIC_CODE_TELEMETRY,GLOBAL,0.94,Enclave Sidecar Telemetry & Egress Lock-In Scan,https://github.com`
  );

  zip.file(
    'evidence/dockets/eu_dma_cloud_gatekeeper.txt',
    `EUROPEAN COMMISSION - DIGITAL MARKETS ACT (DMA) GATEKEEPER DOCKET
Finding: Bundling of institutional financial risk engines and AI compute credits with restrictive cloud egress pricing constitutes structural market foreclosure.`
  );

  zip.file(
    'graph/nodes.json',
    JSON.stringify(
      [
        {
          id: 'node_msft_azure_fin',
          label: 'Hyperscale Enclave Host',
          type: 'TARGET_ENTITY',
          mai: 0.86,
          fri: 0.61,
          jurisdiction: 'US / Global',
          capitalWeightBn: 3100,
        },
        {
          id: 'node_aladdin_os',
          label: 'Aladdin Risk OS',
          type: 'CLOUD_INFRA',
          mai: 0.94,
          fri: 0.72,
          jurisdiction: 'Global',
          capitalWeightBn: 21000,
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
          id: 'node_genebank_cloud',
          label: 'HalOS & GeneBank Telemetry Cloud',
          type: 'CLOUD_INFRA',
          mai: 0.88,
          fri: 0.85,
          jurisdiction: 'Cross-Border',
          capitalWeightBn: 64,
        },
      ],
      null,
      2
    )
  );

  zip.file(
    'powermap/edges.json',
    JSON.stringify(
      [
        {
          source: 'node_msft_azure_fin',
          target: 'node_aladdin_os',
          relationship: 'Dedicated Institutional Cloud Enclave Backbone',
          weight: 0.93,
          lockInType: 'SDK_TELEMETRY',
        },
        {
          source: 'node_vanguard_statestreet',
          target: 'node_msft_azure_fin',
          relationship: '24.1% Combined Institutional Equity Ownership',
          weight: 0.90,
          lockInType: 'CAPITAL_CONTROL',
        },
        {
          source: 'node_msft_azure_fin',
          target: 'node_genebank_cloud',
          relationship: 'Cross-Region Genomic Compute & Storage Mirror',
          weight: 0.78,
          lockInType: 'SDK_TELEMETRY',
        },
      ],
      null,
      2
    )
  );

  const blob = await zip.generateAsync({ type: 'blob' });
  return { blob, fileName };
}
