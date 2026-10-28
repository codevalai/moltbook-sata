import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { PowerEdge, PowerNode } from '../types/tribunal';
import { ChevronDown, ChevronUp, RotateCcw, Crosshair, Layers } from 'lucide-react';

interface SpatialPowerWeb3DProps {
  nodes: Array<PowerNode & { sourceDossiers?: string[]; isCollisionNexus?: boolean }>;
  edges: Array<PowerEdge & { sourceDossier?: string }>;
  activeEntityName: string;
  onSelectNode?: (node: PowerNode & { sourceDossiers?: string[]; isCollisionNexus?: boolean }) => void;
}

// Reusable module-scope math objects to ensure zero GC inside the render loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _midPoint = new THREE.Vector3();
const _upVec = new THREE.Vector3(0, 1, 0);
const _quat = new THREE.Quaternion();

export const SpatialPowerWeb3D: React.FC<SpatialPowerWeb3DProps> = ({
  nodes,
  edges,
  activeEntityName,
  onSelectNode,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<
    (PowerNode & { sourceDossiers?: string[]; isCollisionNexus?: boolean }) | null
  >(nodes[0] || null);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [explodedScale, setExplodedScale] = useState(1.0);
  const [cameraPreset, setCameraPreset] = useState<'overview' | 'top' | 'nexus'>('overview');
  const [highlightMode, setHighlightMode] = useState<'fri_heat' | 'mai_scale' | 'collision'>('fri_heat');

  const stateRef = useRef({
    explodedScale: 1.0,
    cameraPreset: 'overview' as 'overview' | 'top' | 'nexus',
    highlightMode: 'fri_heat' as 'fri_heat' | 'mai_scale' | 'collision',
    requestRender: () => {},
    triggerCameraPreset: (_preset: 'overview' | 'top' | 'nexus') => {},
  });

  useEffect(() => {
    if (nodes.length > 0 && !selectedNode) {
      setSelectedNode(nodes[0]);
    }
  }, [nodes, selectedNode]);

  useEffect(() => {
    stateRef.current.explodedScale = explodedScale;
    stateRef.current.highlightMode = highlightMode;
    stateRef.current.requestRender();
  }, [explodedScale, highlightMode]);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    // 1. Software WebGL Guard
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 960;
    const height = container.clientHeight || 540;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080c14);
    scene.fog = new THREE.FogExp2(0x080c14, 0.018);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 300);
    camera.position.set(0, 14, 28);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Mandatory Studio Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    // 3. Balanced 3-Point Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
    keyLight.position.set(16, 28, 18);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 70;
    const d = 24;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.15);
    rimLight.position.set(-18, 12, -16);
    scene.add(rimLight);

    // 4. Ground Reference Grid & Contact Shadow Plane (Coplanar offset applied)
    const floorGeo = new THREE.CircleGeometry(34, 64);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0b111e,
      roughness: 0.85,
      metalness: 0.15,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -4.5;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const gridHelper = new THREE.PolarGridHelper(30, 12, 6, 64, 0x1e293b, 0x1e293b);
    gridHelper.position.y = -4.46; // Offset >= 0.02 on Y to prevent Z-fighting
    scene.add(gridHelper);

    const safeNodes = Array.isArray(nodes) ? nodes : [];
    const safeEdges = Array.isArray(edges) ? edges : [];

    // 5. Force-Directed Node Spatial Coordinates & Composite 4-Part Procedural Groups
    const nodePositions = new Map<string, THREE.Vector3>();
    const nodeGroups: Array<{
      group: THREE.Group;
      basePos: THREE.Vector3;
      ringMesh: THREE.Mesh;
      coreMat: THREE.MeshPhysicalMaterial;
      nodeData: PowerNode & { sourceDossiers?: string[]; isCollisionNexus?: boolean };
    }> = [];
    const clickableMeshes: THREE.Object3D[] = [];

    safeNodes.forEach((node, idx) => {
      const isCenter = idx === 0 || node.type === 'TARGET_ENTITY';
      const angle = (idx / Math.max(1, safeNodes.length)) * Math.PI * 2;
      const radius = isCenter ? (idx === 0 ? 0 : 5.5) : 9.5 + (idx % 3) * 3.2;
      const yOffset =
        node.type === 'REGULATOR'
          ? 4.2
          : node.type === 'CLOUD_INFRA'
            ? 1.8
            : (idx % 2 === 0 ? 1 : -1) * 1.1;

      const pos = new THREE.Vector3(
        Math.cos(angle) * radius,
        yOffset,
        Math.sin(angle) * radius
      );
      nodePositions.set(node.id, pos);

      // Composite 4-part procedural node assembly
      const group = new THREE.Group();
      group.position.copy(pos);

      const scaleFactor = 0.75 + node.mai * 1.15;

      // Color mapped to FRI (Fraud Risk Index) or node type
      const getFriColorHex = (n: typeof node) => {
        if (n.type === 'REGULATOR') return 0x38bdf8;
        if (n.isCollisionNexus) return 0xf59e0b;
        if (n.fri >= 0.8) return 0xef4444;
        if (n.fri >= 0.7) return 0xf97316;
        return 0x10b981;
      };

      const baseHex = getFriColorHex(node);

      // Part 1: Primary Silhouette Core (Octahedron/Icosahedron)
      const coreGeo =
        node.type === 'TARGET_ENTITY'
          ? new THREE.IcosahedronGeometry(1.05 * scaleFactor, 2)
          : new THREE.OctahedronGeometry(0.88 * scaleFactor, 1);
      const coreMat = new THREE.MeshPhysicalMaterial({
        color: baseHex,
        metalness: 0.78,
        roughness: 0.22,
        clearcoat: 0.6,
        emissive: new THREE.Color(baseHex),
        emissiveIntensity: 0.18,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.castShadow = !isSoftwareGl;
      coreMesh.receiveShadow = !isSoftwareGl;
      coreMesh.layers.enable(1);
      coreMesh.userData = { nodeData: node };
      group.add(coreMesh);
      clickableMeshes.push(coreMesh);

      // Part 2: Secondary Read — Orbital Telemetry Torus Ring (roughness varied by >= 0.25)
      const ringGeo = new THREE.TorusGeometry(1.38 * scaleFactor, 0.065, 16, 48);
      ringGeo.rotateX(Math.PI / 2.4);
      const ringMat = new THREE.MeshStandardMaterial({
        color: node.isCollisionNexus ? 0xfbbf24 : 0x94a3b8,
        metalness: 0.92,
        roughness: 0.52,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      group.add(ringMesh);

      // Part 3: Secondary Base Pedestal Ring
      const plinthGeo = new THREE.CylinderGeometry(
        0.65 * scaleFactor,
        0.82 * scaleFactor,
        0.18,
        24
      );
      const plinthMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.6,
        roughness: 0.65,
      });
      const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
      plinthMesh.position.y = -1.15 * scaleFactor;
      group.add(plinthMesh);

      // Part 4: Accent Vertical Telemetry Beacon Spire
      const spireGeo = new THREE.CylinderGeometry(0.04, 0.12, 0.9 * scaleFactor, 12);
      const spireMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.95,
        roughness: 0.15,
      });
      const spireMesh = new THREE.Mesh(spireGeo, spireMat);
      spireMesh.position.y = 1.15 * scaleFactor;
      group.add(spireMesh);

      scene.add(group);
      nodeGroups.push({
        group,
        basePos: pos.clone(),
        ringMesh,
        coreMat,
        nodeData: node,
      });
    });

    // 6. Edges (Capital Control, SDK Telemetry, Statutory Dockets)
    const edgeMeshes: Array<{
      mesh: THREE.Mesh;
      sourceId: string;
      targetId: string;
      baseDist: number;
    }> = [];

    safeEdges.forEach((edge) => {
      const pA = nodePositions.get(edge.source);
      const pB = nodePositions.get(edge.target);
      if (!pA || !pB) return;

      const dist = pA.distanceTo(pB);
      const radius = 0.035 + edge.weight * 0.045;
      const cylGeo = new THREE.CylinderGeometry(radius, radius, dist, 8, 1);
      const edgeColor =
        edge.lockInType === 'SDK_TELEMETRY'
          ? 0xf59e0b
          : edge.lockInType === 'STATUTORY_DOCKET'
            ? 0x38bdf8
            : 0x64748b;

      const cylMat = new THREE.MeshStandardMaterial({
        color: edgeColor,
        metalness: 0.65,
        roughness: 0.35,
        transparent: true,
        opacity: 0.72,
      });
      const cylMesh = new THREE.Mesh(cylGeo, cylMat);
      scene.add(cylMesh);
      edgeMeshes.push({
        mesh: cylMesh,
        sourceId: edge.source,
        targetId: edge.target,
        baseDist: dist,
      });
    });

    // 7. Instanced Ambient Lattice Nodes (>20 repeated background spatial markers)
    const latticeCount = 36;
    const instGeo = new THREE.OctahedronGeometry(0.12, 0);
    const instMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.7,
      roughness: 0.3,
    });
    const instMesh = new THREE.InstancedMesh(instGeo, instMat, latticeCount);
    const dummyMatrix = new THREE.Matrix4();
    for (let i = 0; i < latticeCount; i++) {
      const a = (i / latticeCount) * Math.PI * 2;
      const r = 21 + (i % 3) * 3.5;
      dummyMatrix.makeTranslation(
        Math.cos(a) * r,
        -3.5 + (i % 4) * 1.6,
        Math.sin(a) * r
      );
      instMesh.setMatrixAt(i, dummyMatrix);
    }
    instMesh.instanceMatrix.needsUpdate = true;
    instMesh.computeBoundingSphere();
    scene.add(instMesh);

    // 8. OrbitControls & Smooth Camera Transition Targets
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 8;
    controls.maxDistance = 62;
    controls.maxPolarAngle = Math.PI / 2 + 0.15;

    let cameraTransitionActive = false;
    const desiredCamPos = new THREE.Vector3(0, 14, 28);
    const desiredTarget = new THREE.Vector3(0, 0, 0);

    controls.addEventListener('start', () => {
      cameraTransitionActive = false;
    });

    const updateScenePositions = () => {
      const exp = stateRef.current.explodedScale;
      const mode = stateRef.current.highlightMode;

      for (const item of nodeGroups) {
        _vec3A.copy(item.basePos).multiplyScalar(exp);
        item.group.position.lerp(_vec3A, 0.25);
        nodePositions.set(item.nodeData.id, item.group.position);

        if (mode === 'collision') {
          item.coreMat.emissiveIntensity = item.nodeData.isCollisionNexus ? 0.55 : 0.06;
        } else if (mode === 'mai_scale') {
          item.coreMat.emissiveIntensity = item.nodeData.mai >= 0.85 ? 0.45 : 0.12;
        } else {
          item.coreMat.emissiveIntensity = item.nodeData.fri >= 0.78 ? 0.42 : 0.16;
        }
      }

      for (const eItem of edgeMeshes) {
        const pA = nodePositions.get(eItem.sourceId);
        const pB = nodePositions.get(eItem.targetId);
        if (!pA || !pB) continue;

        _midPoint.addVectors(pA, pB).multiplyScalar(0.5);
        eItem.mesh.position.copy(_midPoint);

        _vec3B.subVectors(pB, pA);
        const len = _vec3B.length();
        eItem.mesh.scale.set(1, len / Math.max(0.001, eItem.baseDist), 1);
        _vec3B.normalize();
        _quat.setFromUnitVectors(_upVec, _vec3B);
        eItem.mesh.quaternion.copy(_quat);
      }
    };

    updateScenePositions();

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 9. On-demand Render Coalescing with Software-WebGL Fence Sync
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function requestRender() {
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        renderDirty = false;
        updateScenePositions();

        if (cameraTransitionActive) {
          camera.position.lerp(desiredCamPos, 0.14);
          controls.target.lerp(desiredTarget, 0.14);
          if (camera.position.distanceTo(desiredCamPos) < 0.15) {
            cameraTransitionActive = false;
          } else {
            renderDirty = true;
          }
        }

        controls.update();
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (renderDirty) requestRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    stateRef.current.requestRender = requestRender;
    stateRef.current.triggerCameraPreset = (preset) => {
      cameraTransitionActive = true;
      if (preset === 'top') {
        desiredCamPos.set(0, 34, 2);
        desiredTarget.set(0, 0, 0);
      } else if (preset === 'nexus') {
        desiredCamPos.set(12, 8, 15);
        desiredTarget.set(0, 1, 0);
      } else {
        desiredCamPos.set(0, 14, 28);
        desiredTarget.set(0, 0, 0);
      }
      requestRender();
    };

    controls.addEventListener('change', requestRender);
    requestRender();

    // 10. Raycasting on Layer 1 for Node Click Inspection
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();

    const handlePointerDown = (ev: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickableMeshes, false);
      if (hits.length > 0) {
        const hitNode = hits[0].object.userData?.nodeData;
        if (hitNode) {
          setSelectedNode(hitNode);
          onSelectNode?.(hitNode);
          const targetVec = nodePositions.get(hitNode.id);
          if (targetVec) {
            cameraTransitionActive = true;
            desiredTarget.copy(targetVec);
            desiredCamPos.set(targetVec.x + 6, targetVec.y + 5, targetVec.z + 11);
            requestRender();
          }
        }
      }
    };

    renderer.domElement.addEventListener('click', handlePointerDown);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 960;
      const h = container.clientHeight || 540;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handlePointerDown);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.dispose();
      envTexture.dispose();
      renderer.dispose();
    };
  }, [nodes, edges, onSelectNode]);

  return (
    <div className="relative w-full h-[560px] bg-[#080C14] border border-slate-800 rounded-lg overflow-hidden select-none">
      {/* Dedicated isolated WebGL canvas container */}
      <div ref={canvasMountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top-Left Minimal Spec Header (100% unobstructed center viewport) */}
      <div className="absolute top-4 left-4 z-10 pointer-events-auto bg-[#0B0F17]/95 border border-slate-800 rounded-md px-4 py-3 max-w-md">
        <div className="text-xs font-mono text-amber-400 tracking-wide">
          3D SPATIAL FORCE-DIRECTED POWER WEB · {activeEntityName}
        </div>
        <div className="mt-1 text-xs text-slate-400">
          {nodes.length} Institutional Nodes · {edges.length} Capital & Telemetry Lock-In Vectors · Click any 3D node to inspect
        </div>
        {selectedNode && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-800/90 text-xs">
            <div className="font-semibold text-slate-100 flex items-center justify-between gap-4">
              <span>{selectedNode.label}</span>
              <span className="font-mono text-amber-300 tabular-nums">
                MAI {selectedNode.mai.toFixed(2)} · FRI {selectedNode.fri.toFixed(2)}
              </span>
            </div>
            <div className="mt-1 text-slate-400 flex items-center gap-2 font-mono text-[11px]">
              <span>{selectedNode.type}</span>
              <span>·</span>
              <span>{selectedNode.jurisdiction}</span>
              {selectedNode.capitalWeightBn ? (
                <>
                  <span>·</span>
                  <span>${selectedNode.capitalWeightBn.toLocaleString()}B Weight</span>
                </>
              ) : null}
            </div>
            {selectedNode.sourceDossiers && selectedNode.sourceDossiers.length > 1 && (
              <div className="mt-1 text-[11px] text-amber-400 font-mono">
                Multi-ZIP Collision Nexus: {selectedNode.sourceDossiers.join(' + ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collapsible Unified Bottom Control Dock (Zero Side-Panel Clutter, No Backdrop Blur over WebGL) */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-4 z-10 pointer-events-auto transition-transform duration-200"
        style={{
          maxWidth: 'min(920px, 94vw)',
          width: '100%',
          transform: dockCollapsed ? 'translate(-50%, calc(100% - 34px))' : 'translate(-50%, 0)',
        }}
      >
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setDockCollapsed((prev) => !prev)}
            className="flex items-center gap-1.5 px-3.5 py-1 text-xs font-mono text-slate-300 bg-[#0F172A] border border-b-0 border-slate-700 rounded-t-md hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{dockCollapsed ? 'Show 3D Controls' : 'Hide Controls'}</span>
          </button>
        </div>

        <div className="bg-[#0F172A] border border-slate-700 rounded-lg px-4 py-3 shadow-xl flex flex-wrap items-center justify-between gap-4">
          {/* Exploded Radial Separation Slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-300 whitespace-nowrap shrink-0">
              Topology Spread
            </span>
            <input
              type="range"
              min={0.65}
              max={1.6}
              step={0.05}
              value={explodedScale}
              onChange={(e) => setExplodedScale(parseFloat(e.target.value))}
              className="w-28 accent-amber-500 cursor-pointer"
            />
            <span className="text-xs font-mono text-slate-400 tabular-nums w-10">
              {explodedScale.toFixed(2)}x
            </span>
          </div>

          {/* Telemetry Heat Mode */}
          <div className="flex items-center gap-1 p-1 bg-[#080C14] border border-slate-800 rounded-md">
            <button
              type="button"
              onClick={() => setHighlightMode('fri_heat')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                highlightMode === 'fri_heat'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3 h-3 inline mr-1" />
              FRI Contradiction Heat
            </button>
            <button
              type="button"
              onClick={() => setHighlightMode('mai_scale')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                highlightMode === 'mai_scale'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              MAI Monopoly Scale
            </button>
            <button
              type="button"
              onClick={() => setHighlightMode('collision')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                highlightMode === 'collision'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cross-ZIP Chokepoints
            </button>
          </div>

          {/* Camera View Presets */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setCameraPreset('overview');
                stateRef.current.triggerCameraPreset('overview');
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
                cameraPreset === 'overview'
                  ? 'bg-slate-800 text-white border-slate-600'
                  : 'bg-[#080C14] text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <RotateCcw className="w-3 h-3 inline mr-1" />
              Isometric Orbit
            </button>
            <button
              type="button"
              onClick={() => {
                setCameraPreset('top');
                stateRef.current.triggerCameraPreset('top');
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
                cameraPreset === 'top'
                  ? 'bg-slate-800 text-white border-slate-600'
                  : 'bg-[#080C14] text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
               Zenith Plan
            </button>
            <button
              type="button"
              onClick={() => {
                setCameraPreset('nexus');
                stateRef.current.triggerCameraPreset('nexus');
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
                cameraPreset === 'nexus'
                  ? 'bg-slate-800 text-white border-slate-600'
                  : 'bg-[#080C14] text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Crosshair className="w-3 h-3 inline mr-1" />
              Chokepoint Focus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
