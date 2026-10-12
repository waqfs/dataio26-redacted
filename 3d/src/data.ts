// Data loading utilities for 3D visualizer

export interface BuildingData {
  name: string;
  campus: string;
  eui: number;
  electricity: number;
  area: number;
  year: number;
}

export interface MonthlyData {
  month: string;
  total: number;
}

export interface PredictionData {
  forecast: any;
  sustainability: any;
  tempCurve: any;
  gasForecast: any;
}

export interface CampusEnergy {
  campus: string;
  total_buildings: number;
  metered_buildings: number;
  avg_electricity: number;
}

// Cache fetched data
const cache = new Map<string, any>();

async function fetchJSON(path: string) {
  if (cache.has(path)) return cache.get(path);
  const res = await fetch(path);
  const data = await res.json();
  cache.set(path, data);
  return data;
}

export async function loadAllData() {
  const [
_____
  ] = await Promise.all();

  return {
  };
}

export type AllData = Awaited<ReturnType<typeof loadAllData>>;
