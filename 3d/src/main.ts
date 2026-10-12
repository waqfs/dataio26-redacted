import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { CAMPUSES, OHIO_OUTLINE, geoTo3D, type Campus } from './geodata';
import { loadAllData, type AllData } from './data';
import { renderOverviewPanel, renderCampusPanel, renderBuildingPanel, renderComparePanel, closeComparePanel } from './panel';
import { loadMapTiles, clearMapTiles } from './tiles';

// ─── Types ───
interface BuildingGeo {
  number: string;
  name: string;
  campus: string;
  lat: number;
  lng: number;
  area: number;
  year: string;
  floorsAbove: number;
  floorsBelow: number;
}

// ─── State ───
let selectedCampus: Campus | null = null;
let allData: AllData | null = null;
let campusMarkers: { mesh: THREE.Mesh; campus: Campus; beam: THREE.Mesh; ring: THREE.Mesh; sphere: THREE.Mesh }[] = [];
let buildingMeshes: { mesh: THREE.Mesh; building: BuildingGeo }[] = [];
let buildingGroup: THREE.Group = new THREE.Group();
let showingBuildings = false;
let stadiumGeometry: THREE.BufferGeometry | null = null;

// ─── Scene Setup ───
const canvas = document.getElementById('scene') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0a14, 0.012);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.001, 200);
camera.position.set(0, 18, 14);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI / 2.2;
controls.minDistance = 0.01;
controls.maxDistance = 40;
controls.target.set(0, 0, 0);
(controls as any).zoomToCursor = true;

// ─── Lighting ───
const ambient = new THREE.AmbientLight(0x334455, 0.5);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xfff5e8, 1.2);
dirLight.position.set(8, 15, 5);
scene.add(dirLight);

const pointLight = new THREE.PointLight(0xbb0000, 2, 30);
pointLight.position.set(0, 8, 0);
scene.add(pointLight);

// ─── Starfield background ───
function createStars() {
  const geo = new THREE.BufferGeometry();
  const count = 2000;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 100;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.6 });
  return new THREE.Points(geo, mat);
}
scene.add(createStars());

// ─── Ground plane ───
const groundGeo = new THREE.PlaneGeometry(80, 80);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x0a0a18,
  metalness: 0.3,
  roughness: 0.8,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.05;
scene.add(ground);

// ─── Grid ───
const grid = new THREE.GridHelper(60, 60, 0x1a1a2e, 0x111122);
grid.position.y = -0.03;
scene.add(grid);

// ─── Ohio State Shape ───
function createOhio() {
  const scale = 10;
  const shape = new THREE.Shape();

  // Negate Y in shape space because rotateX(-PI/2) will negate it again,
  // which would otherwise flip the fill vertically relative to the outline.
  const points = OHIO_OUTLINE.map(([lng, lat]) => geoTo3D(lat, lng, scale));
  shape.moveTo(points[0][0], -points[0][1]);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i][0], -points[i][1]);
  }
  shape.closePath();

  // Extruded Ohio
  const extrudeSettings = { depth: 0.25, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.rotateX(-Math.PI / 2);

  const mat = new THREE.MeshStandardMaterial({
    color: 0x1a2238,
    metalness: 0.4,
    roughness: 0.6,
    transparent: true,
    opacity: 0.85,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0;

  // Outline glow
  const linePoints = points.map(([x, z]) => new THREE.Vector3(x, 0.28, z));
  linePoints.push(linePoints[0].clone());
  const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
  const lineMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.5 });
  const outline = new THREE.Line(lineGeo, lineMat);

  const group = new THREE.Group();
  group.add(mesh);
  group.add(outline);
  return group;
}
scene.add(createOhio());

