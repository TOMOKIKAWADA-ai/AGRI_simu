import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import riceStage1Url from './assets/suitou_001.glb?url';
import riceStage2Url from './assets/suitou_002.glb?url';
import riceStage3Url from './assets/suitou_003.glb?url';
import riceStage4Url from './assets/suitou_004.glb?url';
import riceWither2Url from './assets/sui_wither_002.glb?url';
import riceWither3Url from './assets/sui_wither_003.glb?url';
import riceWither4Url from './assets/sui_wither_004.glb?url';

const PLOT_POSITIONS = [-1.9, 1.9];
const PLOT_OUTLINE = [
  { x: -1.24, z: -1.18 },
  { x: 1.07, z: -1.32 },
  { x: 1.24, z: 1.08 },
  { x: -1.08, z: 1.3 },
];
const PLOT_LEVEE_TOP_OUTLINE = [
  { x: -1.08, z: -1.02 },
  { x: 0.92, z: -1.14 },
  { x: 1.07, z: 0.92 },
  { x: -0.94, z: 1.1 },
];
const PLOT_LEVEE_INNER_OUTLINE = [
  { x: -0.95, z: -0.9 },
  { x: 0.82, z: -1 },
  { x: 0.97, z: 0.8 },
  { x: -0.84, z: 0.97 },
];
const PLOT_WATER_OUTLINE = [
  { x: -0.86, z: -0.78 },
  { x: 0.74, z: -0.88 },
  { x: 0.88, z: 0.68 },
  { x: -0.76, z: 0.84 },
];

const WEATHER_STYLE = {
  heatwave: { sky: 0xffd08a, fog: 0xffdcad, hemi: 0xfff1c7, sun: 0xffb24d, intensity: 2.25, rain: false },
  frost: { sky: 0xdcefff, fog: 0xe8f5ff, hemi: 0xdff6ff, sun: 0xa9d2ff, intensity: 1.25, rain: false },
  flood: { sky: 0x8fa4ad, fog: 0xb0bec5, hemi: 0xd4e4ed, sun: 0xa8b5bc, intensity: 0.9, rain: true },
  rain: { sky: 0xa8b7c0, fog: 0xc4ccd1, hemi: 0xd9e6ec, sun: 0xb3bdc3, intensity: 1.0, rain: true },
  drought: { sky: 0xd8b773, fog: 0xe0c98f, hemi: 0xf3ddaa, sun: 0xe8aa52, intensity: 1.6, rain: false },
  warm: { sky: 0xbfe5ff, fog: 0xe7f5ff, hemi: 0xf5f4d6, sun: 0xffd16d, intensity: 1.55, rain: false },
  warning: { sky: 0xc9d6c9, fog: 0xd9e2d4, hemi: 0xeef3de, sun: 0xd2cf94, intensity: 1.2, rain: false },
  cloudy: { sky: 0xb8c2c5, fog: 0xd5dcdf, hemi: 0xe4ecee, sun: 0xc5cfd3, intensity: 1.0, rain: false },
  clear: { sky: 0xaad9ff, fog: 0xdff3ff, hemi: 0xf3f6d4, sun: 0xffd27a, intensity: 1.45, rain: false },
};

const RICE_MODEL_SOURCES = [
  { key: 'healthy1', url: riceStage1Url },
  { key: 'healthy2', url: riceStage2Url },
  { key: 'healthy3', url: riceStage3Url },
  { key: 'healthy4', url: riceStage4Url },
  { key: 'withered2', url: riceWither2Url },
  { key: 'withered3', url: riceWither3Url },
  { key: 'withered4', url: riceWither4Url },
];

export default function AgriThreeView({ stage, plots, selectedPlotId, onSelectPlot, lastEvent }) {
  const containerRef = useRef(null);
  const stateRef = useRef(null);
  const onSelectRef = useRef(onSelectPlot);
  const selectedRef = useRef(selectedPlotId);
  const [error, setError] = useState('');

  useEffect(() => {
    onSelectRef.current = onSelectPlot;
  }, [onSelectPlot]);

  useEffect(() => {
    selectedRef.current = selectedPlotId;
    updateSelectionFrame(stateRef.current, selectedPlotId);
  }, [selectedPlotId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let disposed = false;
    const cleanupTasks = [];

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(WEATHER_STYLE.clear.sky);
      scene.fog = new THREE.Fog(WEATHER_STYLE.clear.fog, 16, 36);

      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(4.25, 6.05, 3.85);
      camera.lookAt(1.82, 0.22, 0.02);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(WEATHER_STYLE.clear.sky, 1);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.04;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);

      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.34, 0.62, 0.76);
      composer.addPass(bloomPass);

      const controls = new MapControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.screenSpacePanning = false;
      controls.minDistance = 4.6;
      controls.maxDistance = 18;
      controls.maxPolarAngle = Math.PI / 2.2;
      controls.target.set(1.82, 0.22, 0.02);

      const hemiLight = new THREE.HemisphereLight(0xf3f6d4, 0x63705a, 1.6);
      scene.add(hemiLight);

      const sunLight = new THREE.DirectionalLight(0xffd27a, 1.45);
      sunLight.position.set(9, 9, 4);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.set(1024, 1024);
      scene.add(sunLight);

      const worldGroup = new THREE.Group();
      scene.add(worldGroup);
      createGround(worldGroup);

      const environment = createEnvironment(scene, worldGroup, stage, renderer.capabilities.getMaxAnisotropy?.() || 1);

      const plotGroup = new THREE.Group();
      worldGroup.add(plotGroup);

      const effectGroup = new THREE.Group();
      worldGroup.add(effectGroup);

      const selectionFrame = createSelectionFrame();
      worldGroup.add(selectionFrame);

      const rain = createRain();
      scene.add(rain.points);

      const ambientDrift = createAmbientDrift();
      scene.add(ambientDrift.points);

      const pointer = new THREE.Vector2();
      const raycaster = new THREE.Raycaster();
      const pointerDown = { x: 0, y: 0 };

      const current = {
        scene,
        camera,
        renderer,
        composer,
        bloomPass,
        controls,
        hemiLight,
        sunLight,
        environment,
        plotGroup,
        effectGroup,
        plotGroups: new Map(),
        plotMeshes: [],
        animatedGroups: [],
        selectionFrame,
        rain,
        ambientDrift,
        latestStage: stage,
        latestPlots: plots,
        riceModelTemplates: {},
        sprayBursts: [],
        plotSnapshots: createPlotSnapshots(plots),
        stageId: stage?.id || '',
        lastFrameTime: 0,
      };
      stateRef.current = current;

      const resize = () => {
        if (disposed || !container.isConnected) return;
        const width = Math.max(1, container.clientWidth);
        const height = Math.max(1, container.clientHeight);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        composer.setSize(width, height);
      };

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
      resize();
      cleanupTasks.push(() => resizeObserver.disconnect());

      const handlePointerDown = (event) => {
        pointerDown.x = event.clientX;
        pointerDown.y = event.clientY;
      };

      const handlePointerUp = (event) => {
        const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
        if (moved > 6 || !renderer.domElement) return;
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(current.plotMeshes, false);
        const plotId = intersects[0]?.object?.userData?.plotId;
        if (plotId && onSelectRef.current) {
          onSelectRef.current(plotId);
        }
      };

      renderer.domElement.addEventListener('pointerdown', handlePointerDown);
      renderer.domElement.addEventListener('pointerup', handlePointerUp);
      cleanupTasks.push(() => {
        renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
        renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      });

      renderer.setAnimationLoop((time) => {
        controls.update();
        const deltaSeconds = current.lastFrameTime
          ? Math.min(0.05, Math.max(0.001, (time - current.lastFrameTime) / 1000))
          : 0.016;
        current.lastFrameTime = time;
        animateRain(current.rain, time);
        animateAmbientDrift(current.ambientDrift, time);
        animateEnvironment(current.environment, time);
        animatePlots(current.animatedGroups, time);
        animateSprayBursts(current, deltaSeconds);
        composer.render();
      });

      rebuildPlots(current, stage, plots);
      updateSelectionFrame(current, selectedRef.current);
      updateWeather(current, lastEvent || 'clear');
      loadRiceModels(current, () => disposed || stateRef.current !== current, () => {
        if (disposed || stateRef.current !== current) return;
        rebuildPlots(current, current.latestStage, current.latestPlots);
        updateSelectionFrame(current, selectedRef.current);
      });
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '3D表示の初期化に失敗しました。');
    }

    return () => {
      disposed = true;
      const current = stateRef.current;
      cleanupTasks.forEach((task) => task());
      if (current) {
        current.renderer.setAnimationLoop(null);
        current.controls.dispose();
        current.composer?.dispose?.();
        disposeObject(current.scene);
        Object.values(current.riceModelTemplates || {}).forEach((template) => disposeObject(template));
        current.renderer.dispose();
        current.renderer.forceContextLoss?.();
        current.renderer.domElement?.parentElement?.removeChild(current.renderer.domElement);
      }
      stateRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!stateRef.current) return;
    try {
      const current = stateRef.current;
      current.latestStage = stage;
      current.latestPlots = plots;
      const stageChanged = current.stageId !== (stage?.id || '');
      const previousSnapshots = stageChanged ? new Map() : current.plotSnapshots;

      if (stageChanged && current.effectGroup) {
        clearGroup(current.effectGroup);
        current.sprayBursts = [];
      }

      rebuildPlots(current, stage, plots);
      if (!stageChanged) {
        triggerSprayBursts(current, plots, previousSnapshots, stage);
      }
      current.plotSnapshots = createPlotSnapshots(plots);
      current.stageId = stage?.id || '';
      updateSelectionFrame(current, selectedRef.current);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '3D表示の更新に失敗しました。');
    }
  }, [stage, plots]);

  useEffect(() => {
    if (!stateRef.current) return;
    updateWeather(stateRef.current, lastEvent || 'clear');
  }, [lastEvent]);

  return (
    <div className="three-shell">
      <div ref={containerRef} className="three-canvas" />
      <div className="plot-legend">
        {(Array.isArray(plots) ? plots : []).map((plot, index) => (
          <button
            key={plot.id}
            type="button"
            className={`legend-pill ${plot.id === selectedPlotId ? 'selected' : ''} ${plot.role === 'control' ? 'control' : ''}`}
            onClick={() => onSelectPlot?.(plot.id)}
            style={getLegendPillStyle(index, plot.role)}
          >
            {plot.name}
          </button>
        ))}
      </div>
      {error ? <div className="three-error">3Dエラー：{error}</div> : null}
    </div>
  );
}

