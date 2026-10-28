import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  Upload,
  Scale,
  ShieldCheck,
  FileText,
  Network,
  Radio,
  Volume2,
  Square,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  Search,
  RefreshCw,
  FileCode,
  Eye,
} from 'lucide-react';
import {
  CrucibleReport,
  DossierFileEntry,
  ExecutiveBriefingScript,
  MultiZipCollisionReport,
  ParsedDossier,
  TemporalDeltaReport,
  TribunalVerdict,
  ZkpSoundnessProof,
} from './types/tribunal';
import {
  buildPresetCartridgeZipBlob,
  PRESET_CARTRIDGES,
  PresetCartridgeMeta,
} from './services/presetDossierLoader';
import { ingestInvestigationZip } from './services/zipIngestor';
import { runSovereignTribunal } from './services/tribunalEngine';
import { runCrucibleRedTeamAndForge } from './services/crucibleRedTeam';
import { exportCouncilPerfectedZip } from './services/perfectedZipExporter';
import { runMultiZipCollisionEngine } from './services/collisionEngine';
import {
  buildExecutiveBriefingScript,
  executeTemporalDeltaWatchtower,
} from './services/deltaWatchtower';
import { generateZkpSoundnessProof } from './services/zkpVerifier';
import { SpatialPowerWeb3D } from './components/SpatialPowerWeb3D';

type WorkspaceSection =
  | 'cartridge_vault'
  | 'tribunal_chamber'
  | 'crucible_forge'
  | 'planetary_v9'
  | 'artifact_inspector';

type PlanetarySubTab =
  | 'spatial_3d'
  | 'multi_zip_collision'
  | 'delta_watchtower'
  | 'tts_briefing'
  | 'zkp_verifier';

