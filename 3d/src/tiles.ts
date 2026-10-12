// OpenStreetMap tile loading for 3D ground plane
import * as THREE from 'three';
import { geoTo3D, OHIO_BOUNDS } from './geodata';

const textureLoader = new THREE.TextureLoader();

// Convert lat/lng to tile x/y at a given zoom level
function latLngToTile(lat: number, lng: number, zoom: number): [number, number] {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return [x, y];
}

// Convert tile x/y back to lat/lng bounds
function tileToBounds(x: number, y: number, zoom: number): { n: number; s: number; w: number; e: number } {
  const n = Math.pow(2, zoom);
  const w = (x / n) * 360 - 180;
  const e = ((x + 1) / n) * 360 - 180;
  const nLat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
  const sLat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n))) * 180) / Math.PI;
  return { n: nLat, s: sLat, w, e };
}

// OSM tile URL
function tileUrl(x: number, y: number, zoom: number): string {
  // Use CartoDB dark tiles for dark theme
  return `https://a.basemaps.cartocdn.com/dark_all/${zoom}/${x}/${y}.png`;
}

let currentTiles: THREE.Group | null = null;

// Load map tiles around a center lat/lng
export function loadMapTiles(
  scene: THREE.Scene,
  centerLat: number,
  centerLng: number,
  scale: number = 10,
  zoom: number = 16,
  radius: number = 3 // tiles in each direction
): THREE.Group {
  // Remove previous tiles
  if (currentTiles) {
    scene.remove(currentTiles);
    currentTiles.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (obj.material instanceof THREE.Material) obj.material.dispose();
      }
    });
  }

  const group = new THREE.Group();
  const [cx, cy] = latLngToTile(centerLat, centerLng, zoom);

  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      const tx = cx + dx;
      const ty = cy + dy;
      const bounds = tileToBounds(tx, ty, zoom);

      // Convert tile corners to 3D space
      const [x1, z1] = geoTo3D(bounds.n, bounds.w, scale);
      const [x2, z2] = geoTo3D(bounds.s, bounds.e, scale);

      const width = Math.abs(x2 - x1);
      const depth = Math.abs(z2 - z1);
      const centerX = (x1 + x2) / 2;
      const centerZ = (z1 + z2) / 2;

      const geo = new THREE.PlaneGeometry(width, depth);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x808080,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 1;
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(centerX, 0.43, centerZ);
      mesh.raycast = () => {}; // tiles should not intercept raycaster clicks
      group.add(mesh);

      // Load texture asynchronously
      const url = tileUrl(tx, ty, zoom);
      textureLoader.load(
        url,
        (texture) => {
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          mat.map = texture;
          mat.needsUpdate = true;
        },
        undefined,
        (err) => {
          console.warn(`Tile load failed: ${url}`, err);
        }
      );
    }
  }

  scene.add(group);
  currentTiles = group;
  return group;
}

// Remove tiles from scene
export function clearMapTiles(scene: THREE.Scene) {
  if (currentTiles) {
    scene.remove(currentTiles);
    currentTiles.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (obj.material instanceof THREE.Material) obj.material.dispose();
      }
    });
    currentTiles = null;
  }
}