function createGround(parent) {
  const terrainTexture = createNoiseTexture({
    base: '#7b8d63',
    accent: '#5c6d49',
    line: '#8ea06e',
    width: 256,
    height: 256,
    streaks: 72,
    dotCount: 140,
  });
  terrainTexture.wrapS = THREE.RepeatWrapping;
  terrainTexture.wrapT = THREE.RepeatWrapping;
  terrainTexture.repeat.set(5.5, 3.4);

  const terrain = new THREE.Mesh(
    new THREE.CylinderGeometry(11.5, 12.4, 0.22, 48),
    new THREE.MeshStandardMaterial({ color: 0x74825b, roughness: 1, map: terrainTexture }),
  );
  terrain.position.set(0, -0.24, 0);
  terrain.receiveShadow = true;
  parent.add(terrain);

  const baseTexture = createNoiseTexture({
    base: '#6f7d55',
    accent: '#566244',
    line: '#87986b',
    width: 256,
    height: 256,
    streaks: 96,
    dotCount: 110,
  });
  baseTexture.wrapS = THREE.RepeatWrapping;
  baseTexture.wrapT = THREE.RepeatWrapping;
  baseTexture.repeat.set(5.8, 2.5);

  const baseGeometry = new THREE.BoxGeometry(12.4, 0.16, 5.6);
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x6f7d55, roughness: 0.96, map: baseTexture });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.set(0, -0.12, 0);
  base.receiveShadow = true;
  parent.add(base);

  [-4.4, -3.1, -1.7, 1.7, 3.1, 4.4].forEach((x, index) => {
    const tuft = new THREE.Mesh(
      new THREE.ConeGeometry(0.18 + (index % 2) * 0.04, 0.34 + (index % 3) * 0.06, 6),
      new THREE.MeshStandardMaterial({ color: 0x5d8749, roughness: 0.9 }),
    );
    tuft.position.set(x, 0.14, 2.65 + (index % 2) * 0.18);
    tuft.castShadow = true;
    parent.add(tuft);
  });

  [-5.6, -2.4, 2.2, 5.4].forEach((x, index) => {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.12 + (index % 2) * 0.04, 0),
      new THREE.MeshStandardMaterial({ color: 0x9f9b8b, roughness: 0.95 }),
    );
    rock.position.set(x, -0.02, -2.8 + (index % 2) * 0.36);
    rock.scale.set(1.15, 0.78, 1.05);
    rock.castShadow = true;
    parent.add(rock);
  });
}

function createSelectionFrame() {
  const group = new THREE.Group();
  const points = createRoundedPlotPoints(PLOT_OUTLINE, 0.18, 8)
    .map((point) => new THREE.Vector3(point.x, 0.34, -point.y));
  const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal');
  const material = new THREE.MeshBasicMaterial({ color: 0xffdf4d });
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff9a,
    transparent: true,
    opacity: 0.32,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const glow = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, 0.07, 8, true), glowMaterial);
  const edge = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, 0.026, 8, true), material);
  group.add(glow, edge);

  group.visible = false;
  return group;
}

function createRain() {
  const count = 220;
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = randomBetween(-7, 7);
    positions[index * 3 + 1] = randomBetween(2.2, 8.5);
    positions[index * 3 + 2] = randomBetween(-3.4, 3.4);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0x7fc7ff, size: 0.05, transparent: true, opacity: 0.72 });
  const points = new THREE.Points(geometry, material);
  points.visible = false;
  return { points, positions };
}

function loadRiceModels(current, shouldCancel, onReady) {
  const loader = new GLTFLoader();
  const templates = {};
  let remaining = RICE_MODEL_SOURCES.length;

  const finish = () => {
    remaining -= 1;
    if (remaining > 0) return;
    if (shouldCancel?.()) {
      Object.values(templates).forEach((template) => disposeObject(template));
      return;
    }
    current.riceModelTemplates = templates;
    onReady?.();
  };

  RICE_MODEL_SOURCES.forEach(({ key, url }) => {
    loader.load(
      url,
      (gltf) => {
        const source = gltf.scene || gltf.scenes?.[0];
        if (source) {
          const template = source.clone(true);
          template.traverse?.((child) => {
            if (!child.isMesh) return;
            child.castShadow = true;
            child.receiveShadow = true;
          });
          templates[key] = template;
        }
        finish();
      },
      undefined,
      finish,
    );
  });
}

function rebuildPlots(current, stage, plots) {
  clearGroup(current.plotGroup);
  current.plotMeshes = [];
  current.animatedGroups = [];
  current.plotGroups = new Map();

  const safePlots = Array.isArray(plots) && plots.length ? plots : [];
  PLOT_POSITIONS.forEach((x, index) => {
    const plot = safePlots[index] || {
      id: `plot-${index + 1}`,
      name: `圃場${index + 1}`,
      role: 'trial',
      quality: 100,
      yield: 100,
      stamina: 100,
      growth: 40,
      waterlogged: 0,
      treatments: [],
      visualState: 'steady',
    };
    const group = buildPlot(stage?.crop || 'rice', plot, index, current.riceModelTemplates);
    group.position.x = x;
    current.plotGroup.add(group);
    current.plotGroups.set(plot.id, group);

    const clickMesh = group.children.find((child) => child.userData?.clickTarget);
    if (clickMesh) current.plotMeshes.push(clickMesh);
    current.animatedGroups.push(group);
  });
}

function createRoundedPlotPoints(points, radius = 0.1, curveSegments = 6) {
  const vectors = points.map((point) => new THREE.Vector2(point.x, -point.z));
  const rounded = [];

  vectors.forEach((current, index) => {
    const previous = vectors[(index - 1 + vectors.length) % vectors.length];
    const next = vectors[(index + 1) % vectors.length];
    const previousDirection = previous.clone().sub(current);
    const nextDirection = next.clone().sub(current);
    const cornerRadius = Math.min(
      radius,
      previousDirection.length() * 0.42,
      nextDirection.length() * 0.42,
    );
    const start = current.clone().add(previousDirection.normalize().multiplyScalar(cornerRadius));
    const end = current.clone().add(nextDirection.normalize().multiplyScalar(cornerRadius));

    rounded.push(start);
    for (let segment = 1; segment <= curveSegments; segment += 1) {
      const t = segment / curveSegments;
      const inverse = 1 - t;
      rounded.push(new THREE.Vector2(
        start.x * inverse * inverse + current.x * 2 * inverse * t + end.x * t * t,
        start.y * inverse * inverse + current.y * 2 * inverse * t + end.y * t * t,
      ));
    }
  });

  return rounded;
}