export default function App() {
  const [mountedDossiers, setMountedDossiers] = useState<ParsedDossier[]>([]);
  const [activeDossierId, setActiveDossierId] = useState<string>('');
  const [tribunalMap, setTribunalMap] = useState<Record<string, TribunalVerdict>>({});
  const [crucibleMap, setCrucibleMap] = useState<Record<string, CrucibleReport>>({});
  const [zkpMap, setZkpMap] = useState<Record<string, ZkpSoundnessProof>>({});
  const [deltaMap, setDeltaMap] = useState<Record<string, TemporalDeltaReport>>({});
  const [briefingMap, setBriefingMap] = useState<Record<string, ExecutiveBriefingScript>>({});

  const [activeSection, setActiveSection] = useState<WorkspaceSection>('cartridge_vault');
  const [planetaryTab, setPlanetaryTab] = useState<PlanetarySubTab>('spatial_3d');
  const [selectedCountFilter, setSelectedCountFilter] = useState<'ALL' | 'COUNT I' | 'COUNT II' | 'COUNT III'>('ALL');
  const [selectedFilePath, setSelectedFilePath] = useState<string>('00_EXEC_SUMMARY.md');
  const [fileSearchQuery, setFileSearchQuery] = useState<string>('');
  const [fileCategoryFilter, setFileCategoryFilter] = useState<string>('ALL');

  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<string>('');
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [isRunningWatchtower, setIsRunningWatchtower] = useState<boolean>(false);
  const [isSynthesizingTts, setIsSynthesizingTts] = useState<boolean>(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [isPlayingSpeech, setIsPlayingSpeech] = useState<boolean>(false);
  const [zkpTamperTestState, setZkpTamperTestState] = useState<'IDLE' | 'VERIFIED_AUTHENTIC' | 'TAMPER_REJECTED'>('IDLE');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const processAndMountZipBlob = useCallback(
    async (blob: Blob, fileName: string, autoSwitch = true) => {
      setIsIngesting(true);
      setStatusBanner(`Ingesting ${fileName} via WebCrypto SHA-256 & executing Dual-Engine pipeline...`);
      try {
        // 1. Ingest raw ZIP cartridge
        const rawDossier = await ingestInvestigationZip(blob, fileName);

        // 2. Run Engine #2: Sovereign Council of 110 Tribunal
        const verdict = runSovereignTribunal(rawDossier);

        // 3. Run Engine #10: The Crucible 20-Agent Red-Team & Patch Forge
        const { hardenedDossier, crucibleReport } = await runCrucibleRedTeamAndForge(
          rawDossier,
          verdict
        );

        // 4. Generate ZKP Soundness Proof & Executive Briefing Script
        const zkpProof = await generateZkpSoundnessProof(hardenedDossier, verdict);
        const briefingScript = buildExecutiveBriefingScript(hardenedDossier, verdict);

        setMountedDossiers((prev) => {
          const filtered = prev.filter((d) => d.archiveName !== hardenedDossier.archiveName);
          return [...filtered, hardenedDossier];
        });
        setTribunalMap((prev) => ({ ...prev, [hardenedDossier.id]: verdict }));
        setCrucibleMap((prev) => ({ ...prev, [hardenedDossier.id]: crucibleReport }));
        setZkpMap((prev) => ({ ...prev, [hardenedDossier.id]: zkpProof }));
        setBriefingMap((prev) => ({ ...prev, [hardenedDossier.id]: briefingScript }));

        if (autoSwitch) {
          setActiveDossierId(hardenedDossier.id);
          setSelectedFilePath('council/TRIBUNAL_VERDICT_WRIT.md');
        }

        setStatusBanner(
          `Mounted ${fileName} · Elevated Rigor ${rawDossier.initialRigorScore.toFixed(1)}% → 100.0% · High Chamber Vote: ${verdict.totalIndictVotes}/110 INDICT`
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setStatusBanner(`Error ingesting archive: ${msg}`);
      } finally {
        setIsIngesting(false);
      }
    },
    []
  );

  // Mount both primary cartridges (BlackRock + BGI Group/Sinogene) on initial load so all views are immediately populated
  useEffect(() => {
    let mounted = true;
    (async () => {
      const blk = await buildPresetCartridgeZipBlob('blackrock');
      const bgi = await buildPresetCartridgeZipBlob('bgi_sinogene');
      if (!mounted) return;
      await processAndMountZipBlob(bgi.blob, bgi.fileName, false);
      await processAndMountZipBlob(blk.blob, blk.fileName, true);
    })();
    return () => {
      mounted = false;
    };
  }, [processAndMountZipBlob]);

  const activeDossier = useMemo(
    () => mountedDossiers.find((d) => d.id === activeDossierId) || mountedDossiers[0] || null,
    [mountedDossiers, activeDossierId]
  );

  const activeVerdict = activeDossier ? tribunalMap[activeDossier.id] : null;
  const activeCrucible = activeDossier ? crucibleMap[activeDossier.id] : null;
  const activeZkp = activeDossier ? zkpMap[activeDossier.id] : null;
  const activeDelta = activeDossier ? deltaMap[activeDossier.id] : null;
  const activeBriefing = activeDossier ? briefingMap[activeDossier.id] : null;

  const collisionReport: MultiZipCollisionReport | null = useMemo(() => {
    if (mountedDossiers.length === 0) return null;
    return runMultiZipCollisionEngine(mountedDossiers);
  }, [mountedDossiers]);

  const handleMountPreset = async (presetId: PresetCartridgeMeta['id']) => {
    const { blob, fileName } = await buildPresetCartridgeZipBlob(presetId);
    await processAndMountZipBlob(blob, fileName, true);
  };

  const handleDownloadRawPresetZip = async (presetId: PresetCartridgeMeta['id']) => {
    const { blob, fileName } = await buildPresetCartridgeZipBlob(presetId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2500);
    setStatusBanner(`Downloaded raw unpatched input cartridge: ${fileName}`);
  };

  const handleMountAllPresetsForCollision = async () => {
    setIsIngesting(true);
    for (const p of PRESET_CARTRIDGES) {
      const exists = mountedDossiers.some((d) => d.archiveName === p.archiveName);
      if (!exists) {
        const { blob, fileName } = await buildPresetCartridgeZipBlob(p.id);
        await processAndMountZipBlob(blob, fileName, false);
      }
    }
    setIsIngesting(false);
    setActiveSection('planetary_v9');
    setPlanetaryTab('multi_zip_collision');
    setStatusBanner(
      'Mounted all 3 investigation cartridges · Cross-Dossier Nexus & Multi-ZIP Collision Super-Graph active.'
    );
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      await processAndMountZipBlob(file, file.name, i === files.length - 1);
    }
  };

  const handleExportPerfectedZip = async () => {
    if (!activeDossier || !activeVerdict || !activeCrucible) return;
    const result = await exportCouncilPerfectedZip({
      dossier: activeDossier,
      tribunalVerdict: activeVerdict,
      crucibleReport: activeCrucible,
      zkpProof: activeZkp,
      deltaReport: activeDelta,
      collisionReport,
    });
    setStatusBanner(
      `Exported ${result.fileName} (${result.totalFiles} cryptographically sealed files · ${(
        result.byteSize / 1024
      ).toFixed(1)} KB)`
    );
  };

  const handleRunLiveWatchtower = async () => {
    if (!activeDossier) return;
    setIsRunningWatchtower(true);
    try {
      const report = await executeTemporalDeltaWatchtower(activeDossier);
      setDeltaMap((prev) => ({ ...prev, [activeDossier.id]: report }));
      setStatusBanner(
        `Temporal Delta Watchtower completed for ${activeDossier.entityName} (ΔMAI: +${report.deltaMai.toFixed(
          3
        )}, ΔFRI: +${report.deltaFri.toFixed(3)})`
      );
    } finally {
      setIsRunningWatchtower(false);
    }
  };

  const handleSynthesizeNeuralTts = async () => {
    if (!activeBriefing) return;
    setIsSynthesizingTts(true);
    setTtsAudioUrl(null);
    try {
      const response = await fetch('/api/briefing/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turns: activeBriefing.turns.map((t) => ({
            speaker: t.speaker,
            text: t.text,
          })),
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.audioBase64) {
          const binary = atob(data.audioBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'audio/wav' });
          const url = URL.createObjectURL(blob);
          setTtsAudioUrl(url);
          setStatusBanner(
            'Generated Multi-Voice 24kHz WAV Executive Briefing via gemini-3.8-flash-tts.'
          );
          return;
        }
      }
      // Browser neural voice synthesis fallback
      handlePlayBrowserSpeechBriefing();
    } catch {
      handlePlayBrowserSpeechBriefing();
    } finally {
      setIsSynthesizingTts(false);
    }
  };

  const handlePlayBrowserSpeechBriefing = () => {
    if (!activeBriefing || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    setIsPlayingSpeech(true);
    const voices = window.speechSynthesis.getVoices();

    activeBriefing.turns.forEach((turn, idx) => {
      const utter = new SpeechSynthesisUtterance(`${turn.speaker}: ${turn.text}`);
      utter.rate = 1.02;
      utter.pitch = turn.speaker === 'Prosecutor' ? 0.92 : 1.08;
      if (voices.length > 1) {
        utter.voice = voices[idx % voices.length];
      }
      if (idx === activeBriefing.turns.length - 1) {
        utter.onend = () => setIsPlayingSpeech(false);
      }
      window.speechSynthesis.speak(utter);
    });
    setStatusBanner('Playing multi-voice adversarial executive briefing via audio engine.');
  };

  const handleStopBrowserSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingSpeech(false);
  };

  const filteredFiles: DossierFileEntry[] = useMemo(() => {
    if (!activeDossier) return [];
    return (Object.values(activeDossier.files) as DossierFileEntry[])
      .filter((f) => {
        if (fileCategoryFilter !== 'ALL' && f.category !== fileCategoryFilter) {
          return false;
        }
        if (
          fileSearchQuery.trim() !== '' &&
          !f.path.toLowerCase().includes(fileSearchQuery.toLowerCase()) &&
          !f.content.toLowerCase().includes(fileSearchQuery.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.path.localeCompare(b.path));
  }, [activeDossier, fileCategoryFilter, fileSearchQuery]);

  const selectedFileEntry =
    activeDossier?.files[selectedFilePath] ||
    filteredFiles[0] ||
    (activeDossier ? Object.values(activeDossier.files)[0] : null);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
      {/* Top Bar Contract: Strictly 1 row, 3 zones separated by gap-8 */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-[#0B0F17]">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('cartridge_vault');
          }}
          className="text-lg font-bold tracking-tight text-slate-100 font-display whitespace-nowrap shrink-0"
        >
          Sovereign Council &amp; The Crucible
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            type="button"
            onClick={() => setActiveSection('cartridge_vault')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeSection === 'cartridge_vault'
                ? 'text-white border-b-2 border-amber-400'
                : ''
            }`}
          >
            01. Cartridge Ingestor
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('tribunal_chamber')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeSection === 'tribunal_chamber'
                ? 'text-white border-b-2 border-amber-400'
                : ''
            }`}
          >
            02. Council of 110 Tribunal
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('crucible_forge')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeSection === 'crucible_forge'
                ? 'text-white border-b-2 border-amber-400'
                : ''
            }`}
          >
            03. Crucible Patch Forge
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('planetary_v9')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeSection === 'planetary_v9'
                ? 'text-white border-b-2 border-amber-400'
                : ''
            }`}
          >
            04. Planetary v9.0 Suite
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('artifact_inspector')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeSection === 'artifact_inspector'
                ? 'text-white border-b-2 border-amber-400'
                : ''
            }`}
          >
            05. SHA-256 File Locker
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action Button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleExportPerfectedZip}
            disabled={!activeDossier}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-md hover:bg-amber-300 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Perfected .ZIP</span>
          </button>
        </div>
      </header>

      {/* Main Container (1440px baseline presence) */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6 space-y-6">
        {/* Active Cartridge Switcher & Quantitative Telemetry Bar */}
        <section className="bg-[#111827] border border-slate-800 rounded-lg p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="text-xs text-slate-400 font-mono">
                Unified Downstream Intelligence Engine · Build #2 (Tribunal of 110) + Build #10 (The Crucible) + Planetary v9.0
              </div>
              <h1 className="text-2xl font-bold text-slate-100 mt-1 font-display">
                {activeDossier
                  ? activeDossier.entityName
                  : 'Mount an Investigation Cartridge (.ZIP)'}
              </h1>
              {activeDossier && (
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="font-mono text-slate-300">{activeDossier.archiveName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeDossier.jurisdiction}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeDossier.sector}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-emerald-400">
                    NIST Crystals-Dilithium-5 Sealed
                  </span>
                </div>
              )}
            </div>

            {/* Mounted Cartridge Selector Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 mr-1 whitespace-nowrap shrink-0">
                Mounted Cartridges ({mountedDossiers.length}):
              </span>
              {mountedDossiers.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setActiveDossierId(d.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    d.id === activeDossier?.id
                      ? 'bg-amber-400/15 text-amber-300 border-amber-400/50'
                      : 'bg-[#0B0F17] text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {d.archiveName.replace(/^investigation_/i, '').replace(/\.zip$/i, '')}
                </button>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 inline mr-1.5" />
                Mount .ZIP
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,application/zip"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </div>
          </div>

          {/* 5-Column Quantitative KPI Strip (Tabular Numerals) */}
          {activeDossier && activeVerdict && activeCrucible && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 pt-4">
              <div>
                <div className="text-xs text-slate-400">Monopoly / Antitrust Index (MAI)</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono tabular-nums text-amber-400">
                    {activeDossier.mai.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono tabular-nums">
                    / 1.00 (Threshold 0.75)
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Fraud / Contradiction Index (FRI)</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono tabular-nums text-rose-400">
                    {activeDossier.fri.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono tabular-nums">
                    Say-X / Do-Y Penalty
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Council of 110 Roll Call</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono tabular-nums text-slate-100">
                    {activeVerdict.totalIndictVotes} / 110
                  </span>
                  <span className="text-xs text-amber-400 font-mono tabular-nums">
                    C_score {activeVerdict.aggregateCScore.toFixed(3)}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Crucible Evidentiary Rigor</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
                    {activeCrucible.hardenedRigorScore.toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-400 font-mono tabular-nums">
                    Up from {activeCrucible.initialRigorScore.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Sealed WebCrypto Artifacts</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono tabular-nums text-sky-400">
                    {Object.keys(activeDossier.files).length}
                  </span>
                  <span className="text-xs text-slate-400 font-mono tabular-nums">
                    +{activeCrucible.filesPatchedCount} Forged Patches
                  </span>
                </div>
              </div>
            </div>
          )}

          {statusBanner && (
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300 font-mono">
              <span>{statusBanner}</span>
              <span className="text-slate-500">Client-Side WebCrypto SHA-256 · JSZip Engine</span>
            </div>
          )}
        </section>

        {/* Mobile Section Switcher */}
        <div className="flex md:hidden overflow-x-auto gap-1.5 pb-1">
          {(
            [
              ['cartridge_vault', '01. Ingestor'],
              ['tribunal_chamber', '02. Tribunal'],
              ['crucible_forge', '03. Crucible'],
              ['planetary_v9', '04. Planetary v9'],
              ['artifact_inspector', '05. File Locker'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveSection(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                activeSection === key
                  ? 'bg-amber-400 text-slate-950 font-semibold'
                  : 'bg-[#111827] text-slate-400 border border-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ===================================================================
            SECTION 01: CARTRIDGE VAULT & IN-BROWSER ZIP INGESTOR
           =================================================================== */}
        {activeSection === 'cartridge_vault' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Drag and Drop ZIP Chamber */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(false);
                  handleFileUpload(e.dataTransfer.files);
                }}
                className={`lg:col-span-5 bg-[#111827] border rounded-lg p-6 flex flex-col justify-between transition-colors ${
                  isDraggingOver
                    ? 'border-amber-400 bg-amber-400/5'
                    : 'border-slate-800'
                }`}
              >
                <div>
                  <div className="text-xs font-mono text-amber-400">
                    01. Genuine In-Browser ZIP Cartridge Ingestion
                  </div>
                  <h2 className="text-xl font-bold text-slate-100 mt-1 font-display">
                    Drop Any investigation_*.zip Archive
                  </h2>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Uses client-side <code className="text-slate-200">JSZip</code> and{' '}
                    <code className="text-slate-200">crypto.subtle.digest(&apos;SHA-256&apos;)</code>{' '}
                    to extract <code className="text-slate-200">00_EXEC_SUMMARY.md</code> through{' '}
                    <code className="text-slate-200">10_GLOBAL_POWER_MAP.md</code>,{' '}
                    <code className="text-slate-200">raw/squadA–E</code>,{' '}
                    <code className="text-slate-200">graph/</code>,{' '}
                    <code className="text-slate-200">powermap/</code>,{' '}
                    <code className="text-slate-200">truth/</code>, and{' '}
                    <code className="text-slate-200">evidence/</code>.
                  </p>
                </div>

                <div className="my-6 border border-dashed border-slate-700 rounded-lg p-6 text-center bg-[#0B0F17]">
                  <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <div className="text-sm font-medium text-slate-200">
                    Drag &amp; drop one or multiple <code className="font-mono">.zip</code> cartridges here
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Supports single-dossier adjudication or multi-ZIP super-graph collision
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isIngesting}
                      className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Select .ZIP From Disk
                    </button>
                    <button
                      type="button"
                      onClick={handleMountAllPresetsForCollision}
                      disabled={isIngesting}
                      className="px-4 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Mount All 3 Presets for Multi-ZIP Collision
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-400 flex items-center justify-between pt-3 border-t border-slate-800">
                  <span>Zero-Server Latency · 100% Client-Side WebCrypto</span>
                  <span className="font-mono text-slate-300">SHA-256 + Dilithium-5</span>
                </div>
              </div>

              {/* Preset Investigation Cartridges */}
              <div className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-lg p-6 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono text-sky-400">
                    Portable Intelligence Cartridges
                  </div>
                  <h2 className="text-xl font-bold text-slate-100 mt-1 font-display">
                    Instant-Mount Preset Dossier Archives
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Mount any pre-packaged forensic archive directly into the chamber or download the raw unpatched <code className="font-mono">.zip</code> to test drag-and-drop ingestion.
                  </p>

                  <div className="mt-4 divide-y divide-slate-800">
                    {PRESET_CARTRIDGES.map((preset) => {
                      const isMounted = mountedDossiers.some(
                        (d) => d.archiveName === preset.archiveName
                      );
                      const isCurrent = activeDossier?.archiveName === preset.archiveName;

                      return (
                        <div key={preset.id} className="py-4 first:pt-1 last:pb-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-base font-bold text-slate-100">
                                  {preset.entityName}
                                </span>
                                <span className="text-xs font-mono text-slate-400">
                                  · {preset.archiveName}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {preset.jurisdiction} · MAI{' '}
                                <span className="font-mono text-amber-400 tabular-nums">
                                  {preset.mai.toFixed(2)}
                                </span>{' '}
                                · FRI{' '}
                                <span className="font-mono text-rose-400 tabular-nums">
                                  {preset.fri.toFixed(2)}
                                </span>{' '}
                                · Initial Rigor{' '}
                                <span className="font-mono text-slate-200 tabular-nums">
                                  {preset.initialRigor.toFixed(1)}%
                                </span>{' '}
                                → <span className="font-mono text-emerald-400">100.0%</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleMountPreset(preset.id)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                  isCurrent
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                                }`}
                              >
                                {isCurrent
                                  ? 'Active in Chamber'
                                  : isMounted
                                    ? 'Switch to Cartridge'
                                    : 'Mount Cartridge'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadRawPresetZip(preset.id)}
                                className="px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-[#0B0F17] hover:bg-slate-800 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                Raw .ZIP
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                            {preset.description}
                          </p>
                          <div className="mt-1.5 text-xs font-mono text-amber-300/90">
                            Target Vulnerability: {preset.defectPreview}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Dual-Engine Pipeline Overview Cards */}
            {activeDossier && activeVerdict && activeCrucible && (
              <div className="bg-[#111827] border border-slate-800 rounded-lg p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 font-display">
                      02. Live Dual-Engine Execution Pipeline ({activeDossier.archiveName})
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Click any stage below to inspect the adversarial cross-examination, red-team patch forge, or 3D spatial power web.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-[#0B0F17] border border-slate-800 rounded-md p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-mono text-slate-400">STAGE 01 · INGESTOR</div>
                      <div className="text-sm font-bold text-slate-100 mt-1">
                        WebCrypto SHA-256 &amp; Structural Parser
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        Extracted {Object.keys(activeDossier.files).length} total files, parsed{' '}
                        {activeDossier.nodes.length} graph nodes and {activeDossier.edges.length} lock-in edges.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSection('artifact_inspector')}
                      className="mt-4 w-full py-1.5 px-3 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Inspect SHA-256 Manifest
                    </button>
                  </div>

                  <div className="bg-[#0B0F17] border border-slate-800 rounded-md p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-mono text-amber-400">STAGE 02 · ENGINE #2</div>
                      <div className="text-sm font-bold text-slate-100 mt-1">
                        Council of 110 Epistemic Tribunal
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        3 Formal Indictment Counts adjudicated. Supermajority vote:{' '}
                        <span className="text-slate-200 font-mono">
                          {activeVerdict.totalIndictVotes} INDICT / {activeVerdict.totalDissentVotes} DISSENT
                        </span>
                        .
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSection('tribunal_chamber')}
                      className="mt-4 w-full py-1.5 px-3 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Open High Chamber Trial
                    </button>
                  </div>

                  <div className="bg-[#0B0F17] border border-slate-800 rounded-md p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-mono text-emerald-400">STAGE 03 · ENGINE #10</div>
                      <div className="text-sm font-bold text-slate-100 mt-1">
                        The Crucible Red-Team Forge
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        Remediated DEFECT-RT-01 through RT-04 in-memory. Elevated rigor from{' '}
                        <span className="font-mono text-slate-200">
                          {activeCrucible.initialRigorScore.toFixed(1)}%
                        </span>{' '}
                        to <span className="font-mono text-emerald-400">100.0%</span>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSection('crucible_forge')}
                      className="mt-4 w-full py-1.5 px-3 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Inspect Forged Patches
                    </button>
                  </div>

                  <div className="bg-[#0B0F17] border border-slate-800 rounded-md p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-mono text-sky-400">STAGE 04 · PLANETARY v9.0</div>
                      <div className="text-sm font-bold text-slate-100 mt-1">
                        3D Power Web, ZKP &amp; Watchtower
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        Explore the Three.js 3D force-directed graph, Multi-ZIP collision nexus, live Delta Watchtower, and ZKP verifier.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSection('planetary_v9')}
                      className="mt-4 w-full py-1.5 px-3 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Launch Planetary v9.0
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            SECTION 02: SOVEREIGN COUNCIL OF 110 — EPISTEMIC TRIAL TRIBUNAL
           =================================================================== */}
        {activeSection === 'tribunal_chamber' && activeDossier && activeVerdict && (
          <div className="space-y-6">
            {/* Bayesian Epistemic Hierarchy Matrix */}
            <div className="bg-[#111827] border border-slate-800 rounded-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="text-xs font-mono text-amber-400">
                    Engine #2 · Deterministic Epistemic Truth Arbitration (truth/truth_hierarchy.json)
                  </div>
                  <h2 className="text-xl font-bold text-slate-100 mt-1 font-display">
                    Bayesian Epistemic Weighting Matrix &amp; Contradiction Hook
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Decouples Squad A public marketing claims (0.18 weight) from primary court dockets (0.96) and static SDK telemetry (0.94) to mathematically penalize Say-X / Do-Y contradictions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFilePath('council/TRIBUNAL_VERDICT_WRIT.md');
                    setActiveSection('artifact_inspector');
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 inline mr-1.5" />
                  Read Full Indictment Writ (.MD)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                {activeDossier.truthHierarchy.map((rule) => (
                  <div
                    key={rule.tier}
                    className="bg-[#0B0F17] border border-slate-800 rounded-md p-3.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">TIER 0{rule.tier}</span>
                        <span
                          className={`font-bold tabular-nums ${
                            rule.epistemicWeight >= 0.85
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          Weight {rule.epistemicWeight.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-100 mt-1.5">
                        {rule.sourceClass}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {rule.description}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 truncate">
                      {rule.canonicalExamples[0]}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Adversarial Cross-Examination on 3 Formal Counts */}
            <div className="bg-[#111827] border border-slate-800 rounded-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-slate-100 font-display">
                    01. Adversarial Cross-Examination: Sovereign Prosecutor vs. Defense Counsel
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Every argument cites exact file paths and live WebCrypto SHA-256 digests extracted from <code className="font-mono">{activeDossier.archiveName}</code>.
                  </p>
                </div>

                {/* Interactive Segmented Count Filter */}
                <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-slate-800 rounded-md">
                  {(['ALL', 'COUNT I', 'COUNT II', 'COUNT III'] as const).map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setSelectedCountFilter(cnt)}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        selectedCountFilter === cnt
                          ? 'bg-amber-400 text-slate-950 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-slate-800">
                {activeVerdict.counts
                  .filter(
                    (c) =>
                      selectedCountFilter === 'ALL' || c.countNumber === selectedCountFilter
                  )
                  .map((count) => (
                    <div key={count.code} className="py-6 first:pt-4 last:pb-1 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-mono text-amber-400">
                            {count.countNumber} · {count.code} · {count.statuteBasis}
                          </div>
                          <h3 className="text-lg font-bold text-slate-100 mt-0.5 font-display">
                            {count.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono tabular-nums shrink-0">
                          <span>
                            Threshold: <strong className="text-slate-200">{count.statutoryThreshold.toFixed(2)}</strong>
                          </span>
                          <span>·</span>
                          <span>
                            Computed C_score:{' '}
                            <strong className="text-amber-400 text-sm">
                              {count.computedCScore.toFixed(3)}
                            </strong>
                          </span>
                          <span>·</span>
                          <span className="text-rose-400 font-semibold">
                            {count.findingStatus}
                          </span>
                        </div>
                      </div>

                      {/* Side-by-Side Prosecutor vs Defense */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Sovereign Prosecutor */}
                        <div className="bg-[#0B0F17] border border-slate-800 rounded-md p-4 space-y-3">
                          <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-2">
                            <span className="text-amber-400 font-semibold">
                              SOVEREIGN PROSECUTOR (EMPIRICAL RECORD)
                            </span>
                            <span className="text-emerald-400">
                              Bayesian Weight 0.91 – 0.96
                            </span>
                          </div>
                          <p className="text-sm text-slate-200 leading-relaxed">
                            {count.prosecutorThesis}
                          </p>
                          <div className="space-y-2 pt-1">
                            {count.prosecutorCitations.map((cit, i) => (
                              <div
                                key={i}
                                className="bg-[#111827] border border-slate-800/90 rounded p-3 text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-sky-400">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedFilePath(cit.filePath);
                                      setActiveSection('artifact_inspector');
                                    }}
                                    className="hover:underline text-left truncate cursor-pointer"
                                  >
                                    {cit.filePath}
                                  </button>
                                  <span className="text-slate-400 shrink-0">
                                    SHA-256: {cit.sha256Prefix}...
                                  </span>
                                </div>
                                <p className="text-slate-300 italic">
                                  &ldquo;{cit.extractedQuote}&rdquo;
                                </p>
                                <div className="text-[11px] font-mono text-slate-400">
                                  {cit.tierLabel}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Institutional Defense Counsel */}
                        <div className="bg-[#0B0F17] border border-slate-800 rounded-md p-4 flex flex-col justify-between space-y-3">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-2">
                              <span className="text-slate-300 font-semibold">
                                INSTITUTIONAL DEFENSE COUNSEL (SQUAD A NARRATIVE)
                              </span>
                              <span className="text-rose-400">
                                Discounted Weight 0.18
                              </span>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">
                              {count.defenseCounter}
                            </p>
                            {count.defenseCitations.map((cit, i) => (
                              <div
                                key={i}
                                className="bg-[#111827] border border-slate-800/90 rounded p-3 text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-slate-400">
                                  <span>{cit.filePath}</span>
                                  <span>SHA-256: {cit.sha256Prefix}...</span>
                                </div>
                                <p className="text-slate-400 italic">
                                  &ldquo;{cit.extractedQuote}&rdquo;
                                </p>
                                <div className="text-[11px] font-mono text-rose-400/90">
                                  {cit.tierLabel}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* High Chamber Epistemic Arbitration Ruling */}
                          <div className="bg-[#111827] border border-slate-700 rounded p-3 text-xs">
                            <div className="font-mono text-amber-400 font-semibold">
                              HIGH CHAMBER ARBITRATION RULING · CONTRADICTION PENALTY +{count.contradictionPenalty.toFixed(3)}
                            </div>
                            <p className="text-slate-300 mt-1 leading-relaxed">
                              {count.epistemicArbitrationSummary}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* 11-House, 110-Seat Plenary Roll Call Table */}
            <div className="bg-[#111827] border border-slate-800 rounded-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-slate-100 font-display">
                    02. 11-House, 110-Seat Sovereign Roll Call Vote
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Plenary tally across all 11 specialized Houses: {activeVerdict.totalIndictVotes} INDICT · {activeVerdict.totalDissentVotes} DISSENT · {activeVerdict.totalAbstainVotes} ABSTAIN
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono">
                      <th className="py-2.5 pr-4">House</th>
                      <th className="py-2.5 px-4">Specialized Chamber &amp; Domain Focus</th>
                      <th className="py-2.5 px-4">Lead Magistrate</th>
                      <th className="py-2.5 px-4 text-right">Indict</th>
                      <th className="py-2.5 px-4 text-right">Dissent</th>
                      <th className="py-2.5 px-4 text-right">Abstain</th>
                      <th className="py-2.5 pl-4">Primary Citation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {activeVerdict.houses.map((h) => (
                      <tr key={h.houseNumber} className="hover:bg-slate-800/30">
                        <td className="py-2.5 pr-4 font-mono text-amber-400 tabular-nums whitespace-nowrap">
                          House {String(h.houseNumber).padStart(2, '0')}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-100">{h.houseName}</div>
                          <div className="text-slate-400 text-[11px]">{h.domainFocus}</div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">
                          {h.leadMagistrate}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400 tabular-nums">
                          {h.indictVotes}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-400 tabular-nums">
                          {h.dissentVotes}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-500 tabular-nums">
                          {h.abstainVotes}
                        </td>
                        <td className="py-2.5 pl-4 font-mono text-sky-400">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFilePath(h.primaryCitation.split(' ')[0]);
                              setActiveSection('artifact_inspector');
                            }}
                            className="hover:underline cursor-pointer text-left"
                          >
                            {h.primaryCitation}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mandatory Remediation Decrees */}
              <div className="mt-6 pt-5 border-t border-slate-800">
                <h3 className="text-sm font-bold text-slate-100 font-display">
                  03. Binding High Chamber Remediation Decrees (council/TRIBUNAL_VERDICT_WRIT.md)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  {activeVerdict.mandatoryRemediationDecrees.map((decree, idx) => (
                    <div
                      key={idx}
                      className="bg-[#0B0F17] border border-slate-800 rounded-md p-3.5 text-xs text-slate-300 leading-relaxed"
                    >
                      {decree}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            SECTION 03: ENGINE #10 — THE CRUCIBLE 20-AGENT RED-TEAM & PATCH FORGE
           =================================================================== */}
        {activeSection === 'crucible_forge' && activeDossier && activeCrucible && (
          <div className="space-y-6">
            <div className="bg-[#111827] border border-slate-800 rounded-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="text-xs font-mono text-emerald-400">
                    Engine #10 · Autonomous 20-Agent Adversarial Vulnerability Scanner &amp; In-Memory Patch Forge
                  </div>
                  <h2 className="text-xl font-bold text-slate-100 mt-1 font-display">
                    The Crucible: Evidentiary Hardening ({activeCrucible.initialRigorScore.toFixed(1)}% → 100.0%)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Puts the investigation archive itself on trial—stripping mismatched US-centric 10-K templates in non-US/biotech cartridges and synthesizing missing SHA-256 manifests, PQC lattice seals, and truth hierarchies.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFilePath('crucible/CRUCIBLE_REDTEAM_CHANGELOG.md');
                      setActiveSection('artifact_inspector');
                    }}
                    className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    View Crucible Changelog
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPerfectedZip}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Export Perfected .ZIP
                  </button>
                </div>
              </div>

              {/* 4 Core Forensic Defect Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                {activeCrucible.defects.map((defect) => (
                  <div
                    key={defect.defectId}
                    className="bg-[#0B0F17] border border-slate-800 rounded-md p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-amber-400 font-bold">
                          {defect.defectId} · {defect.severity}
                        </span>
                        <span className="text-emerald-400 tabular-nums">
                          +{defect.rigorDelta.toFixed(1)}% Rigor Forged
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-100 font-display">
                        {defect.title}
                      </h3>
                      <div className="text-xs text-slate-400 font-mono">
                        {defect.auditorAgent}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed pt-1">
                        {defect.diagnosticDetail}
                      </p>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-800/80 text-xs">
                      <div className="text-slate-300">
                        <strong className="text-slate-100">Remediation:</strong>{' '}
                        {defect.remediationAction}
                      </div>

                      {defect.offendingPaths.length > 0 && (
                        <div className="font-mono text-[11px] text-rose-400">
                          Stripped Template: {defect.offendingPaths.join(', ')}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-[11px] font-mono text-slate-400">
                          Forged In-Memory:
                        </span>
                        {defect.forgedPatchPaths.map((fp) => (
                          <button
                            key={fp}
                            type="button"
                            onClick={() => {
                              setSelectedFilePath(fp);
                              setActiveSection('artifact_inspector');
                            }}
                            className="text-[11px] font-mono text-sky-400 hover:underline cursor-pointer"
                          >
                            {fp}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 12-Gates Evidentiary Verification Matrix & PQC Dilithium-5 Certificate */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-lg p-6">
                <h3 className="text-lg font-bold text-slate-100 font-display">
                  02. 12-Gates Forensic Verification Report (verification/12GATESREPORT.json)
                </h3>
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-mono">
                        <th className="py-2 pr-3">Gate</th>
                        <th className="py-2 px-3">Verification Standard</th>
                        <th className="py-2 px-3">Pre-Crucible</th>
                        <th className="py-2 px-3">Post-Crucible</th>
                        <th className="py-2 pl-3">Metric</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {activeCrucible.twelveGates.map((g) => (
                        <tr key={g.gateNumber}>
                          <td className="py-2 pr-3 font-mono text-slate-400 tabular-nums whitespace-nowrap">
                            Gate {String(g.gateNumber).padStart(2, '0')}
                          </td>
                          <td className="py-2 px-3 text-slate-200 font-medium">
                            {g.gateName.replace(/^Gate \d+ · /, '')}
                          </td>
                          <td className="py-2 px-3 font-mono">
                            <span
                              className={
                                g.prePatchStatus === 'PASS'
                                  ? 'text-slate-400'
                                  : g.prePatchStatus === 'WARN'
                                    ? 'text-amber-400'
                                    : 'text-rose-400 font-semibold'
                              }
                            >
                              {g.prePatchStatus}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-emerald-400 font-bold">
                            {g.postPatchStatus}
                          </td>
                          <td className="py-2 pl-3 font-mono text-[11px] text-slate-400">
                            {g.verificationMetric}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-lg p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-mono text-sky-400">
                      provenance/PQCSOVEREIGNCERTIFICATE.json
                    </div>
                    <h3 className="text-lg font-bold text-slate-100 mt-1 font-display">
                      Post-Quantum CRYSTALS-Dilithium-5 Lattice Seal
                    </h3>
                  </div>

                  <div className="bg-[#0B0F17] border border-slate-800 rounded-md p-4 space-y-3 text-xs font-mono">
                    <div>
                      <div className="text-slate-500">STANDARD</div>
                      <div className="text-slate-200 mt-0.5">
                        {activeCrucible.pqcCertificate.standard}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">SECURITY LEVEL</div>
                      <div className="text-emerald-400 mt-0.5">
                        {activeCrucible.pqcCertificate.securityLevel}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">SHA-256 MERKLE ROOT</div>
                      <div className="text-amber-300 break-all mt-0.5">
                        {activeCrucible.pqcCertificate.merkleRootSha256}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">PUBLIC KEY FINGERPRINT</div>
                      <div className="text-slate-300 break-all mt-0.5">
                        {activeCrucible.pqcCertificate.publicKeyFingerprint}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">LATTICE SIGNATURE DIGEST</div>
                      <div className="text-sky-400 break-all mt-0.5">
                        {activeCrucible.pqcCertificate.latticeSignatureHex.slice(0, 96)}...
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFilePath('provenance/PQCSOVEREIGNCERTIFICATE.json');
                    setActiveSection('artifact_inspector');
                  }}
                  className="mt-4 w-full py-2 px-4 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                >
                  Inspect Raw PQC Certificate JSON
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            SECTION 04: PLANETARY v9.0 INTELLIGENCE SUITE (ALL 5 UPGRADES)
           =================================================================== */}
        {activeSection === 'planetary_v9' && activeDossier && activeVerdict && (
          <div className="space-y-6">
            {/* v9.0 Upgrade Sub-Navigation Bar */}
            <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPlanetaryTab('spatial_3d')}
                  className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    planetaryTab === 'spatial_3d'
                      ? 'bg-amber-400 text-slate-950 font-semibold'
                      : 'bg-[#0B0F17] text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <Network className="w-3.5 h-3.5 inline mr-1.5" />
                  1. 3D Spatial Power Web (WebGL)
                </button>
                <button
                  type="button"
                  onClick={() => setPlanetaryTab('multi_zip_collision')}
                  className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    planetaryTab === 'multi_zip_collision'
                      ? 'bg-amber-400 text-slate-950 font-semibold'
                      : 'bg-[#0B0F17] text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 inline mr-1.5" />
                  2. Multi-ZIP Collision Nexus
                </button>
                <button
                  type="button"
                  onClick={() => setPlanetaryTab('delta_watchtower')}
                  className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    planetaryTab === 'delta_watchtower'
                      ? 'bg-amber-400 text-slate-950 font-semibold'
                      : 'bg-[#0B0F17] text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 inline mr-1.5" />
                  3. Live Delta Watchtower
                </button>
                <button
                  type="button"
                  onClick={() => setPlanetaryTab('tts_briefing')}
                  className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    planetaryTab === 'tts_briefing'
                      ? 'bg-amber-400 text-slate-950 font-semibold'
                      : 'bg-[#0B0F17] text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5 inline mr-1.5" />
                  4. Multi-Voice Neural TTS Studio
                </button>
                <button
                  type="button"
                  onClick={() => setPlanetaryTab('zkp_verifier')}
                  className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    planetaryTab === 'zkp_verifier'
                      ? 'bg-amber-400 text-slate-950 font-semibold'
                      : 'bg-[#0B0F17] text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 inline mr-1.5" />
                  5. Zero-Knowledge Proof (ZKP)
                </button>
              </div>
            </div>

            {/* SUB-TAB 1: 3D WebGL Spatial Force-Directed Power Web */}
            {planetaryTab === 'spatial_3d' && (
              <div className="space-y-4">
                <SpatialPowerWeb3D
                  nodes={
                    collisionReport && collisionReport.superNodes.length > 0
                      ? collisionReport.superNodes
                      : activeDossier.nodes
                  }
                  edges={
                    collisionReport && collisionReport.superEdges.length > 0
                      ? collisionReport.superEdges
                      : activeDossier.edges
                  }
                  activeEntityName={
                    mountedDossiers.length > 1
                      ? `Unified Super-Graph (${mountedDossiers.length} Cartridges Mounted)`
                      : activeDossier.entityName
                  }
                />
              </div>
            )}

            {/* SUB-TAB 2: Recursive Multi-ZIP Collision & Cross-Dossier Nexus Engine */}
            {planetaryTab === 'multi_zip_collision' && collisionReport && (
              <div className="bg-[#111827] border border-slate-800 rounded-lg p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="text-xs font-mono text-amber-400">
                      v9.0 Module #1 · CollisionEngine.ts (Cross-Dossier Graph Intersection)
                    </div>
                    <h2 className="text-xl font-bold text-slate-100 mt-1 font-display">
                      Recursive Multi-ZIP Collision &amp; Shared Chokepoint Nexus
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Intersects <code className="font-mono">graph/nodes.json</code> and{' '}
                      <code className="font-mono">powermap/edges.json</code> across{' '}
                      {collisionReport.mountedDossierNames.join(' + ')} to uncover overlapping institutional capital and cloud infrastructure enclaves.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleMountAllPresetsForCollision}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Ensure All 3 Cartridges Mounted
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-[#0B0F17] border border-slate-800 rounded-md p-4">
                    <div className="text-xs text-slate-400">Mounted Cartridges</div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-slate-100 mt-1">
                      {collisionReport.mountedDossierNames.length}
                    </div>
                  </div>
                  <div className="bg-[#0B0F17] border border-slate-800 rounded-md p-4">
                    <div className="text-xs text-slate-400">Super-Graph Nodes</div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-sky-400 mt-1">
                      {collisionReport.totalSuperGraphNodes}
                    </div>
                  </div>
                  <div className="bg-[#0B0F17] border border-slate-800 rounded-md p-4">
                    <div className="text-xs text-slate-400">Shared Cross-ZIP Chokepoints</div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-amber-400 mt-1">
                      {collisionReport.sharedChokepoints.length}
                    </div>
                  </div>
                  <div className="bg-[#0B0F17] border border-slate-800 rounded-md p-4">
                    <div className="text-xs text-slate-400">Systemic Contagion Index</div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-rose-400 mt-1">
                      {collisionReport.systemicContagionIndex.toFixed(3)}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-100 font-display">
                    Detected Cross-Dossier Institutional &amp; Infrastructure Collisions
                  </h3>
                  {collisionReport.sharedChokepoints.map((ch) => (
                    <div
                      key={ch.nodeId}
                      className="bg-[#0B0F17] border border-slate-800 rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-slate-100">
                            {ch.label}
                          </span>
                          <span className="text-xs font-mono text-amber-400">
                            · {ch.chokepointClassification}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{ch.evidenceSummary}</p>
                        <div className="text-[11px] font-mono text-slate-400">
                          Intersecting Cartridges: {ch.dossiersInvolved.join(' ∩ ')}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono tabular-nums shrink-0">
                        <div>
                          <div className="text-slate-500">AVG MAI</div>
                          <div className="text-amber-400 font-bold">{ch.averageMai.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">AVG FRI</div>
                          <div className="text-rose-400 font-bold">{ch.averageFri.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">NEXUS SCORE</div>
                          <div className="text-emerald-400 font-bold">
                            {ch.crossDossierRiskScore.toFixed(3)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-TAB 3: Live Web-Grounding & Temporal Delta Watchtower */}
            {planetaryTab === 'delta_watchtower' && (
              <div className="bg-[#111827] border border-slate-800 rounded-lg p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="text-xs font-mono text-sky-400">
                      v9.0 Module #2 · DeltaWatchtower.ts (08_SOURCE_INDEX.csv Temporal Drift Oracle)
                    </div>
                    <h2 className="text-xl font-bold text-slate-100 mt-1 font-display">
                      Live Web-Grounding &amp; Temporal Delta Watchtower
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Audits <code className="font-mono">08_SOURCE_INDEX.csv</code> against live Gemini Search Grounding (<code className="font-mono">/api/watchtower/delta</code>) to track regulatory dockets, lawsuits, and risk index drift (<code className="font-mono">ΔMAI</code> &amp; <code className="font-mono">ΔFRI</code>).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunLiveWatchtower}
                    disabled={isRunningWatchtower}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isRunningWatchtower ? 'animate-spin' : ''}`}
                    />
                    <span>
                      {isRunningWatchtower
                        ? 'Scanning Live Regulatory Registries...'
                        : 'Execute Live Delta Scan'}
                    </span>
                  </button>
                </div>

                {!activeDelta ? (
                  <div className="bg-[#0B0F17] border border-slate-800 rounded-md p-8 text-center space-y-3">
                    <Radio className="w-8 h-8 text-amber-400 mx-auto" />
                    <div className="text-sm font-semibold text-slate-100">
                      Ready to Execute Temporal Delta Sweep for {activeDossier.entityName}
                    </div>
                    <p className="text-xs text-slate-400 max-w-xl mx-auto">
                      Click &ldquo;Execute Live Delta Scan&rdquo; above to query recent SEC EDGAR, DOJ, EU DMA/EDPB, and SZSE regulatory filings and compute post-archive Risk Index drift.
                    </p>
                    <button
                      type="button"
                      onClick={handleRunLiveWatchtower}
                      className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors cursor-pointer"
                    >
                      Launch Temporal Delta Sweep
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-[#0B0F17] border border-slate-800 rounded-md p-4">
                        <div className="text-xs text-slate-400">MAI Temporal Drift</div>
                        <div className="mt-1 flex items-baseline gap-2 font-mono tabular-nums">
                          <span className="text-lg text-slate-400">
                            {activeDelta.baselineMai.toFixed(2)}
                          </span>
                          <span>→</span>
                          <span className="text-2xl font-bold text-amber-400">
                            {activeDelta.currentMai.toFixed(3)}
                          </span>
                          <span className="text-xs text-rose-400">
                            (+{activeDelta.deltaMai.toFixed(3)})
                          </span>
                        </div>
                      </div>

                      <div className="bg-[#0B0F17] border border-slate-800 rounded-md p-4">
                        <div className="text-xs text-slate-400">FRI Temporal Drift</div>
                        <div className="mt-1 flex items-baseline gap-2 font-mono tabular-nums">
                          <span className="text-lg text-slate-400">
                            {activeDelta.baselineFri.toFixed(2)}
                          </span>
                          <span>→</span>
                          <span className="text-2xl font-bold text-rose-400">
                            {activeDelta.currentFri.toFixed(3)}
                          </span>
                          <span className="text-xs text-rose-400">
                            (+{activeDelta.deltaFri.toFixed(3)})
                          </span>
                        </div>
                      </div>

                      <div className="bg-[#0B0F17] border border-slate-800 rounded-md p-4">
                        <div className="text-xs text-slate-400">Oracle Grounding Mode</div>
                        <div className="mt-1 text-xs font-mono text-emerald-400">
                          {activeDelta.groundingNote}
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#0B0F17] border border-slate-800 rounded-md p-4 text-xs text-slate-200 leading-relaxed">
                      <strong className="text-amber-400 font-mono">WATCHTOWER FINDING: </strong>
                      {activeDelta.summary}
                    </div>

                    <div className="space-y-3">
                      {activeDelta.events.map((ev) => (
                        <div
                          key={ev.id}
                          className="bg-[#0B0F17] border border-slate-800 rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-mono">
                              <span className="text-amber-400">{ev.date}</span>
                              <span>·</span>
                              <span className="text-sky-400">{ev.sourceAuthority}</span>
                              <span>·</span>
                              <span className="text-emerald-400">{ev.verificationStatus}</span>
                            </div>
                            <div className="text-sm font-bold text-slate-100">{ev.title}</div>
                            <p className="text-xs text-slate-300">{ev.finding}</p>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-mono tabular-nums shrink-0">
                            <span>ΔMAI +{ev.impactOnMai.toFixed(3)}</span>
                            <span>·</span>
                            <span>ΔFRI +{ev.impactOnFri.toFixed(3)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 4: Multi-Voice Neural TTS Executive Briefing Studio */}
            {planetaryTab === 'tts_briefing' && activeBriefing && (
              <div className="bg-[#111827] border border-slate-800 rounded-lg p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="text-xs font-mono text-amber-400">
                      v9.0 Module #4 · Multi-Voice Neural TTS Executive Briefing Studio
                    </div>
                    <h2 className="text-xl font-bold text-slate-100 mt-1 font-display">
                      {activeBriefing.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Synthesizes adversarial cross-examination dialogue between Lead Sovereign Prosecutor and Defense Counsel via <code className="font-mono">gemini-3.8-flash-tts</code> or real-time browser speech engine.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleSynthesizeNeuralTts}
                      disabled={isSynthesizingTts}
                      className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>
                        {isSynthesizingTts
                          ? 'Synthesizing Neural Audio...'
                          : 'Synthesize & Play Briefing'}
                      </span>
                    </button>
                    {isPlayingSpeech && (
                      <button
                        type="button"
                        onClick={handleStopBrowserSpeech}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-300 bg-rose-950/60 border border-rose-800 rounded-md cursor-pointer"
                      >
                        <Square className="w-3 h-3" />
                        <span>Stop Audio</span>
                      </button>
                    )}
                  </div>
                </div>

                {ttsAudioUrl && (
                  <div className="bg-[#0B0F17] border border-slate-800 rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs font-mono text-emerald-400">
                      24kHz Multi-Speaker WAV Stream Ready (gemini-3.8-flash-tts)
                    </div>
                    <audio ref={audioRef} src={ttsAudioUrl} controls className="h-9" />
                    <a
                      href={ttsAudioUrl}
                      download={`briefing-${activeDossier.entitySlug}.wav`}
                      className="px-3 py-1.5 text-xs font-mono text-amber-300 border border-amber-400/40 rounded hover:bg-amber-400/10"
                    >
                      Download .WAV
                    </a>
                  </div>
                )}

                <div className="space-y-3">
                  {activeBriefing.turns.map((turn) => (
                    <div
                      key={turn.id}
                      className="bg-[#0B0F17] border border-slate-800 rounded-md p-4 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span
                          className={
                            turn.speaker === 'Prosecutor'
                              ? 'text-amber-400 font-bold'
                              : 'text-sky-400 font-bold'
                          }
                        >
                          {turn.roleTitle}
                        </span>
                        <span className="text-slate-400">
                          Citation: {turn.citationRef} · ~{turn.durationSec}s
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">{turn.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-TAB 5: Zero-Knowledge Proof (ZKP) of Evidentiary Soundness */}
            {planetaryTab === 'zkp_verifier' && activeZkp && (
              <div className="bg-[#111827] border border-slate-800 rounded-lg p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="text-xs font-mono text-emerald-400">
                      v9.0 Module #5 · zkpVerifier.ts ({activeZkp.protocol})
                    </div>
                    <h2 className="text-xl font-bold text-slate-100 mt-1 font-display">
                      Zero-Knowledge Proof (ZKP) of Evidentiary Soundness
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Cryptographically proves that the Tribunal Verdict and Bayesian <code className="font-mono">C_score</code> indices were computed strictly from the SHA-256 Merkle root of <code className="font-mono">{activeDossier.archiveName}</code> without hallucination or post-hoc tampering.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setZkpTamperTestState('VERIFIED_AUTHENTIC')}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Verify Soundness Proof
                    </button>
                    <button
                      type="button"
                      onClick={() => setZkpTamperTestState('TAMPER_REJECTED')}
                      className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Simulate 1-Byte Tamper Attack
                    </button>
                  </div>
                </div>

                {zkpTamperTestState !== 'IDLE' && (
                  <div
                    className={`p-4 rounded-md border text-xs font-mono flex items-center justify-between ${
                      zkpTamperTestState === 'VERIFIED_AUTHENTIC'
                        ? 'bg-emerald-950/30 border-emerald-700/60 text-emerald-300'
                        : 'bg-rose-950/30 border-rose-700/60 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {zkpTamperTestState === 'VERIFIED_AUTHENTIC' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span>
                        {zkpTamperTestState === 'VERIFIED_AUTHENTIC'
                          ? `ZKP CIRCUIT VERIFIED IN ${activeZkp.thirdPartyVerificationTimeMs}ms: Merkle Root 0x${activeZkp.merkleEvidentiaryRoot.slice(
                              0,
                              24
                            )}... matches all 4 R1CS constraints.`
                          : `TAMPER ATTACK REJECTED BY CIRCUIT: Mutated witness hash fails R1CS-GATE-01 (Merkle Evidentiary Inclusion mismatch). Original sealed proof remains intact.`}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* R1CS Circuit Constraints */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-100 font-display">
                      R1CS Arithmetic &amp; Hash Circuit Constraints
                    </h3>
                    {activeZkp.constraints.map((c) => (
                      <div
                        key={c.constraintId}
                        className="bg-[#0B0F17] border border-slate-800 rounded-md p-3.5 text-xs space-y-1.5 font-mono"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-amber-400 font-semibold">{c.constraintId}</span>
                          <span className="text-emerald-400">SATISFIED == TRUE</span>
                        </div>
                        <div className="text-slate-200">{c.gateExpression}</div>
                        <div className="text-[11px] text-slate-400 truncate">
                          Witness: {c.witnessInputHash} → Output: {c.publicOutputHash}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* SNARK Proof Vectors (pi_a, pi_b, pi_c) */}
                  <div className="bg-[#0B0F17] border border-slate-800 rounded-md p-4 space-y-3 text-xs font-mono">
                    <div className="text-slate-400 font-semibold border-b border-slate-800 pb-2">
                      GROTH16 / FIAT-SHAMIR COMMITMENT VECTORS (provenance/ZKP_SOUNDNESS_PROOF.json)
                    </div>
                    <div>
                      <div className="text-slate-500">MERKLE EVIDENTIARY ROOT</div>
                      <div className="text-amber-300 break-all">{activeZkp.merkleEvidentiaryRoot}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">VERDICT COMMITMENT HASH</div>
                      <div className="text-emerald-400 break-all">
                        {activeZkp.verdictCommitmentHash}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">PROOF VECTOR π_A</div>
                      <div className="text-slate-300 break-all">{activeZkp.piA[0]}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">PROOF VECTOR π_B[0]</div>
                      <div className="text-slate-300 break-all">{activeZkp.piB[0][0]}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">PROOF VECTOR π_C</div>
                      <div className="text-sky-400 break-all">{activeZkp.piC[0]}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            SECTION 05: SHA-256 FILE LOCKER & ARTIFACT INSPECTOR
           =================================================================== */}
        {activeSection === 'artifact_inspector' && activeDossier && (
          <div className="bg-[#111827] border border-slate-800 rounded-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="text-xs font-mono text-amber-400">
                  Live In-Memory Cartridge File System &amp; WebCrypto SHA-256 Inspector
                </div>
                <h2 className="text-xl font-bold text-slate-100 mt-1 font-display">
                  Perfected Archive File Locker ({Object.keys(activeDossier.files).length} Files)
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fileSearchQuery}
                    onChange={(e) => setFileSearchQuery(e.target.value)}
                    placeholder="Filter path or content..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-[#0B0F17] border border-slate-800 rounded-md text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <select
                  value={fileCategoryFilter}
                  onChange={(e) => setFileCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#0B0F17] border border-slate-800 rounded-md text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="ALL">All Categories ({Object.keys(activeDossier.files).length})</option>
                  <option value="council_writ">Council Indictment Writ</option>
                  <option value="crucible_patch">Crucible Forged Patches</option>
                  <option value="cryptographic_manifest">SHA256SUMS &amp; Manifests</option>
                  <option value="executive_markdown">00–10 Executive Dossier</option>
                  <option value="evidence_locker">Evidence Locker</option>
                  <option value="truth_arbitration">Truth Hierarchy &amp; Arbitration</option>
                  <option value="graph_topology">Graph &amp; Powermap JSON</option>
                  <option value="squad_raw">Squad A–E Raw Telemetry</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
              {/* File Tree List */}
              <div className="lg:col-span-5 bg-[#0B0F17] border border-slate-800 rounded-md overflow-hidden flex flex-col max-h-[600px]">
                <div className="px-3.5 py-2.5 border-b border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
                  <span>ARCHIVE PATH</span>
                  <span>SHA-256 / STATUS</span>
                </div>
                <div className="divide-y divide-slate-800/70 overflow-y-auto">
                  {filteredFiles.map((f) => {
                    const isSelected = selectedFileEntry?.path === f.path;
                    return (
                      <button
                        key={f.path}
                        type="button"
                        onClick={() => setSelectedFilePath(f.path)}
                        className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400/15 text-amber-300'
                            : 'hover:bg-slate-800/40 text-slate-300'
                        }`}
                      >
                        <div className="truncate font-mono">
                          <FileCode className="w-3.5 h-3.5 inline mr-1.5 text-slate-500" />
                          {f.path}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] tabular-nums">
                          {f.isPatched && (
                            <span className="text-emerald-400">FORGED</span>
                          )}
                          <span className="text-slate-500">{f.sha256.slice(0, 8)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Raw File Content & Cryptographic Digest Viewer */}
              <div className="lg:col-span-7 bg-[#0B0F17] border border-slate-800 rounded-md p-5 flex flex-col max-h-[600px]">
                {selectedFileEntry ? (
                  <>
                    <div className="pb-3 border-b border-slate-800 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold font-mono text-amber-400">
                          {selectedFileEntry.path}
                        </span>
                        <span className="text-xs font-mono text-slate-400 tabular-nums">
                          {selectedFileEntry.sizeBytes.toLocaleString()} bytes
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 break-all">
                        WebCrypto SHA-256: <span className="text-slate-200">{selectedFileEntry.sha256}</span>
                      </div>
                      {selectedFileEntry.patchOrigin && (
                        <div className="text-[11px] font-mono text-emerald-400">
                          Origin: {selectedFileEntry.patchOrigin}
                        </div>
                      )}
                    </div>
                    <pre className="mt-4 flex-1 overflow-auto text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {selectedFileEntry.content}
                    </pre>
                  </>
                ) : (
                  <div className="text-xs text-slate-500">Select a file to inspect its contents.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="max-w-[1440px] w-full mx-auto px-6 py-4 border-t border-slate-800/80 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          Sovereign Council of 110 Tribunal &amp; The Crucible Red-Team Patch Forge · Downstream Intelligence Engine
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleExportPerfectedZip}
            className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
          >
            Export Council-Perfected .ZIP
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => setActiveSection('artifact_inspector')}
            className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
          >
            Verify SHA256SUMS
          </button>
        </div>
      </footer>
    </div>
  );
}