// ─── Campus Markers ───
function createCampusMarkers() {
  const scale = 10;

  CAMPUSES.forEach(campus => {
    const [x, z] = geoTo3D(campus.lat, campus.lng, scale);
    const color = new THREE.Color(campus.color);

    // Pillar — height represents building count (logarithmic scale for visual)
    const height = Math.max(0.3, Math.log(campus.buildings + 1) * 0.5);

    // Base disk
    const ringGeo = new THREE.RingGeometry(0.3, 0.45, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.42, z); // raised above Ohio extrusion to prevent z-fighting
    scene.add(ring);

    // Pillar
    const baseY = 0.42;
    const pillarGeo = new THREE.CylinderGeometry(0.15, 0.2, height, 16);
    const pillarMat = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.6,
      roughness: 0.3,
      emissive: color,
      emissiveIntensity: 0.3,
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(x, baseY + height / 2, z);
    scene.add(pillar);

    // Glowing beam above pillar
    const beamGeo = new THREE.CylinderGeometry(0.02, 0.08, 1.5, 8);
    const beamMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4 });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(x, baseY + height + 0.75, z);
    scene.add(beam);

    // Sphere top
    const sphereGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(x, baseY + height + 1.5, z);
    scene.add(sphere);

    campusMarkers.push({ mesh: pillar, campus, beam, ring, sphere });
  });
}
createCampusMarkers();

// Add building group to scene (populated when campus selected)
scene.add(buildingGroup);

// ─── Custom Building Geometries ───

// Pre-load the Ohio Stadium STL model
function loadStadiumModel(): Promise<THREE.BufferGeometry> {
  return new Promise((resolve, reject) => {
    const loader = new STLLoader();
    loader.load('/data/ohio_stadium.stl', (geometry) => {
      // Center the geometry at origin
      geometry.computeBoundingBox();
      const box = geometry.boundingBox!;
      const center = new THREE.Vector3();
      box.getCenter(center);
      geometry.translate(-center.x, -center.y, -center.z);

      // Normalize: scale to a unit-ish size, we'll rescale per-building later
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const normScale = 1 / maxDim;
      geometry.scale(normScale, normScale, normScale);

      // Rotate 180 degrees around Y axis to correct orientation
      geometry.rotateY(Math.PI);

      // Recompute after transforms
      geometry.computeBoundingBox();
      // Shift so the bottom sits at y=0
      const minY = geometry.boundingBox!.min.y;
      geometry.translate(0, -minY, 0);

      geometry.computeVertexNormals();
      stadiumGeometry = geometry;
      resolve(geometry);
    }, undefined, reject);
  });
}

// Create a hexagon-shaped prism geometry for towers
function createHexagonGeometry(radius: number, height: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const sides = 6;
  
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2; // Start from top
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) {
      shape.moveTo(px, py);
    } else {
      shape.lineTo(px, py);
    }
  }
  shape.closePath();

  const extrudeSettings = {
    depth: height,
    bevelEnabled: false,
  };
  
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // Rotate so it extrudes upward (Y axis) instead of Z
  geo.rotateX(-Math.PI / 2);
  // After rotateX, geometry spans y: 0 to height. Shift down so it's centered
  // like BoxGeometry (y: -height/2 to height/2), matching the position.set offset
  geo.translate(0, -height / 2, 0);
  
  return geo;
}