function createRoundedPlotShape(points, radius = 0.1, curveSegments = 6) {
  const rounded = createRoundedPlotPoints(points, radius, curveSegments);
  const shape = new THREE.Shape();
  rounded.forEach((point, index) => {
    if (index === 0) shape.moveTo(point.x, point.y);
    else shape.lineTo(point.x, point.y);
  });
  shape.closePath();
  return shape;
}

function createExtrudedRoundedGeometry(points, depth, radius = 0.1) {
  const geometry = new THREE.ExtrudeGeometry(createRoundedPlotShape(points, radius, 8), {
    depth,
    bevelEnabled: true,
    bevelSize: 0.018,
    bevelThickness: 0.018,
    bevelSegments: 2,
    curveSegments: 8,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function createHorizontalRoundedShapeGeometry(points, radius = 0.1) {
  const geometry = new THREE.ShapeGeometry(createRoundedPlotShape(points, radius, 8));
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function createLeveeGeometry({ outerBottom, outerTop, innerTop, innerBottom, bottomY, topY }) {
  const outerBottomPoints = createRoundedPlotPoints(outerBottom, 0.18, 8);
  const outerTopPoints = createRoundedPlotPoints(outerTop, 0.14, 8);
  const innerTopPoints = createRoundedPlotPoints(innerTop, 0.12, 8);
  const innerBottomPoints = createRoundedPlotPoints(innerBottom, 0.1, 8);
  const vertexCount = Math.min(
    outerBottomPoints.length,
    outerTopPoints.length,
    innerTopPoints.length,
    innerBottomPoints.length,
  );
  const innerBottomY = bottomY + (topY - bottomY) * 0.42;
  const positions = [];
  const indices = [];

  const addQuad = (a, b, c, d) => {
    const start = positions.length / 3;
    positions.push(...a, ...b, ...c, ...d);
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  };

  for (let index = 0; index < vertexCount; index += 1) {
    const next = (index + 1) % vertexCount;
    const outerBottomA = outerBottomPoints[index];
    const outerBottomB = outerBottomPoints[next];
    const outerTopA = outerTopPoints[index];
    const outerTopB = outerTopPoints[next];
    const innerTopA = innerTopPoints[index];
    const innerTopB = innerTopPoints[next];
    const innerBottomA = innerBottomPoints[index];
    const innerBottomB = innerBottomPoints[next];

    addQuad(
      [outerTopA.x, topY, -outerTopA.y],
      [innerTopA.x, topY, -innerTopA.y],
      [innerTopB.x, topY, -innerTopB.y],
      [outerTopB.x, topY, -outerTopB.y],
    );
    addQuad(
      [outerBottomA.x, bottomY, -outerBottomA.y],
      [outerBottomB.x, bottomY, -outerBottomB.y],
      [outerTopB.x, topY, -outerTopB.y],
      [outerTopA.x, topY, -outerTopA.y],
    );
    addQuad(
      [innerTopA.x, topY, -innerTopA.y],
      [innerTopB.x, topY, -innerTopB.y],
      [innerBottomB.x, innerBottomY, -innerBottomB.y],
      [innerBottomA.x, innerBottomY, -innerBottomA.y],
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function getPlotZRange(points, padding = 0) {
  const zValues = points.map((point) => point.z);
  return {
    min: Math.min(...zValues) + padding,
    max: Math.max(...zValues) - padding,
  };
}

function getPlotXRangeAtZ(points, z, padding = 0) {
  const intersections = [];
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    if (Math.abs(next.z - point.z) < 0.0001) return;
    const minZ = Math.min(point.z, next.z);
    const maxZ = Math.max(point.z, next.z);
    if (z < minZ - 0.0001 || z > maxZ + 0.0001) return;

    const t = (z - point.z) / (next.z - point.z);
    intersections.push(point.x + (next.x - point.x) * t);
  });

  if (intersections.length < 2) {
    const xValues = points.map((point) => point.x);
    intersections.push(Math.min(...xValues), Math.max(...xValues));
  }

  intersections.sort((a, b) => a - b);
  const left = intersections[0] + padding;
  const right = intersections[intersections.length - 1] - padding;
  if (right - left < 0.2) {
    const center = (left + right) / 2;
    return [center - 0.1, center + 0.1];
  }
  return [left, right];
}

function buildPlot(crop, plot, index, riceModelTemplates) {
  const group = new THREE.Group();
  const growthRatio = Math.max(0.08, Math.min(1, (plot.growth || 0) / 100));
  const waterlogged = Math.max(0, plot.waterlogged || 0);
  const baseColor =
    plot.role === 'control'
      ? 0x66715f
      : waterlogged > 0
        ? 0x566d60
        : crop === 'flood'
          ? 0x6f674a
          : 0x6d8c47;
  const baseTexture = createBankTexture();
  baseTexture.wrapS = THREE.RepeatWrapping;
  baseTexture.wrapT = THREE.RepeatWrapping;
  baseTexture.repeat.set(1.35, 1.6);

  const base = new THREE.Mesh(
    createExtrudedRoundedGeometry(PLOT_OUTLINE, 0.2, 0.16),
    new THREE.MeshStandardMaterial({ color: baseColor, map: baseTexture, roughness: 0.96 }),
  );
  base.position.y = -0.05;
  base.receiveShadow = true;
  base.userData = { plotId: plot.id || `plot-${index + 1}`, clickTarget: true };
  group.add(base);

  addPlotShadow(group, plot.role);
  addPlotAccent(group, plot);
  addPlotSurfaceDetails(group, plot, crop, growthRatio);
  addWaterSurface(group, crop, plot, index);
  addTreatmentBeacon(group, plot);
  addBuffAura(group, plot);

  if (waterlogged > 0 || crop === 'flood') {
    const puddle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.82, 0.9, 0.025, 24),
      new THREE.MeshStandardMaterial({
        color: 0x4a7882,
        transparent: true,
        opacity: waterlogged > 0 ? 0.55 : 0.22,
        roughness: 0.2,
      }),
    );
    puddle.position.set(0.28, 0.16, -0.14);
    puddle.scale.z = 0.55;
    group.add(puddle);
  }

  if (crop === 'orchard') {
    addTrees(group, plot.visualState, growthRatio);
  } else if (crop === 'flood') {
    addFloodCrops(group, plot.visualState, growthRatio);
  } else {
    addRice(group, plot, growthRatio, riceModelTemplates);
  }

  group.userData.animationPhase = index * 0.75;
  return group;
}

function addPlotShadow(group, role) {
  const shadow = new THREE.Mesh(
    createHorizontalRoundedShapeGeometry(PLOT_OUTLINE, 0.18),
    new THREE.MeshBasicMaterial({
      color: role === 'control' ? 0x202415 : 0x28301a,
      transparent: true,
      opacity: role === 'control' ? 0.1 : 0.14,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  shadow.position.set(0, -0.065, 0.08);
  shadow.scale.set(1.08, 1, 1.06);
  group.add(shadow);
}

function addPlotSurfaceDetails(group, plot, crop, growthRatio) {
  const topTone =
    plot.role === 'control'
      ? 0x737c64
      : crop === 'flood'
        ? 0x746c4d
        : crop === 'orchard'
          ? 0x7d6d46
          : 0x6d7c41;
  const bankTexture = createBankTexture();
  bankTexture.wrapS = THREE.RepeatWrapping;
  bankTexture.wrapT = THREE.RepeatWrapping;
  bankTexture.repeat.set(1.8, 1.6);

  const levee = new THREE.Mesh(
    createLeveeGeometry({
      outerBottom: PLOT_OUTLINE,
      outerTop: PLOT_LEVEE_TOP_OUTLINE,
      innerTop: PLOT_LEVEE_INNER_OUTLINE,
      innerBottom: PLOT_WATER_OUTLINE,
      bottomY: 0.1,
      topY: 0.34,
    }),
    new THREE.MeshStandardMaterial({
      color: shiftHex(topTone, -0.02, -0.06),
      map: bankTexture,
      roughness: 0.98,
      side: THREE.DoubleSide,
    }),
  );
  levee.receiveShadow = true;
  levee.castShadow = true;
  group.add(levee);

  const soil = new THREE.Mesh(
    createHorizontalRoundedShapeGeometry(PLOT_WATER_OUTLINE, 0.09),
    new THREE.MeshStandardMaterial({
      color: shiftHex(topTone, -0.04, -0.04),
      map: createPaddyBedTexture(),
      roughness: 0.98,
      side: THREE.DoubleSide,
    }),
  );
  soil.position.set(0, 0.168, 0);
  soil.receiveShadow = true;
  group.add(soil);

  const furrowMaterial = new THREE.MeshStandardMaterial({ color: shiftHex(topTone, -0.08, -0.04), roughness: 1 });
  const ridgeMaterial = new THREE.MeshStandardMaterial({
    color: shiftHex(topTone, 0.04, 0.03),
    transparent: crop === 'rice',
    opacity: crop === 'rice' ? 0.32 : 0.72,
    roughness: 0.92,
  });
  const rowCount = crop === 'orchard' ? 4 : 6;
  const zRange = getPlotZRange(PLOT_WATER_OUTLINE, 0.16);

  for (let index = 0; index < rowCount; index += 1) {
    const z = zRange.min + (index / Math.max(1, rowCount - 1)) * (zRange.max - zRange.min);
    const [minX, maxX] = getPlotXRangeAtZ(PLOT_WATER_OUTLINE, z, 0.14);
    const ridge = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(0.2, maxX - minX), 0.014 + growthRatio * 0.012, 0.075),
      ridgeMaterial.clone(),
    );
    ridge.position.set((minX + maxX) / 2, 0.188, z);
    group.add(ridge);
  }

  for (let index = 0; index < rowCount - 1; index += 1) {
    const z = zRange.min + ((index + 0.5) / Math.max(1, rowCount - 1)) * (zRange.max - zRange.min);
    const [minX, maxX] = getPlotXRangeAtZ(PLOT_WATER_OUTLINE, z, 0.16);
    const furrow = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(0.2, maxX - minX), 0.01, 0.055),
      furrowMaterial.clone(),
    );
    furrow.position.set((minX + maxX) / 2, 0.17, z);
    group.add(furrow);
  }
}

function addWaterSurface(group, crop, plot, index) {
  if (!['rice', 'flood'].includes(crop)) return;

  const rippleTexture = createWaterTexture();
  rippleTexture.wrapS = THREE.RepeatWrapping;
  rippleTexture.wrapT = THREE.RepeatWrapping;
  rippleTexture.repeat.set(2.1, 2.6);

  const opacity = crop === 'rice' ? 0.42 : Math.max(0.18, 0.26 + Math.min(0.22, (plot.waterlogged || 0) * 0.04));
  const water = new THREE.Mesh(
    createHorizontalRoundedShapeGeometry(PLOT_WATER_OUTLINE, 0.1),
    new THREE.MeshStandardMaterial({
      color: crop === 'rice' ? 0xa7d4cb : 0x7ca0a5,
      map: rippleTexture,
      transparent: true,
      opacity,
      roughness: 0.18,
      metalness: 0.04,
      side: THREE.DoubleSide,
    }),
  );
  water.position.set(0, 0.196, 0);
  water.receiveShadow = true;
  group.add(water);
  group.userData.waterSurface = {
    mesh: water,
    texture: rippleTexture,
    phase: index * 0.23,
  };
}

function addPlotAccent(group, plot) {
  const accentColor = plot.role === 'control' ? 0xb4b9ad : 0x7ec8ff;
  const postMaterial = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.7 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.44, 10), postMaterial);
  post.position.set(-0.92, 0.28, 1.02);
  group.add(post);

  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.18), postMaterial.clone());
  cap.position.set(-0.92, 0.54, 1.02);
  group.add(cap);

  if (plot.role === 'control') {
    const fenceMaterial = new THREE.MeshStandardMaterial({ color: 0x8a8271, roughness: 0.92 });
    [-0.96, 0.96].forEach((x) => {
      [-1.05, 1.05].forEach((z) => {
        const fence = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.44, 8), fenceMaterial.clone());
        fence.position.set(x, 0.25, z);
        group.add(fence);
      });
    });
  }
}

