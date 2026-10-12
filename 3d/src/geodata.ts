// OSU Campus locations and Ohio state outline for 3D visualization
// Coordinates are [longitude, latitude] in degrees

export interface Campus {
  name: string;
  lat: number;
  lng: number;
  buildings: number;
  metered: number;
  color: string;
}

// Campus data from dataset analysis
export const CAMPUSES: Campus[] = [
  { name: 'Columbus',       lat: 40.0028, lng: -83.0149, buildings: 485, metered: 220, color: '#bb0000' },
  { name: 'Medical Center', lat: 39.9943, lng: -83.0179, buildings: 51,  metered: 40,  color: '#ef4444' },
  { name: 'Wooster',        lat: 40.7839, lng: -81.9295, buildings: 254, metered: 0,   color: '#f59e0b' },
  { name: 'Lima',           lat: 40.7396, lng: -84.1052, buildings: 18,  metered: 0,   color: '#22c55e' },
  { name: 'Mansfield',      lat: 40.7989, lng: -82.5154, buildings: 24,  metered: 0,   color: '#3b82f6' },
  { name: 'Marion',         lat: 40.5832, lng: -83.1270, buildings: 21,  metered: 0,   color: '#8b5cf6' },
  { name: 'Newark',         lat: 40.0760, lng: -82.4013, buildings: 25,  metered: 0,   color: '#ec4899' },
  { name: 'Satellite Locations', lat: 40.35, lng: -83.75, buildings: 331, metered: 0, color: '#6b7280' },
];

// Ohio state bounding box (from actual GeoJSON data)
export const OHIO_BOUNDS = {
  minLat: 38.42,
  maxLat: 41.98,
  minLng: -84.82,
  maxLng: -80.52,
};

// Convert lat/lng to local 3D coords (centered on Ohio)
export function geoTo3D(lat: number, lng: number, scale = 10): [number, number] {
  const centerLat = (OHIO_BOUNDS.minLat + OHIO_BOUNDS.maxLat) / 2;
  const centerLng = (OHIO_BOUNDS.minLng + OHIO_BOUNDS.maxLng) / 2;
  const x = (lng - centerLng) * scale;
  const z = -(lat - centerLat) * scale; // negative because Z goes "into" screen
  return [x, z];
}

// Official Ohio state outline from US States GeoJSON (46 points)
export const OHIO_OUTLINE: [number, number][] = [
  [-80.518598, 41.978802],
  [-80.518598, 40.636951],
  [-80.666475, 40.582182],
  [-80.595275, 40.472643],
  [-80.600752, 40.319289],
  [-80.737675, 40.078303],
  [-80.830783, 39.711348],
  [-81.219646, 39.388209],
  [-81.345616, 39.344393],
  [-81.455155, 39.410117],
  [-81.57017, 39.267716],
  [-81.685186, 39.273193],
  [-81.811156, 39.0815],
  [-81.783771, 38.966484],
  [-81.887833, 38.873376],
  [-82.03571, 39.026731],
  [-82.221926, 38.785745],
  [-82.172634, 38.632391],
  [-82.293127, 38.577622],
  [-82.331465, 38.446175],
  [-82.594358, 38.424267],
  [-82.731282, 38.561191],
  [-82.846298, 38.588575],
  [-82.890113, 38.758361],
  [-83.032514, 38.725499],
  [-83.142052, 38.626914],
  [-83.519961, 38.703591],
  [-83.678792, 38.632391],
  [-83.903347, 38.769315],
  [-84.215533, 38.807653],
  [-84.231963, 38.895284],
  [-84.43461, 39.103408],
  [-84.817996, 39.103408],
  [-84.801565, 40.500028],
  [-84.807042, 41.694001],
  [-83.454238, 41.732339],
  [-83.065375, 41.595416],
  [-82.933929, 41.513262],
  [-82.835344, 41.589939],
  [-82.616266, 41.431108],
  [-82.479343, 41.381815],
  [-82.013803, 41.513262],
  [-81.739956, 41.485877],
  [-81.444201, 41.672093],
  [-81.011523, 41.852832],
  [-80.518598, 41.978802],
];