// ─── Building-level drill-down ───
function showBuildingsForCampus(campus: Campus) {
  clearBuildings();
  if (!allData?.buildingsGeo) return;

  const scale = 10;
  const campusName = campus.name.toLowerCase();

  // Filter buildings by campus name
  const buildings: BuildingGeo[] = (allData.buildingsGeo as BuildingGeo[]).filter((b: BuildingGeo) => {
    const bc = (b.campus || '').toLowerCase();
    // match "Columbus" with "Columbus", "Medical Center" with "Medical Center", "Satellite" with "Satellite Locations" etc
    if (campusName === 'satellite locations') return bc === 'satellite';
    return bc.includes(campusName) || campusName.includes(bc);
  });

  // Only include buildings within Ohio bounds (filter out far-flung satellites)
  const filteredBuildings = buildings.filter(b => {
    return b.lat >= 38.0 && b.lat <= 42.5 && b.lng >= -85.5 && b.lng <= -80.0;
  });

  // Get energy data for coloring - match by name since siteid != building number
  const euiBldgs: any[] = allData.euiOverview?.all_buildings ?? [];

  // Create a lookup of EUI by normalized building name
  const euiMap = new Map<string, number>();
  euiBldgs.forEach((b: any) => {
    const name = (b.sitename || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (name && b.eui) euiMap.set(name, b.eui);
  });

  const maxEUI = Math.max(...Array.from(euiMap.values()), 500);

  filteredBuildings.forEach(b => {
    const [x, z] = geoTo3D(b.lat, b.lng, scale);

    // Size buildings using actual floor data
    const sqft = Math.max(b.area, 50);
    const floors = Math.max(1, b.floorsAbove || 1);
    const footprint = sqft / floors; // sqft per floor

    // Scale: at scale=10, 1 degree lat ≈ 10 units. 1 degree ≈ 111km ≈ 364,173 ft
    const scaleFactor = 1 / 36417;
    const side = Math.sqrt(footprint) * scaleFactor;
    const width = side;
    const depth = side;

    // Height based on number of floors — no caps
    const floorHeight = 0.0005; // units per floor
    const height = floors * floorHeight;

    // Color based on EUI (energy per sqft) — solid bucket colors for easy distinction
    // Match by normalized name
    const bName = (b.name || '').toLowerCase().replace(/\s*\(.*?\)\s*/g, '').replace(/[^a-z0-9]/g, '');
    const eui = euiMap.get(bName);
    let color: THREE.Color;
    if (eui !== undefined) {
      // Solid colors per EUI range
      if (eui < 100)       color = new THREE.Color(0x22c55e); // green
      else if (eui < 300)  color = new THREE.Color(0xeab308); // yellow
      else if (eui < 600)  color = new THREE.Color(0xf97316); // orange
      else if (eui < 1200) color = new THREE.Color(0xef4444); // red
      else                 color = new THREE.Color(0x7f1d1d); // dark red
    } else {
      color = new THREE.Color(0x6b7280); // grey for no EUI data
    }

    // Create geometry based on building type
    let geo: THREE.BufferGeometry;
    const buildingNumber = b.number;
    
    if (buildingNumber === '082' && stadiumGeometry) {
      // Ohio Stadium - loaded STL model, scaled to fit building footprint
      geo = stadiumGeometry.clone();
      // The STL is normalized to ~1 unit; scale to match the building's footprint & height
      const targetWidth = width * 3;
      const targetHeight = height * 1.5;
      const targetDepth = depth * 3;
      geo.computeBoundingBox();
      const stlSize = new THREE.Vector3();
      geo.boundingBox!.getSize(stlSize);
      geo.scale(
        targetWidth / stlSize.x,
        targetHeight / stlSize.y,
        targetDepth / stlSize.z
      );
    } else if (buildingNumber === '271' || buildingNumber === '272') {
      // Lincoln Tower (271) and Morrill Tower (272) - hexagon shaped
      geo = createHexagonGeometry(width * 0.8, height);
    } else {
      // Default box geometry for other buildings
      geo = new THREE.BoxGeometry(width, height, depth);
    }

    const mat = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.5,
      roughness: 0.4,
      emissive: color,
      emissiveIntensity: 0.2,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.43 + height / 2, z); // buildings sit on top of map tiles (0.43)
    buildingGroup.add(mesh);
    buildingMeshes.push({ mesh, building: b });
  });

  showingBuildings = true;

  // Show EUI legend
  const legend = document.getElementById('eui-legend');
  if (legend) legend.style.display = 'block';
}

function clearBuildings() {
  buildingGroup.clear();
  buildingMeshes = [];
  showingBuildings = false;

  // Hide EUI legend
  const legend = document.getElementById('eui-legend');
  if (legend) legend.style.display = 'none';
}

// ─── Raycaster for interaction ───
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip')!;