function addTreatmentBeacon(group, plot) {
  const treatment = Array.isArray(plot.treatments) ? plot.treatments[0] : null;
  if (!treatment) return;

  const color = getTreatmentVisual(treatment.key).primary;
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 16, 10),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.2 }),
  );
  beacon.position.set(0.82, 0.92, 1.02);
  group.add(beacon);

  group.userData.treatmentBeacon = {
    mesh: beacon,
    state: treatment.state,
    baseY: beacon.position.y,
  };
}

function addBuffAura(group, plot) {
  const activeTreatment = getSafeTreatments(plot?.treatments).find((treatment) => treatment.state === 'active');
  if (!activeTreatment) return;

  const colors = getTreatmentVisual(activeTreatment.key);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.82, 0.04, 12, 36),
    new THREE.MeshStandardMaterial({
      color: colors.primary,
      emissive: colors.primary,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.55,
      roughness: 0.26,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0.32, 0);
  group.add(ring);

  const orbiters = [];
  for (let index = 0; index < 6; index += 1) {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 12, 8),
      new THREE.MeshStandardMaterial({
        color: colors.secondary,
        emissive: colors.secondary,
        emissiveIntensity: 0.4,
        roughness: 0.2,
      }),
    );
    orb.userData = {
      baseAngle: (Math.PI * 2 * index) / 6,
      orbitRadius: 0.55 + (index % 2) * 0.18,
      heightOffset: (index % 3) * 0.08,
    };
    group.add(orb);
    orbiters.push(orb);
  }

  group.userData.buffAura = {
    ring,
    orbiters,
  };
}

function addRice(group, plot, growthRatio, riceModelTemplates) {
  const visualState = plot?.visualState || 'steady';
  const riceModelTemplate = selectRiceModelTemplate(riceModelTemplates, visualState, growthRatio);
  if (riceModelTemplate && addRiceModel(group, riceModelTemplate, visualState, growthRatio)) {
    return;
  }

  const color = getVegetationColor(visualState);
  const tipColor = shiftHex(color, 0.03, visualState === 'thriving' ? 0.06 : 0.02);
  const rows = visualState === 'withered' ? 4 : 6;
  const cols = visualState === 'withered' ? 5 : 7;
  const height = 0.24 + growthRatio * 0.52;
  const zRange = getPlotZRange(PLOT_WATER_OUTLINE, 0.2);

  for (let row = 0; row < rows; row += 1) {
    const z = zRange.min + (row / Math.max(1, rows - 1)) * (zRange.max - zRange.min);
    const [minX, maxX] = getPlotXRangeAtZ(PLOT_WATER_OUTLINE, z, 0.18);
    for (let col = 0; col < cols; col += 1) {
      const bladeHeight = height * randomBetween(0.82, 1.14);
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, bladeHeight, 0.035),
        new THREE.MeshStandardMaterial({
          color: shiftHex(color, randomBetween(-0.02, 0.03), randomBetween(-0.06, 0.05)),
          roughness: 0.84,
        }),
      );
      const x = minX + (col / Math.max(1, cols - 1)) * (maxX - minX);
      blade.position.set(x + randomBetween(-0.04, 0.04), 0.18 + bladeHeight / 2, z + randomBetween(-0.04, 0.04));
      blade.rotation.z = randomBetween(-0.22, 0.22) + (visualState === 'withered' ? 0.25 : 0);
      blade.castShadow = true;
      group.add(blade);

      if (growthRatio > 0.55 && visualState !== 'withered') {
        const grain = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.015, 0.08 + growthRatio * 0.08, 3, 6),
          new THREE.MeshStandardMaterial({ color: tipColor, roughness: 0.7 }),
        );
        grain.position.set(blade.position.x + 0.03, blade.position.y + bladeHeight * 0.35, blade.position.z);
        grain.rotation.z = 0.8 + randomBetween(-0.18, 0.2);
        grain.rotation.x = randomBetween(-0.22, 0.18);
        grain.castShadow = true;
        group.add(grain);
      }
    }
  }
}

function addRiceModel(group, riceModelTemplate, visualState, growthRatio) {
  const box = new THREE.Box3().setFromObject(riceModelTemplate);
  const size = box.getSize(new THREE.Vector3());
  const height = Math.max(size.y, 0.001);
  const rows = visualState === 'withered' ? 4 : 5;
  const cols = visualState === 'withered' ? 5 : 7;
  const targetHeight = 0.18 + growthRatio * 0.44;
  const baseScale = targetHeight / height;
  const zRange = getPlotZRange(PLOT_WATER_OUTLINE, 0.2);

  if (!Number.isFinite(baseScale) || baseScale <= 0) {
    return false;
  }

  for (let row = 0; row < rows; row += 1) {
    const z = zRange.min + (row / Math.max(1, rows - 1)) * (zRange.max - zRange.min);
    const [minX, maxX] = getPlotXRangeAtZ(PLOT_WATER_OUTLINE, z, 0.18);
    for (let col = 0; col < cols; col += 1) {
      const model = cloneRiceModel(riceModelTemplate, visualState);
      const x = minX + (col / Math.max(1, cols - 1)) * (maxX - minX);
      const jitterX = (seededUnit(row, col, 3) - 0.5) * 0.09;
      const jitterZ = (seededUnit(row, col, 7) - 0.5) * 0.09;
      const scale = baseScale * (0.86 + seededUnit(row, col, 11) * 0.24);

      model.scale.multiplyScalar(scale);
      model.updateWorldMatrix(true, true);

      const scaledBox = new THREE.Box3().setFromObject(model);
      const center = scaledBox.getCenter(new THREE.Vector3());
      model.position.x = x + jitterX - center.x;
      model.position.y = 0.2 - scaledBox.min.y;
      model.position.z = z + jitterZ - center.z;
      model.rotation.y = -0.3 + seededUnit(row, col, 17) * 0.6;

      group.add(model);
    }
  }

  return true;
}

function selectRiceModelTemplate(templates, visualState, growthRatio) {
  if (!templates || typeof templates !== 'object') return null;

  const stage = getRiceGrowthStage(growthRatio);
  if (visualState === 'withered') {
    return pickRiceTemplate(templates, [`withered${Math.max(2, stage)}`, `healthy${stage}`, 'healthy4', 'healthy3', 'healthy2', 'healthy1']);
  }
  if (visualState === 'stressed') {
    return pickRiceTemplate(templates, [`withered${Math.max(2, stage)}`, `healthy${stage}`, `healthy${Math.max(1, stage - 1)}`, 'healthy1']);
  }
  return pickRiceTemplate(templates, [`healthy${stage}`, 'healthy4', 'healthy3', 'healthy2', 'healthy1']);
}

function getRiceGrowthStage(growthRatio) {
  if (growthRatio < 0.28) return 1;
  if (growthRatio < 0.52) return 2;
  if (growthRatio < 0.76) return 3;
  return 4;
}

function pickRiceTemplate(templates, candidates) {
  for (const key of candidates) {
    if (templates[key]) return templates[key];
  }
  return null;
}

function cloneRiceModel(template, visualState) {
  const clone = template.clone(true);
  clone.traverse?.((child) => {
    if (!child.isMesh) return;
    if (child.geometry) {
      child.userData = {
        ...(child.userData || {}),
        preserveGeometry: true,
      };
    }
    if (Array.isArray(child.material)) {
      child.material = child.material.map((material) => cloneRiceMaterial(material, visualState));
    } else {
      child.material = cloneRiceMaterial(child.material, visualState);
    }
    child.castShadow = true;
    child.receiveShadow = true;
  });
  return clone;
}

function seededUnit(row, col, salt) {
  const value = Math.sin((row + 1) * 12.9898 + (col + 1) * 78.233 + salt * 37.719) * 43758.5453;
  return value - Math.floor(value);
}

function cloneRiceMaterial(material, visualState) {
  const next = material?.clone?.() || new THREE.MeshStandardMaterial({ color: getVegetationColor(visualState) });
  next.userData = {
    ...(next.userData || {}),
    preserveTextureMaps: true,
  };

  if (next.color) {
    if (visualState === 'thriving') next.color.lerp(new THREE.Color(0x65b94a), 0.16);
    if (visualState === 'stressed') next.color.lerp(new THREE.Color(0xcaa85a), 0.26);
    if (visualState === 'withered') next.color.lerp(new THREE.Color(0x8f6a3d), 0.42);
  }

  next.side = THREE.DoubleSide;
  return next;
}

function addTrees(group, visualState, growthRatio) {
  const trunkGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.72, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x7a5132, roughness: 0.82 });
  const crownColor = getVegetationColor(visualState);
  const crownScaleY = visualState === 'withered' ? 0.55 : 0.72 + growthRatio * 0.4;
  [
    [-0.62, -0.72],
    [0.52, -0.1],
    [-0.12, 0.78],
  ].forEach(([x, z]) => {
    const trunk = new THREE.Mesh(trunkGeometry.clone(), trunkMaterial.clone());
    trunk.position.set(x, 0.46, z);
    trunk.castShadow = true;
    group.add(trunk);

    [
      { offset: [0, 0.96, 0], scale: [0.88, crownScaleY, 0.88] },
      { offset: [-0.22, 0.88, 0.08], scale: [0.58, crownScaleY * 0.85, 0.58] },
      { offset: [0.24, 0.9, -0.04], scale: [0.56, crownScaleY * 0.82, 0.56] },
      { offset: [0.02, 1.18, 0.02], scale: [0.52, crownScaleY * 0.76, 0.52] },
    ].forEach((crownPart, crownIndex) => {
      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(0.42 - crownIndex * 0.03, 14, 10),
        new THREE.MeshStandardMaterial({
          color: shiftHex(crownColor, randomBetween(-0.015, 0.02), randomBetween(-0.05, 0.05)),
          roughness: 0.82,
        }),
      );
      crown.position.set(x + crownPart.offset[0], crownPart.offset[1], z + crownPart.offset[2]);
      crown.scale.set(...crownPart.scale);
      crown.castShadow = true;
      group.add(crown);
    });

    if (visualState !== 'withered') {
      const fruitColor = visualState === 'thriving' ? 0xff8a5b : 0xffd0bd;
      const fruitCount = visualState === 'thriving' ? 4 : 2;
      for (let fruitIndex = 0; fruitIndex < fruitCount; fruitIndex += 1) {
        const fruit = new THREE.Mesh(
          new THREE.SphereGeometry(0.04, 10, 8),
          new THREE.MeshStandardMaterial({ color: fruitColor, roughness: 0.45 }),
        );
        fruit.position.set(
          x + randomBetween(-0.22, 0.22),
          0.86 + randomBetween(-0.02, 0.22),
          z + randomBetween(-0.22, 0.22),
        );
        fruit.castShadow = true;
        group.add(fruit);
      }
    }
  });
}

function addFloodCrops(group, visualState, growthRatio) {
  const stemGeometry = new THREE.CylinderGeometry(0.025, 0.035, 0.26 + growthRatio * 0.32, 6);
  const leafGeometry = new THREE.ConeGeometry(0.1, 0.22 + growthRatio * 0.12, 6);
  const material = new THREE.MeshStandardMaterial({ color: getVegetationColor(visualState), roughness: 0.9 });
  const density = visualState === 'withered' ? 3 : 4;

  for (let row = 0; row < density; row += 1) {
    for (let col = 0; col < density + 1; col += 1) {
      const x = -0.74 + (col / density) * 1.5;
      const z = -0.9 + (row / Math.max(1, density - 1)) * 1.8;

      const stem = new THREE.Mesh(stemGeometry.clone(), material.clone());
      stem.position.set(x, 0.22 + growthRatio * 0.18, z);
      stem.castShadow = true;
      group.add(stem);

      const leaf = new THREE.Mesh(leafGeometry.clone(), material.clone());
      leaf.position.set(x, 0.45 + growthRatio * 0.22, z);
      leaf.rotation.z = randomBetween(-0.25, 0.25) + (visualState === 'withered' ? 0.25 : 0);
      leaf.castShadow = true;
      group.add(leaf);

      const sideLeaf = new THREE.Mesh(leafGeometry.clone(), material.clone());
      sideLeaf.position.set(x + 0.06, 0.34 + growthRatio * 0.16, z + 0.04);
      sideLeaf.scale.set(0.75, 0.72, 0.75);
      sideLeaf.rotation.x = 0.3;
      sideLeaf.rotation.z = -0.45 + randomBetween(-0.16, 0.16) + (visualState === 'withered' ? 0.2 : 0);
      sideLeaf.castShadow = true;
      group.add(sideLeaf);
    }
  }
}