function onMouseMove(event: MouseEvent) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Check building meshes first (when zoomed in)
  if (showingBuildings && buildingMeshes.length > 0) {
    const bMeshes = buildingMeshes.map(m => m.mesh);
    const bIntersects = raycaster.intersectObjects(bMeshes);

    if (bIntersects.length > 0) {
      const hit = buildingMeshes.find(m => m.mesh === bIntersects[0].object);
      if (hit) {
        canvas.style.cursor = 'pointer';
        tooltip.className = 'tooltip visible';
        const b = hit.building;
        const euiBuildings = allData?.euiOverview?.all_buildings ?? [];
        const bNameNorm = (b.name || '').toLowerCase().replace(/\s*\(.*?\)\s*/g, '').replace(/[^a-z0-9]/g, '');
        const eui = euiBuildings.find((e: any) => (e.sitename || '').toLowerCase().replace(/[^a-z0-9]/g, '') === bNameNorm);
        tooltip.innerHTML = `<strong>${b.name}</strong><br>${b.area > 0 ? b.area.toLocaleString() + ' sq ft' : 'Unknown size'} · ${b.floorsAbove || '?'} floors${b.year ? ' · Built ' + b.year : ''}${eui ? '<br>EUI: ' + eui.eui.toFixed(0) : ''}`;
        tooltip.style.left = event.clientX + 15 + 'px';
        tooltip.style.top = event.clientY - 10 + 'px';

        // Highlight hovered building
        buildingMeshes.forEach(m => {
          (m.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = m === hit ? 0.8 : 0.2;
        });
        return;
      }
    }
    // Reset highlights when not hovering a building
    buildingMeshes.forEach(m => {
      (m.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2;
    });
  }

  // Check campus markers (only when not showing buildings)
  if (!showingBuildings) {
    const meshes = campusMarkers.map(m => m.mesh);
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hit = campusMarkers.find(m => m.mesh === intersects[0].object);
      if (hit) {
        canvas.style.cursor = 'pointer';
        tooltip.className = 'tooltip visible';
        tooltip.innerHTML = `<strong>${hit.campus.name}</strong><br>${hit.campus.buildings} buildings · ${hit.campus.metered} metered`;
        tooltip.style.left = event.clientX + 15 + 'px';
        tooltip.style.top = event.clientY - 10 + 'px';
        return;
      }
    }
  }
  canvas.style.cursor = 'default';
  tooltip.className = 'tooltip';
}

function onClick(event: MouseEvent) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Check building meshes first (when zoomed in)
  if (showingBuildings && buildingMeshes.length > 0) {
    const bMeshes = buildingMeshes.map(m => m.mesh);
    const bIntersects = raycaster.intersectObjects(bMeshes);
    if (bIntersects.length > 0) {
      const hit = buildingMeshes.find(m => m.mesh === bIntersects[0].object);
      if (hit && allData) {
        renderBuildingPanel(hit.building, selectedCampus!, allData);
        return;
      }
    }
  }

  // Check campus markers (only when not showing buildings)
  if (!showingBuildings) {
    const meshes = campusMarkers.map(m => m.mesh);
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hit = campusMarkers.find(m => m.mesh === intersects[0].object);
      if (hit) {
        selectCampus(hit.campus);
      }
    }
  }
}

canvas.addEventListener('mousemove', onMouseMove);
canvas.addEventListener('click', onClick);

// Right-click for comparison panel
canvas.addEventListener('contextmenu', (event: MouseEvent) => {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (showingBuildings && buildingMeshes.length > 0) {
    const bMeshes = buildingMeshes.map(m => m.mesh);
    const bIntersects = raycaster.intersectObjects(bMeshes);
    if (bIntersects.length > 0) {
      const hit = buildingMeshes.find(m => m.mesh === bIntersects[0].object);
      if (hit && allData && selectedCampus) {
        // If no building is selected in main panel, treat as left-click
        const mainPanelHasBuilding = document.querySelector('#panel-body .back-btn') !== null;
        if (!mainPanelHasBuilding) {
          renderBuildingPanel(hit.building, selectedCampus, allData);
        } else {
          renderComparePanel(hit.building, selectedCampus, allData);
        }
      }
    }
  }
});

// ─── Campus selection ───
function selectCampus(campus: Campus) {
  selectedCampus = campus;
  const scale = 10;
  const [x, z] = geoTo3D(campus.lat, campus.lng, scale);

  // Show buildings for this campus
  showBuildingsForCampus(campus);

  // Load map tiles around this campus
  loadMapTiles(scene, campus.lat, campus.lng, 10, 15, 12);

  // Hide campus pillars/beams/rings when zoomed in
  campusMarkers.forEach(m => {
    m.mesh.visible = false;
    m.beam.visible = false;
    m.ring.visible = false;
    m.sphere.visible = false;
  });

  // Animate camera to campus — zoom in very close to see building cubes
  animateCamera(new THREE.Vector3(x + 0.08, 0.55, z + 0.08), new THREE.Vector3(x, 0.43, z));

  // Update panel
  if (allData) renderCampusPanel(campus, allData);

  // Hide instructions
  document.getElementById('instructions')!.classList.add('hidden');
}