function createEnvironment(scene, parent, stage, maxAnisotropy = 1) {
  const skyDome = createSkyDome();
  scene.add(skyDome.mesh);

  const sunGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({ color: 0xffefb4, transparent: true, opacity: 0.18, depthWrite: false }),
  );
  sunGlow.position.set(8.8, 9.6, -10.5);
  sunGlow.scale.set(4.8, 4.8, 1);
  scene.add(sunGlow);

  const sunCore = new THREE.Sprite(
    new THREE.SpriteMaterial({ color: 0xfff6dd, transparent: true, opacity: 0.92, depthWrite: false }),
  );
  sunCore.position.copy(sunGlow.position);
  sunCore.scale.set(1.45, 1.45, 1);
  scene.add(sunCore);

  const hills = new THREE.Group();
  parent.add(hills);
  const hillMaterials = [];
  [
    { position: [-7.4, 0.8, -6.8], scale: [3.6, 1.6, 2.1] },
    { position: [-3.2, 0.95, -7.2], scale: [4.6, 1.9, 2.4] },
    { position: [1.2, 0.7, -6.9], scale: [4.1, 1.5, 2.2] },
    { position: [5.6, 0.88, -7.4], scale: [3.8, 1.7, 2.1] },
  ].forEach(({ position, scale }) => {
    const material = new THREE.MeshStandardMaterial({ color: 0x6f8366, roughness: 1 });
    const hill = new THREE.Mesh(new THREE.SphereGeometry(1.2, 18, 12), material);
    hill.position.set(...position);
    hill.scale.set(...scale);
    hill.castShadow = false;
    hill.receiveShadow = true;
    hills.add(hill);
    hillMaterials.push(material);
  });

  const cloudGroups = [];
  for (let index = 0; index < 7; index += 1) {
    const cloud = createCloudCluster(index);
    cloud.group.position.set(-10 + index * 3.6, 6.2 + (index % 3) * 0.65, -8.6 - (index % 2) * 0.8);
    scene.add(cloud.group);
    cloudGroups.push(cloud);
  }

  const backdrop = createBackdrop();
  scene.add(backdrop.group);

  return {
    skyDome,
    sunGlow,
    sunCore,
    hillMaterials,
    cloudGroups,
    backdrop,
  };
}

function createBackdrop() {
  const group = new THREE.Group();
  group.position.set(0, 0, 0);

  const frame = new THREE.Mesh(
    new THREE.PlaneGeometry(23.4, 11.8),
    new THREE.MeshBasicMaterial({
      color: 0xf7ecd4,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      fog: false,
    }),
  );
  frame.position.set(0, 4.2, -12.9);
  group.add(frame);

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(22.4, 10.8),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      fog: false,
    }),
  );
  plane.position.set(0, 4.15, -12.8);
  group.add(plane);

  const haze = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 12),
    new THREE.MeshBasicMaterial({
      color: 0xf6edd7,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      fog: false,
    }),
  );
  haze.position.set(0, 4.05, -12.4);
  group.add(haze);

  const backdrop = {
    group,
    frame,
    plane,
    haze,
  };

  return backdrop;
}

function createSkyDome() {
  const geometry = new THREE.SphereGeometry(34, 28, 18);
  const colorAttribute = new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 3), 3);
  geometry.setAttribute('color', colorAttribute);
  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  applySkyColors(geometry, 0x7cc3ff, 0xeaf8ff);
  return { mesh, geometry };
}

function createCloudCluster(index) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0xf5fafc,
    roughness: 0.92,
    transparent: true,
    opacity: 0.82,
  });

  [
    { offset: [0, 0, 0], scale: [1.35, 0.74, 0.92] },
    { offset: [-0.8, -0.06, 0.08], scale: [0.96, 0.58, 0.7] },
    { offset: [0.92, -0.02, -0.04], scale: [1.05, 0.64, 0.76] },
    { offset: [0.16, 0.24, 0.05], scale: [0.88, 0.52, 0.64] },
  ].forEach(({ offset, scale }) => {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.65, 16, 10), material.clone());
    puff.position.set(...offset);
    puff.scale.set(...scale);
    group.add(puff);
  });

  group.userData = {
    driftSpeed: 0.08 + (index % 3) * 0.018,
    baseX: -10 + index * 3.6,
    phase: index * 0.85,
  };

  return { group };
}

function createAmbientDrift() {
  const count = 180;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = randomBetween(-8.8, 8.8);
    positions[index * 3 + 1] = randomBetween(0.8, 6.4);
    positions[index * 3 + 2] = randomBetween(-5.8, 4.6);
    seeds[index] = randomBetween(0, Math.PI * 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffefaa,
    size: 0.05,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  return { points, positions, seeds };
}

function createNoiseTexture({ base, accent, line, width, height, streaks, dotCount }) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  context.fillStyle = base;
  context.fillRect(0, 0, width, height);

  for (let index = 0; index < streaks; index += 1) {
    context.strokeStyle = index % 3 === 0 ? accent : line;
    context.globalAlpha = 0.12 + Math.random() * 0.16;
    context.lineWidth = 1 + Math.random() * 2.5;
    context.beginPath();
    const startY = Math.random() * height;
    context.moveTo(0, startY);
    for (let x = 0; x <= width; x += 24) {
      context.lineTo(x, startY + Math.sin((x / width) * Math.PI * 2 + index) * (2 + Math.random() * 7));
    }
    context.stroke();
  }

  for (let index = 0; index < dotCount; index += 1) {
    context.fillStyle = index % 2 === 0 ? accent : line;
    context.globalAlpha = 0.1 + Math.random() * 0.2;
    const radius = 1 + Math.random() * 3.2;
    context.beginPath();
    context.arc(Math.random() * width, Math.random() * height, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createBankTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  const gradient = context.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, '#6c6f34');
  gradient.addColorStop(0.42, '#7a6a35');
  gradient.addColorStop(1, '#4f5d27');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  for (let index = 0; index < 90; index += 1) {
    context.strokeStyle = index % 4 === 0 ? 'rgba(156,132,69,0.24)' : 'rgba(42,64,25,0.2)';
    context.lineWidth = 1 + Math.random() * 2.4;
    context.beginPath();
    const startX = Math.random() * 256;
    const startY = Math.random() * 256;
    context.moveTo(startX, startY);
    context.lineTo(startX + randomBetween(-34, 34), startY + randomBetween(-8, 18));
    context.stroke();
  }

  for (let index = 0; index < 190; index += 1) {
    context.fillStyle = index % 3 === 0 ? 'rgba(157,181,76,0.34)' : 'rgba(75,50,24,0.2)';
    context.beginPath();
    context.ellipse(
      Math.random() * 256,
      Math.random() * 256,
      1 + Math.random() * 2.6,
      0.5 + Math.random() * 1.4,
      Math.random() * Math.PI,
      0,
      Math.PI * 2,
    );
    context.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createPaddyBedTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  const gradient = context.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, '#87965f');
  gradient.addColorStop(0.55, '#6c7a45');
  gradient.addColorStop(1, '#536338');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  for (let index = 0; index < 120; index += 1) {
    context.fillStyle = index % 2 === 0 ? 'rgba(50,72,34,0.18)' : 'rgba(196,178,104,0.16)';
    context.beginPath();
    context.arc(Math.random() * 256, Math.random() * 256, 0.8 + Math.random() * 3.2, 0, Math.PI * 2);
    context.fill();
  }

  for (let index = 0; index < 26; index += 1) {
    context.strokeStyle = 'rgba(225,236,185,0.12)';
    context.lineWidth = 1 + Math.random() * 1.5;
    context.beginPath();
    const startY = Math.random() * 256;
    context.moveTo(0, startY);
    for (let x = 0; x <= 256; x += 32) {
      context.lineTo(x, startY + Math.sin((x / 256) * Math.PI * 2 + index) * randomBetween(1, 4));
    }
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createWaterTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  const gradient = context.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, 'rgba(231,248,220,0.48)');
  gradient.addColorStop(0.45, 'rgba(119,174,163,0.34)');
  gradient.addColorStop(1, 'rgba(245,255,221,0.42)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  for (let index = 0; index < 38; index += 1) {
    context.strokeStyle = index % 5 === 0
      ? `rgba(255,250,183,${0.11 + Math.random() * 0.12})`
      : `rgba(255,255,255,${0.07 + Math.random() * 0.1})`;
    context.lineWidth = 1 + Math.random() * 2;
    context.beginPath();
    const baseY = Math.random() * 256;
    context.moveTo(0, baseY);
    for (let x = 0; x <= 256; x += 18) {
      context.lineTo(x, baseY + Math.sin((x / 256) * Math.PI * 3 + index) * (2 + Math.random() * 5));
    }
    context.stroke();
  }

  for (let index = 0; index < 120; index += 1) {
    context.fillStyle = index % 4 === 0 ? 'rgba(58,92,54,0.15)' : 'rgba(255,248,173,0.1)';
    context.beginPath();
    context.arc(Math.random() * 256, Math.random() * 256, 0.7 + Math.random() * 2.1, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function updateSelectionFrame(current, selectedPlotId) {
  if (!current?.selectionFrame) return;
  const mesh = current.plotMeshes.find((plotMesh) => plotMesh.userData?.plotId === selectedPlotId) || current.plotMeshes[0];
  if (!mesh) {
    current.selectionFrame.visible = false;
    return;
  }
  current.selectionFrame.visible = true;
  current.selectionFrame.position.set(mesh.parent?.position.x || 0, 0, 0);
}

function updateWeather(current, eventKey) {
  const style = WEATHER_STYLE[eventKey] || WEATHER_STYLE.clear;
  const palette = deriveEnvironmentPalette(style);
  current.scene.background = new THREE.Color(style.sky);
  current.scene.fog = new THREE.Fog(style.fog, 16, 36);
  current.renderer.setClearColor(style.sky, 1);
  current.hemiLight.color.setHex(style.hemi);
  current.sunLight.color.setHex(style.sun);
  current.sunLight.intensity = style.intensity;
  current.rain.points.visible = style.rain;
  current.ambientDrift.points.visible = !style.rain;
  current.ambientDrift.points.material.color.copy(palette.drift);
  current.ambientDrift.points.material.opacity = style.rain ? 0 : 0.12 + Math.max(0, style.intensity - 1) * 0.04;

  if (current.environment) {
    applySkyColors(current.environment.skyDome.geometry, palette.topSky, palette.horizon);
    current.environment.sunGlow.material.color.copy(palette.halo);
    current.environment.sunGlow.material.opacity = 0.14 + Math.max(0, style.intensity - 0.8) * 0.06;
    current.environment.sunCore.material.color.setHex(style.sun);
    current.environment.sunCore.material.opacity = 0.75 + Math.max(0, style.intensity - 1) * 0.08;

    current.environment.hillMaterials.forEach((material, index) => {
      material.color.copy(index % 2 === 0 ? palette.hillPrimary : palette.hillSecondary);
    });

    current.environment.cloudGroups.forEach((cloud) => {
      cloud.group.children.forEach((puff, index) => {
        puff.material.color.copy(index % 2 === 0 ? palette.cloud : palette.cloudAccent);
        puff.material.opacity = style.rain ? 0.9 : 0.7;
      });
    });

    if (current.environment.backdrop?.plane?.material) {
      current.environment.backdrop.plane.material.color.copy(palette.horizon.clone().lerp(new THREE.Color(0xffffff), 0.62));
      current.environment.backdrop.plane.material.opacity = style.rain ? 0.72 : 0.9;
      current.environment.backdrop.haze.material.color.copy(palette.horizon);
      current.environment.backdrop.haze.material.opacity = style.rain ? 0.24 : 0.15;
    }
  }
}

function animateRain(rain, time) {
  if (!rain?.points?.visible) return;
  const positions = rain.positions;
  const speed = 0.035 + Math.sin(time * 0.001) * 0.008;
  for (let index = 0; index < positions.length / 3; index += 1) {
    const yIndex = index * 3 + 1;
    positions[yIndex] -= speed;
    if (positions[yIndex] < 0.15) {
      positions[index * 3] = randomBetween(-7, 7);
      positions[yIndex] = randomBetween(5, 8.5);
      positions[index * 3 + 2] = randomBetween(-3.4, 3.4);
    }
  }
  rain.points.geometry.attributes.position.needsUpdate = true;
}

function animateAmbientDrift(drift, time) {
  if (!drift?.points?.visible) return;
  const positions = drift.positions;
  for (let index = 0; index < positions.length / 3; index += 1) {
    const xIndex = index * 3;
    const yIndex = xIndex + 1;
    const zIndex = xIndex + 2;
    const phase = drift.seeds[index];
    positions[xIndex] += Math.sin(time * 0.00025 + phase) * 0.0026;
    positions[yIndex] += Math.cos(time * 0.0003 + phase) * 0.0014;
    positions[zIndex] += Math.sin(time * 0.0002 + phase) * 0.0012;

    if (positions[yIndex] > 6.9) positions[yIndex] = 1;
    if (positions[yIndex] < 0.7) positions[yIndex] = 6.2;
  }
  drift.points.geometry.attributes.position.needsUpdate = true;
}

function animateEnvironment(environment, time) {
  if (!environment) return;

  environment.cloudGroups.forEach((cloud, index) => {
    const drift = ((time * 0.00006 * (1 + cloud.group.userData.driftSpeed)) + index * 0.3) % 1;
    cloud.group.position.x = cloud.group.userData.baseX + drift * 22;
    cloud.group.position.y = 6.2 + (index % 3) * 0.65 + Math.sin(time * 0.0005 + cloud.group.userData.phase) * 0.12;
  });

  environment.sunGlow.position.y = 9.2 + Math.sin(time * 0.00035) * 0.2;
  environment.sunCore.position.y = environment.sunGlow.position.y + 0.08;
}

function animatePlots(groups, time) {
  const safeGroups = Array.isArray(groups) ? groups : [];
  safeGroups.forEach((group) => {
    const phase = group.userData?.animationPhase || 0;

    const beacon = group.userData?.treatmentBeacon;
    if (beacon?.mesh) {
      beacon.mesh.position.y = beacon.baseY;
      const pulse = beacon.state === 'pending' ? 0.32 : 0.18;
      beacon.mesh.material.emissiveIntensity = 0.28 + (Math.sin(time * 0.006 + phase) + 1) * pulse;
      beacon.mesh.scale.setScalar(beacon.state === 'pending' ? 1.02 : 1);
    }

    const buffAura = group.userData?.buffAura;
    if (buffAura?.ring) {
      const pulse = 1 + Math.sin(time * 0.004 + phase) * 0.08;
      buffAura.ring.scale.setScalar(pulse);
      buffAura.ring.rotation.z = time * 0.0012;
      buffAura.ring.material.opacity = 0.42 + (Math.sin(time * 0.0045 + phase) + 1) * 0.08;
    }

    if (Array.isArray(buffAura?.orbiters)) {
      buffAura.orbiters.forEach((orb, index) => {
        const angle = time * 0.0015 + orb.userData.baseAngle;
        const radius = orb.userData.orbitRadius;
        orb.position.set(
          Math.cos(angle) * radius,
          0.48 + orb.userData.heightOffset,
          Math.sin(angle) * radius,
        );
        orb.material.emissiveIntensity = 0.28 + (Math.sin(time * 0.005 + phase + index) + 1) * 0.14;
      });
    }

    const waterSurface = group.userData?.waterSurface;
    if (waterSurface?.texture) {
      waterSurface.texture.offset.x = (time * 0.00004 + waterSurface.phase) % 1;
      waterSurface.texture.offset.y = Math.sin(time * 0.00022 + waterSurface.phase) * 0.08;
      waterSurface.mesh.material.opacity = THREE.MathUtils.clamp(
        waterSurface.mesh.material.opacity + Math.sin(time * 0.0018 + phase) * 0.002,
        0.16,
        0.48,
      );
    }
  });
}

function animateSprayBursts(current, deltaSeconds) {
  if (!current?.sprayBursts?.length) return;

  const remainingBursts = [];
  current.sprayBursts.forEach((burst) => {
    burst.age += deltaSeconds;
    const progress = burst.age / burst.lifetime;

    for (let index = 0; index < burst.positions.length / 3; index += 1) {
      const xIndex = index * 3;
      const yIndex = xIndex + 1;
      const zIndex = xIndex + 2;

      burst.velocities[yIndex] -= 1.7 * deltaSeconds;
      burst.positions[xIndex] += burst.velocities[xIndex] * deltaSeconds;
      burst.positions[yIndex] += burst.velocities[yIndex] * deltaSeconds;
      burst.positions[zIndex] += burst.velocities[zIndex] * deltaSeconds;

      burst.velocities[xIndex] *= 0.988;
      burst.velocities[zIndex] *= 0.988;
    }

    burst.points.geometry.attributes.position.needsUpdate = true;
    burst.points.material.opacity = Math.max(0, 0.88 * (1 - progress));
    burst.mist.material.opacity = Math.max(0, 0.22 * (1 - progress));
    burst.mist.scale.set(1 + progress * 0.9, 1 + progress * 0.35, 1 + progress * 0.9);

    if (progress < 1) {
      remainingBursts.push(burst);
      return;
    }

    current.effectGroup?.remove(burst.group);
    disposeObject(burst.group);
  });

  current.sprayBursts = remainingBursts;
}

function clearGroup(group) {
  while (group.children.length) {
    const child = group.children[0];
    group.remove(child);
    disposeObject(child);
  }
}

function disposeObject(object) {
  if (!object) return;
  object.traverse?.((child) => {
    if (child.geometry && !child.userData?.preserveGeometry) child.geometry.dispose();
    if (Array.isArray(child.material)) {
      child.material.forEach((material) => disposeMaterial(material));
    } else {
      disposeMaterial(child.material);
    }
  });
}

function disposeMaterial(material) {
  if (!material) return;
  if (!material.userData?.preserveTextureMaps) {
    ['map', 'alphaMap', 'emissiveMap', 'normalMap', 'roughnessMap', 'metalnessMap'].forEach((key) => {
      material[key]?.dispose?.();
    });
  }
  material.dispose?.();
}

function getVegetationColor(visualState) {
  if (visualState === 'thriving') return 0x56a846;
  if (visualState === 'steady') return 0x8aac4d;
  if (visualState === 'stressed') return 0xc3ad58;
  return 0x8a6c43;
}

function triggerSprayBursts(current, plots, previousSnapshots, stage) {
  const safePlots = Array.isArray(plots) ? plots : [];
  safePlots.forEach((plot) => {
    if (!plot || plot.locked) return;

    const previous = previousSnapshots?.get(plot.id) || { treatmentCount: 0, lastTreatmentTurn: null };
    const next = createPlotSnapshot(plot);
    const justApplied =
      next.treatmentCount > previous.treatmentCount ||
      (next.lastTreatmentTurn && next.lastTreatmentTurn !== previous.lastTreatmentTurn);

    if (!justApplied) return;

    const plotGroup = current.plotGroups?.get(plot.id);
    if (!plotGroup || !current.effectGroup) return;

    const effect = createSprayBurst(stage?.primaryItemKey || getSafeTreatments(plot.treatments)[0]?.key);
    effect.group.position.copy(plotGroup.position);
    current.effectGroup.add(effect.group);
    current.sprayBursts.push(effect);
  });
}

function createPlotSnapshots(plots) {
  const snapshots = new Map();
  const safePlots = Array.isArray(plots) ? plots : [];
  safePlots.forEach((plot) => {
    if (plot?.id) {
      snapshots.set(plot.id, createPlotSnapshot(plot));
    }
  });
  return snapshots;
}

function createPlotSnapshot(plot) {
  return {
    treatmentCount: getSafeTreatments(plot?.treatments).length,
    lastTreatmentTurn: Number.isFinite(plot?.lastTreatmentTurn) ? plot.lastTreatmentTurn : null,
  };
}

function createSprayBurst(treatmentKey) {
  const colors = getTreatmentVisual(treatmentKey);
  const count = 36;
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const xIndex = index * 3;
    positions[xIndex] = -0.92 + randomBetween(-0.08, 0.02);
    positions[xIndex + 1] = 0.56 + randomBetween(-0.06, 0.08);
    positions[xIndex + 2] = 1.06 + randomBetween(-0.12, 0.12);

    velocities[xIndex] = 1.7 + randomBetween(0, 1.05);
    velocities[xIndex + 1] = 0.18 + randomBetween(-0.18, 0.4);
    velocities[xIndex + 2] = -1.55 + randomBetween(-0.45, 0.15);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: colors.primary,
    size: 0.1,
    transparent: true,
    opacity: 0.88,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  const mist = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 10),
    new THREE.MeshStandardMaterial({
      color: colors.secondary,
      emissive: colors.secondary,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.22,
      roughness: 0.2,
    }),
  );
  mist.position.set(-0.86, 0.56, 1.02);
  mist.scale.set(1.15, 0.6, 1.15);

  const group = new THREE.Group();
  group.add(points);
  group.add(mist);

  return {
    group,
    points,
    mist,
    positions,
    velocities,
    age: 0,
    lifetime: 1.15,
  };
}

function getTreatmentVisual(treatmentKey) {
  if (treatmentKey === 'heatShield') {
    return { primary: 0xffb74a, secondary: 0xffef8d };
  }
  if (treatmentKey === 'frostGuard') {
    return { primary: 0x7bd7ff, secondary: 0xe2fbff };
  }
  if (treatmentKey === 'rootBooster') {
    return { primary: 0x6ce0a4, secondary: 0xc4ffd2 };
  }
  return { primary: 0x7fe7ff, secondary: 0xeafcff };
}

function getSafeTreatments(treatments) {
  return Array.isArray(treatments) ? treatments.filter((treatment) => treatment && typeof treatment === 'object') : [];
}

function getLegendPillStyle(index, role) {
  const positions = [
    { left: '27%', top: '72%' },
    { left: '50%', top: '67%' },
    { left: '69%', top: '72%' },
  ];
  const fallback = positions[Math.max(0, Math.min(index, positions.length - 1))] || positions[0];
  return {
    left: fallback.left,
    top: fallback.top,
    zIndex: role === 'control' ? 1 : 2,
  };
}

function deriveEnvironmentPalette(style) {
  const sky = new THREE.Color(style.sky);
  const fog = new THREE.Color(style.fog);
  const hemi = new THREE.Color(style.hemi);
  const sun = new THREE.Color(style.sun);

  return {
    topSky: sky.clone().offsetHSL(0, 0.06, -0.16),
    horizon: fog.clone().lerp(sky, 0.4),
    halo: sun.clone().lerp(new THREE.Color(0xffffff), 0.35),
    cloud: fog.clone().lerp(new THREE.Color(0xffffff), 0.24),
    cloudAccent: fog.clone().lerp(sky, 0.18),
    hillPrimary: hemi.clone().offsetHSL(0, -0.16, -0.24),
    hillSecondary: hemi.clone().offsetHSL(0, -0.1, -0.32),
    drift: sun.clone().lerp(new THREE.Color(style.sky), 0.45),
  };
}

function applySkyColors(geometry, topColorValue, horizonColorValue) {
  if (!geometry?.attributes?.position || !geometry?.attributes?.color) return;

  const topColor = new THREE.Color(topColorValue);
  const horizonColor = new THREE.Color(horizonColorValue);
  const positions = geometry.attributes.position;
  const colors = geometry.attributes.color;

  for (let index = 0; index < positions.count; index += 1) {
    const y = positions.getY(index);
    const mix = THREE.MathUtils.clamp((y + 12) / 20, 0, 1);
    const color = horizonColor.clone().lerp(topColor, mix);
    colors.setXYZ(index, color.r, color.g, color.b);
  }

  colors.needsUpdate = true;
}

function shiftHex(hex, hueShift, lightnessShift) {
  const color = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  color.setHSL(
    THREE.MathUtils.euclideanModulo(hsl.h + hueShift, 1),
    THREE.MathUtils.clamp(hsl.s, 0.1, 1),
    THREE.MathUtils.clamp(hsl.l + lightnessShift, 0.05, 0.95),
  );
  return color.getHex();
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