export function deselectCampus() {
  selectedCampus = null;
  clearBuildings();
  clearMapTiles(scene);
  closeComparePanel();

  // Show campus pillars/beams/rings again
  campusMarkers.forEach(m => {
    m.mesh.visible = true;
    m.beam.visible = true;
    m.ring.visible = true;
    m.sphere.visible = true;
  });

  animateCamera(new THREE.Vector3(0, 18, 14), new THREE.Vector3(0, 0, 0));
  if (allData) renderOverviewPanel(allData);
}

// Expose globally for panel to call
(window as any).__deselectCampus = deselectCampus;
(window as any).__backToCampus = () => {
  if (selectedCampus && allData) {
    renderCampusPanel(selectedCampus, allData);
  }
};

// ─── Camera animation ───
let cameraTarget = { pos: camera.position.clone(), lookAt: controls.target.clone() };
let cameraStart = { pos: camera.position.clone(), lookAt: controls.target.clone() };
let animating = false;
let animProgress = 0;
const ANIM_DURATION = 1.2; // seconds

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function animateCamera(toPos: THREE.Vector3, toLookAt: THREE.Vector3) {
  cameraStart = { pos: camera.position.clone(), lookAt: controls.target.clone() };
  cameraTarget = { pos: toPos, lookAt: toLookAt };
  animProgress = 0;
  animating = true;
  controls.enabled = false;
}

function updateCameraAnimation() {
  if (!animating) return;
  animProgress += 0.016 / ANIM_DURATION; // ~60fps
  if (animProgress >= 1) animProgress = 1;
  const t = easeInOutCubic(animProgress);

  camera.position.lerpVectors(cameraStart.pos, cameraTarget.pos, t);
  controls.target.lerpVectors(cameraStart.lookAt, cameraTarget.lookAt, t);
  camera.lookAt(controls.target);

  if (animProgress >= 1) {
    camera.position.copy(cameraTarget.pos);
    controls.target.copy(cameraTarget.lookAt);
    controls.enabled = true;
    controls.update();
    animating = false;
  }
}

// ─── Panel Toggle ───
const panel = document.getElementById('panel')!;
const panelToggle = document.getElementById('panel-toggle')!;

panelToggle.addEventListener('click', () => {
  panel.classList.toggle('collapsed');
  panelToggle.textContent = panel.classList.contains('collapsed') ? '▶' : '◀';
});

// ─── Animation loop ───
let time = 0;

function animate() {
  requestAnimationFrame(animate);
  time += 0.016;

  if (!animating) controls.update();
  updateCameraAnimation();

  // Animate campus markers (only when visible)
  campusMarkers.forEach((m, i) => {
    if (!m.mesh.visible) return;
    const pulse = Math.sin(time * 2 + i * 0.8) * 0.5 + 0.5;
    (m.beam.material as THREE.MeshBasicMaterial).opacity = 0.2 + pulse * 0.4;
    (m.ring.material as THREE.MeshBasicMaterial).opacity = 0.4 + pulse * 0.3;

    // Highlight selected
    if (selectedCampus && m.campus.name === selectedCampus.name) {
      m.ring.scale.setScalar(1 + pulse * 0.3);
      (m.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + pulse * 0.3;
    } else {
      m.ring.scale.setScalar(1);
      (m.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
    }
  });

  // Rotate point light slowly
  pointLight.position.x = Math.sin(time * 0.3) * 5;
  pointLight.position.z = Math.cos(time * 0.3) * 5;

  renderer.render(scene, camera);
}

// ─── Resize ───
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Load data then start ───
Promise.all([
  loadAllData(),
  loadStadiumModel().catch(err => {
    console.warn('Failed to load stadium STL model, falling back to box:', err);
    return null;
  }),
]).then(([data]) => {
  allData = data;
  renderOverviewPanel(data);
  animate();
}).catch(err => {
  console.error('Failed to load data:', err);
  animate(); // still render scene
});
