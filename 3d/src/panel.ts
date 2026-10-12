// Side panel rendering for 3D visualizer
import type { AllData } from './data';
import type { Campus } from './geodata';

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

const panelBody = document.getElementById('panel-body')!;
const comparePanelBody = document.getElementById('compare-panel-body');
const comparePanel = document.getElementById('compare-panel');

function fmt(n: number, decimals = 0): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(decimals);
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

// ════════════════════════════════════════════
//  Overview Panel (no campus selected)
// ════════════════════════════════════════════
export function renderOverviewPanel(data: AllData) {
  // Aggregate stats
  const totalBuildings = 1287;
  const meteredBuildings = data.euiOverview?.all_buildings?.length ?? 257;
  const monthlyVals = data.monthlyElectricity?.values ?? [];
  const monthlyMonths = data.monthlyElectricity?.months ?? [];
  const monthlyE = monthlyMonths.map((m: string, i: number) => ({ month: m, total: monthlyVals[i] || 0 }));
  const totalElectricity = monthlyVals.reduce((s: number, v: number) => s + v, 0);
  const peakMonth = monthlyE.reduce((max: any, m: any) => (m.total || 0) > (max?.total || 0) ? m : max, monthlyE[0]);

  // Top consumers
  const topBuildings = (data.topBuildings ?? []).slice(0, 8);
  const maxEnergy = topBuildings[0]?.annual_kwh ?? 1;

  // EUI stats
  const eui = data.euiOverview ?? {};
  const medianEUI = eui.stats?.median ?? 304;
  const maxEUI = eui.stats?.max ?? 5234;

  // Sustainability
  const sus = data.sustainability ?? {} as any;
  const categories = sus.categories ?? {};
  const savingsPotential = sus.summary?.potential_savings_kwh ?? sus.total_savings_kwh ?? 4320700;

  // Forecast
  const fc = data.forecast ?? {} as any;
  const fcForecast = fc.forecast ?? {};
  const fcMonths: string[] = fcForecast.months ?? [];
  const fcValues: number[] = fcForecast.values ?? [];
  const peakForecastIdx = fcValues.reduce((maxI: number, v: number, i: number) => v > (fcValues[maxI] || 0) ? i : maxI, 0);
  const peakForecast = fcMonths.length > 0 ? { month: fcMonths[peakForecastIdx], predicted: fcValues[peakForecastIdx] } : null;

  panelBody.innerHTML = `
    <div class="panel-section">
      <h2>University Overview</h2>
      <div class="stat-row">
        <div class="stat-card">
          <div class="label">Total Buildings</div>
          <div class="value">${fmt(totalBuildings)}</div>
        </div>
        <div class="stat-card">
          <div class="label">Metered</div>
          <div class="value blue">${meteredBuildings}</div>
        </div>
      </div>
      <div class="stat-row">
        <div class="stat-card">
          <div class="label">Campuses</div>
          <div class="value">8</div>
        </div>
        <div class="stat-card">
          <div class="label">Total Electricity</div>
          <div class="value amber">${fmt(totalElectricity)} kWh</div>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <h2>Monthly Electricity</h2>
      <div class="mini-bars">
        ${monthlyE.map((m: any) => {
          const w = Math.max(5, ((m.total || 0) / (peakMonth?.total || 1)) * 100);
          return `<div class="mini-bar-row">
            <span class="mini-bar-label">${m.month || ''}</span>
            <div class="mini-bar-track"><div class="mini-bar-fill" style="width:${w}%;background:#bb0000"></div></div>
            <span class="mini-bar-value">${fmt(m.total || 0)}</span>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="panel-section">
      <h2>Top Consumers</h2>
      <div class="mini-bars">
        ${topBuildings.map((b: any) => {
          const w = Math.max(5, ((b.annual_kwh || 0) / maxEnergy) * 100);
          return `<div class="mini-bar-row">
            <span class="mini-bar-label" title="${b.sitename || ''}">${b.sitename || 'Unknown'}</span>
            <div class="mini-bar-track"><div class="mini-bar-fill" style="width:${w}%;background:#ef4444"></div></div>
            <span class="mini-bar-value">${fmt(b.annual_kwh || 0)}</span>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="panel-section">
      <h2>Predictions & Forecasts</h2>
      <div class="prediction-card">
        <div class="pred-title">2026 Peak Forecast</div>
        <div class="pred-value">${peakForecast ? fmt(peakForecast.predicted || 0) + ' kWh' : 'N/A'}</div>
        <div class="pred-detail">${peakForecast?.month || ''} · 95% CI shown in forecast model</div>
      </div>
      <div class="prediction-card">
        <div class="pred-title">Savings Potential</div>
        <div class="pred-value green">${fmt(savingsPotential)} kWh</div>
        <div class="pred-detail">If below-median buildings improve to median EUI</div>
      </div>
      <div class="stat-row">
        <div class="stat-card">
          <div class="label">Median EUI</div>
          <div class="value">${medianEUI.toFixed(0)}</div>
        </div>
        <div class="stat-card">
          <div class="label">Max EUI</div>
          <div class="value red">${maxEUI.toFixed(0)}</div>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <h2>Sustainability Scores</h2>
      <div class="stat-row">
        <div class="stat-card">
          <div class="label">Excellent</div>
          <div class="value green">${categories.excellent ?? 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Good</div>
          <div class="value blue">${categories.good ?? 0}</div>
        </div>
      </div>
      <div class="stat-row">
        <div class="stat-card">
          <div class="label">Needs Work</div>
          <div class="value amber">${categories.needs_improvement ?? 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Poor</div>
          <div class="value red">${categories.poor ?? 0}</div>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <h2>Key Findings</h2>
      <span class="finding-pill">🏢 Only 20% of buildings metered</span>
      <span class="finding-pill">⚡ Top 5 > bottom 200 combined</span>
      <span class="finding-pill">🌡️ Min energy at 58°F</span>
      <span class="finding-pill">🌙 Night = 80% of daytime</span>
      <span class="finding-pill">❄️ Summer peak +36%</span>
      <span class="finding-pill">📈 4,321 MWh savings opportunity</span>
    </div>
  `;
}

// ════════════════════════════════════════════
//  Campus-Specific Panel
// ════════════════════════════════════════════
export function renderCampusPanel(campus: Campus, data: AllData) {
  // Find campus buildings from EUI data
  const campusMatch = (b: any) => (b.campus || '').toLowerCase().includes(campus.name.toLowerCase());
  const euiBuildings = (data.euiOverview?.all_buildings ?? []).filter(campusMatch);
  const topCampusBuildings = (data.topBuildings ?? []).filter(campusMatch)
    .sort((a: any, b: any) => (b.annual_kwh || 0) - (a.annual_kwh || 0)).slice(0, 6);

  // Campus-level energy from age vs efficiency data
  const ageBuildings = (data.ageEfficiency ?? []).filter(campusMatch);

  const avgEUI = euiBuildings.length > 0
    ? euiBuildings.reduce((s: number, b: any) => s + (b.eui || 0), 0) / euiBuildings.length
    : 0;

  const totalElectricity = topCampusBuildings.reduce((s: number, b: any) => s + (b.annual_kwh || 0), 0);

  const oldestBuilding = ageBuildings.reduce((min: any, b: any) =>
    (!min || (b.construction_year || 9999) < (min.construction_year || 9999)) ? b : min
  , null);
  const newestBuilding = ageBuildings.reduce((max: any, b: any) =>
    (!max || (b.construction_year || 0) > (max.construction_year || 0)) ? b : max
  , null);

  // Sustainability for this campus
  const susBuildings = (data.sustainability?.buildings ?? []).filter(campusMatch);
  const avgScore = susBuildings.length > 0
    ? susBuildings.reduce((s: number, b: any) => s + (b.score || 0), 0) / susBuildings.length
    : 0;
  const worstBuildings = susBuildings.sort((a: any, b: any) => (a.score || 100) - (b.score || 100)).slice(0, 5);

  const maxEnergy = topCampusBuildings[0]?.annual_kwh ?? 1;

  panelBody.innerHTML = `
    <button class="back-btn" onclick="window.__deselectCampus()">← Back to Overview</button>

    <div class="panel-section">
      <h2>${campus.name} Campus</h2>
      <div class="stat-row">
        <div class="stat-card">
          <div class="label">Buildings</div>
          <div class="value">${campus.buildings}</div>
        </div>
        <div class="stat-card">
          <div class="label">Metered</div>
          <div class="value blue">${campus.metered}</div>
        </div>
      </div>
      <div class="stat-row">
        <div class="stat-card">
          <div class="label">Avg EUI</div>
          <div class="value ${avgEUI > 500 ? 'red' : avgEUI > 200 ? 'amber' : 'green'}">${avgEUI > 0 ? avgEUI.toFixed(0) : 'N/A'}</div>
        </div>
        <div class="stat-card">
          <div class="label">Total Electricity</div>
          <div class="value">${totalElectricity > 0 ? fmt(totalElectricity) : 'N/A'}</div>
        </div>
      </div>
    </div>

    ${campus.metered === 0 ? `
      <div class="panel-section">
        <div class="prediction-card">
          <div class="pred-title">⚠️ No Meter Data</div>
          <div class="pred-detail">This campus has no smart meters installed. ${campus.buildings} buildings await metering infrastructure for energy monitoring.</div>
        </div>
      </div>
    ` : ''}

    ${topCampusBuildings.length > 0 ? `
    <div class="panel-section">
      <h2>Top Consumers</h2>
      <div class="mini-bars">
        ${topCampusBuildings.map((b: any) => {
          const w = Math.max(5, ((b.annual_kwh || 0) / maxEnergy) * 100);
          return `<div class="mini-bar-row">
            <span class="mini-bar-label" title="${b.sitename || ''}">${b.sitename || 'Unknown'}</span>
            <div class="mini-bar-track"><div class="mini-bar-fill" style="width:${w}%;background:${campus.color}"></div></div>
            <span class="mini-bar-value">${fmt(b.annual_kwh || 0)}</span>
          </div>`;
        }).join('')}
      </div>
    </div>
    ` : ''}

    ${susBuildings.length > 0 ? `
    <div class="panel-section">
      <h2>Sustainability</h2>
      <div class="stat-row">
        <div class="stat-card">
          <div class="label">Avg Score</div>
          <div class="value ${avgScore >= 70 ? 'green' : avgScore >= 40 ? 'amber' : 'red'}">${avgScore.toFixed(0)}/100</div>
        </div>
        <div class="stat-card">
          <div class="label">Assessed</div>
          <div class="value">${susBuildings.length}</div>
        </div>
      </div>
      ${worstBuildings.length > 0 ? `
        <h3>Priority Retrofits</h3>
        <div class="mini-bars">
          ${worstBuildings.map((b: any) => {
            const w = Math.max(5, (b.score || 0));
            const c = (b.score || 0) >= 50 ? '#22c55e' : (b.score || 0) >= 25 ? '#f59e0b' : '#ef4444';
            return `<div class="mini-bar-row">
              <span class="mini-bar-label" title="${b.sitename || ''}">${b.sitename || 'Unknown'}</span>
              <div class="mini-bar-track"><div class="mini-bar-fill" style="width:${w}%;background:${c}"></div></div>
              <span class="mini-bar-value">${(b.score || 0).toFixed(0)}/100</span>
            </div>`;
          }).join('')}
        </div>
      ` : ''}
    </div>
    ` : ''}

    ${ageBuildings.length > 0 ? `
    <div class="panel-section">
      <h2>Building Age</h2>
      <div class="stat-row">
        <div class="stat-card">
          <div class="label">Oldest</div>
          <div class="value">${oldestBuilding?.construction_year ?? 'N/A'}</div>
        </div>
        <div class="stat-card">
          <div class="label">Newest</div>
          <div class="value green">${newestBuilding?.construction_year ?? 'N/A'}</div>
        </div>
      </div>
    </div>
    ` : ''}

  `;
}

// ════════════════════════════════════════════
//  Building-Specific Panel
// ════════════════════════════════════════════
export function renderBuildingPanel(building: BuildingGeo, campus: Campus, data: AllData) {
  // Normalize building name for matching against data sources
  const bNameNorm = (building.name || '').toLowerCase().replace(/\s*\(.*?\)\s*/g, '').replace(/[^a-z0-9]/g, '');

  // Helper to find by sitename match
  const matchName = (entry: any) => {
    const name = (entry.sitename || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return name === bNameNorm;
  };

  // Find energy data for this building from various sources
  const topArr = Array.isArray(data.topBuildings) ? data.topBuildings : [];
  const topEntry = topArr.find(matchName);

  const euiArr = Array.isArray(data.euiOverview?.all_buildings) ? data.euiOverview.all_buildings : [];
  const euiEntry = euiArr.find(matchName);

  const susArr = Array.isArray((data.sustainability as any)?.buildings) ? (data.sustainability as any).buildings : [];
  const susEntry = susArr.find(matchName);

  // buildingEfficiency has least_efficient and most_efficient arrays
  const effObj = data.buildingEfficiency as any;
  const effArr = [
    ...(Array.isArray(effObj?.least_efficient) ? effObj.least_efficient : []),
    ...(Array.isArray(effObj?.most_efficient) ? effObj.most_efficient : []),
  ];
  const effEntry = effArr.find(matchName);

  const electricity = topEntry?.annual_kwh ?? effEntry?.annual_kwh ?? euiEntry?.annual_kwh ?? null;
  const eui = euiEntry?.eui ?? effEntry?.eui ?? topEntry?.eui ?? null;
  const score = susEntry?.score ?? null;
  const grade = susEntry?.grade ?? null;
  const sqft = building.area || euiEntry?.gross_area || susEntry?.sqft || 0;

  // University-wide totals for computing building's share
  const totalUnivKwh = (data.monthlyElectricity?.values ?? []).reduce((s: number, v: number) => s + v, 0);
  const buildingShare = electricity && totalUnivKwh > 0 ? electricity / totalUnivKwh : null;

  // Building-specific monthly data
  const buildingMonthlyArr = Array.isArray(data.buildingMonthly) ? data.buildingMonthly : [];
  const bMonthly = buildingMonthlyArr.find(matchName);
  const actualMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const actualVals: number[] = bMonthly?.monthly_kwh ?? [];
  const forecastVals: number[] = bMonthly?.forecast_kwh ?? [];
  const bMonthsWithData = bMonthly?.months_with_data ?? 0;

  // Sustainability percentile
  const allSus = ((data.sustainability as any)?.buildings ?? []) as any[];
  const allScores = allSus.map((b: any) => b.score).sort((a: number, b: number) => a - b);
  const percentile = score !== null && allScores.length > 0
    ? Math.round((allScores.filter((s: number) => s <= score).length / allScores.length) * 100)
    : null;

  // EUI distribution context
  const allEUI = (data.euiOverview?.all_buildings ?? []) as any[];
  const medianEUI = allEUI.length > 0
    ? (() => { const sorted = allEUI.map((b: any) => b.eui).sort((a: number, b: number) => a - b); return sorted[Math.floor(sorted.length / 2)]; })()
    : 304;

  // Build SVG line chart for projected monthly usage
  // Show actual data for months with data, then forecast for the rest
  const splitIdx = Math.min(bMonthsWithData, 4); // Use 4 months of actual data (Jan–Apr)
  const chartW = 500, chartH = 90, padL = 5, padR = 5, padT = 5, padB = 18;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;
  const maxMonthly = Math.max(...actualVals, ...forecastVals, 1);
  const xStep = plotW / (actualMonths.length - 1);

  const toPoint = (vals: number[], i: number) => {
    const x = padL + i * xStep;
    const y = padT + plotH - (vals[i] / maxMonthly) * plotH;
    return { x, y };
  };

  // Actual line (Jan–Apr solid)
  const actualPoints = actualVals.slice(0, splitIdx).map((_, i) => toPoint(actualVals, i));
  const actualPath = actualPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Trend/projected line (Apr–Dec dashed, starting from last actual point)
  const trendPoints = [];
  for (let i = Math.max(0, splitIdx - 1); i < actualMonths.length; i++) {
    trendPoints.push(toPoint(forecastVals, i));
  }
  const trendPath = trendPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Fill area under projected line
  const trendFill = trendPath + ` L${trendPoints[trendPoints.length - 1].x.toFixed(1)},${(padT + plotH).toFixed(1)} L${trendPoints[0].x.toFixed(1)},${(padT + plotH).toFixed(1)} Z`;

  const monthLabels = actualMonths.map((m: string, i: number) => {
    const x = padL + i * xStep;
    const isFuture = i >= splitIdx;
    return `<text x="${x.toFixed(1)}" y="${chartH}" text-anchor="middle" fill="${isFuture ? '#f97316' : '#777'}" font-size="7" font-weight="${isFuture ? '600' : '400'}">${m}</text>`;
  }).join('');

  // Divider line at split point
  const splitX = padL + (splitIdx - 0.5) * xStep;

  const svgChart = `<svg width="100%" viewBox="0 0 ${chartW} ${chartH}" xmlns="http://www.w3.org/2000/svg">
    <line x1="${splitX.toFixed(1)}" y1="${padT}" x2="${splitX.toFixed(1)}" y2="${padT + plotH}" stroke="rgba(255,255,255,0.15)" stroke-width="1" stroke-dasharray="3,3"/>
    <text x="${(splitX - 2).toFixed(1)}" y="${padT + 8}" text-anchor="end" fill="#666" font-size="6">actual</text>
    <text x="${(splitX + 2).toFixed(1)}" y="${padT + 8}" text-anchor="start" fill="#f97316" font-size="6">projected</text>
    <path d="${trendFill}" fill="rgba(249,115,22,0.08)"/>
    <path d="${actualPath}" fill="none" stroke="rgba(59,130,246,0.9)" stroke-width="2.5"/>
    <path d="${trendPath}" fill="none" stroke="rgba(249,115,22,0.8)" stroke-width="2" stroke-dasharray="5,3"/>
    ${actualPoints.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.5" fill="#3b82f6"/>`).join('')}
    ${monthLabels}
  </svg>`;

  const scoreColor = score !== null
    ? score >= 70 ? 'green' : score >= 40 ? 'amber' : 'red'
    : '';

  // Projected annual change based on building-specific data
  const actualTotal = actualVals.reduce((s: number, v: number) => s + v, 0);
  const forecastTotal = forecastVals.reduce((s: number, v: number) => s + v, 0);
  const projectedChange = actualTotal > 0 ? ((forecastTotal - actualTotal) / actualTotal * 100) : 0;

  // Recommendations based on data
  const recommendations: string[] = [];
  if (eui !== null && eui > medianEUI) recommendations.push(`EUI is ${((eui - medianEUI) / medianEUI * 100).toFixed(0)}% above median — prioritize energy audit`);
  if (eui !== null && eui > 600) recommendations.push('Consider HVAC system upgrade and envelope improvements');
  if (eui !== null && eui < 150) recommendations.push('Excellent efficiency — candidate for case study');
  if (building.year && Number(building.year) < 1970) recommendations.push('Aging infrastructure — evaluate retrofit ROI');
  if (building.year && Number(building.year) > 2010) recommendations.push('Modern construction — verify systems performing to design specs');
  if (score !== null && score < 30) recommendations.push('Critical sustainability risk — immediate action recommended');
  if (projectedChange > 5) recommendations.push(`Projected ${projectedChange.toFixed(1)}% energy increase — investigate demand drivers`);
  if (projectedChange < -5) recommendations.push(`Projected ${Math.abs(projectedChange).toFixed(1)}% energy decrease — trending positive`);

  // Build comparison number line SVGs
  function buildNumberLine(label: string, values: number[], thisVal: number | null, unit: string, colorFn: (v: number) => string): string {
    if (thisVal === null || values.length === 0) return '';
    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const range = max - min || 1;
    const w = 500, h = 40;
    const padL = 30, padR = 30;
    const trackW = w - padL - padR;
    const toX = (v: number) => padL + ((v - min) / range) * trackW;
    const markerX = toX(Math.min(Math.max(thisVal, min), max));
    const medianVal = sorted[Math.floor(sorted.length / 2)];
    const medianX = toX(medianVal);

    // Distribution dots (sample up to 50)
    const step = Math.max(1, Math.floor(sorted.length / 50));
    const dots = sorted.filter((_, i) => i % step === 0).map(v => {
      const x = toX(v);
      return `<circle cx="${x.toFixed(1)}" cy="16" r="2" fill="rgba(255,255,255,0.15)"/>`;
    }).join('');

    return `<div class="number-line-container">
      <div class="number-line-label">${label}</div>
      <svg width="100%" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
        <line x1="${padL}" y1="16" x2="${w - padR}" y2="16" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
        ${dots}
        <line x1="${medianX.toFixed(1)}" y1="8" x2="${medianX.toFixed(1)}" y2="24" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
        <text x="${medianX.toFixed(1)}" y="34" text-anchor="middle" fill="#888" font-size="7">median</text>
        <circle cx="${markerX.toFixed(1)}" cy="16" r="5" fill="${colorFn(thisVal)}" stroke="white" stroke-width="1.5"/>
        <text x="${padL}" y="34" text-anchor="start" fill="#666" font-size="7">${min.toFixed(0)}${unit}</text>
        <text x="${w - padR}" y="34" text-anchor="end" fill="#666" font-size="7">${max.toFixed(0)}${unit}</text>
      </svg>
    </div>`;
  }

  const euiValues = allEUI.map((b: any) => b.eui);
  const kwhValues = allEUI.map((b: any) => b.annual_kwh).filter((v: number) => v > 0);
  const scoreValues = allScores;

  const euiLine = buildNumberLine('EUI (kBtu/ft²)', euiValues, eui, '', v => v < 100 ? '#22c55e' : v < 300 ? '#eab308' : v < 600 ? '#f97316' : '#ef4444');
  const kwhLine = buildNumberLine('Annual kWh', kwhValues, electricity, '', _ => '#3b82f6');
  const scoreLine = buildNumberLine('Sustainability', scoreValues, score, '/100', v => v >= 70 ? '#22c55e' : v >= 40 ? '#eab308' : '#ef4444');

  panelBody.innerHTML = `
    <button class="back-btn" onclick="window.__backToCampus()">← Back to ${campus.name}</button>

    <div class="panel-section">
      <h2>${building.name}</h2>
      <div class="stat-row">
        <div class="stat-card">
          <div class="label">Building #</div>
          <div class="value">${building.number}</div>
        </div>
        <div class="stat-card">
          <div class="label">Campus</div>
          <div class="value">${building.campus}</div>
        </div>
      </div>
      <div class="stat-row">
        <div class="stat-card">
          <div class="label">Gross Area</div>
          <div class="value">${sqft > 0 ? sqft.toLocaleString() + ' ft²' : 'N/A'}</div>
        </div>
        <div class="stat-card">
          <div class="label">Floors</div>
          <div class="value">${building.floorsAbove || 'N/A'}${building.floorsBelow ? ' + ' + building.floorsBelow + ' below' : ''}</div>
        </div>
      </div>
    </div>

    ${electricity !== null ? `
    <div class="panel-section">
      <h2>⚡ Energy Profile</h2>
      <div class="stat-row">
        <div class="stat-card">
          <div class="label">Annual Electricity</div>
          <div class="value amber">${fmt(electricity)} kWh</div>
        </div>
        <div class="stat-card">
          <div class="label">% of University</div>
          <div class="value">${buildingShare ? (buildingShare * 100).toFixed(2) + '%' : 'N/A'}</div>
        </div>
      </div>
      ${eui !== null ? `
      <div class="stat-row">
        <div class="stat-card">
          <div class="label">EUI (kBtu/ft²)</div>
          <div class="value ${eui > 500 ? 'red' : eui > 200 ? 'amber' : 'green'}">${eui.toFixed(0)}</div>
        </div>
        <div class="stat-card">
          <div class="label">vs Median (${medianEUI.toFixed(0)})</div>
          <div class="value ${eui > medianEUI ? 'red' : 'green'}">${eui > medianEUI ? '+' : ''}${((eui - medianEUI) / medianEUI * 100).toFixed(0)}%</div>
        </div>
      </div>
      <div class="eui-gauge">
        <div class="gauge-track">
          <div class="gauge-fill" style="width:${Math.min(100, (eui / 1500) * 100).toFixed(0)}%; background:${eui < 100 ? '#22c55e' : eui < 300 ? '#eab308' : eui < 600 ? '#f97316' : '#ef4444'}"></div>
          <div class="gauge-marker" style="left:${Math.min(100, (medianEUI / 1500) * 100).toFixed(0)}%"></div>
        </div>
        <div class="gauge-labels"><span>0</span><span>Low</span><span>Median</span><span>High</span><span>1500+</span></div>
      </div>
      ` : ''}
    </div>
    ` : `
    <div class="panel-section">
      <div class="prediction-card">
        <div class="pred-title">⚠️ No Metered Data</div>
        <div class="pred-detail">This building does not have metered energy data. Only ${allEUI.length} of the university's ~1300 buildings are metered.</div>
      </div>
    </div>
    `}

    ${bMonthly && forecastVals.length > 0 ? `
    <div class="panel-section">
      <h2>📈 Projected Energy Trend</h2>
      <div class="prediction-card">
        <div class="pred-title">Annual Projection: ${projectedChange >= 0 ? '↑' : '↓'} ${Math.abs(projectedChange).toFixed(1)}%</div>
        <div class="pred-detail">Forecast ${fmt(forecastTotal)} kWh (vs ${fmt(actualTotal)} kWh metered)</div>
      </div>
      <div class="mini-chart-container">
        ${svgChart}
        <div class="mini-chart-legend">
          <span class="legend-dot actual"></span> Actual
          <span class="legend-dot trend"></span> Projected Trend
        </div>
      </div>
    </div>
    ` : ''}

    ${score !== null ? `
    <div class="panel-section">
      <h2>🌿 Sustainability Score</h2>
      <div class="stat-row">
        <div class="stat-card">
          <div class="label">Score</div>
          <div class="value ${scoreColor}">${score}/100</div>
        </div>
        <div class="stat-card">
          <div class="label">Grade</div>
          <div class="value ${scoreColor}">${grade || 'N/A'}</div>
        </div>
      </div>
      <div class="stat-row">
        <div class="stat-card">
          <div class="label">Percentile</div>
          <div class="value">${percentile !== null ? percentile + 'th' : 'N/A'}</div>
        </div>
        <div class="stat-card">
          <div class="label">Outlook</div>
          <div class="value ${score >= 50 ? 'green' : score >= 30 ? 'amber' : 'red'}">${score >= 70 ? 'Strong' : score >= 50 ? 'Moderate' : score >= 30 ? 'At Risk' : 'Critical'}</div>
        </div>
      </div>
    </div>
    ` : ''}

    ${recommendations.length > 0 ? `
    <div class="panel-section">
      <h2>💡 Recommendations</h2>
      <div class="findings-list">
        ${recommendations.map(r => `<div class="finding-pill">${r}</div>`).join('')}
      </div>
    </div>
    ` : ''}

    ${euiLine || kwhLine || scoreLine ? `
    <div class="panel-section">
      <h2>📊 Building Comparison</h2>
      <div class="comparison-info">This building vs all metered buildings</div>
      ${euiLine}
      ${kwhLine}
      ${scoreLine}
    </div>
    ` : ''}

    <div class="panel-section">
      <h2>📍 Details</h2>
      <div class="stat-row">
        <div class="stat-card">
          <div class="label">Built</div>
          <div class="value">${building.year || 'Unknown'}</div>
        </div>
        <div class="stat-card">
          <div class="label">Floor Plate</div>
          <div class="value">${sqft > 0 && building.floorsAbove ? Math.round(sqft / building.floorsAbove).toLocaleString() + ' ft²' : 'N/A'}</div>
        </div>
      </div>
      <div class="stat-row">
        <div class="stat-card">
          <div class="label">Latitude</div>
          <div class="value">${building.lat.toFixed(4)}</div>
        </div>
        <div class="stat-card">
          <div class="label">Longitude</div>
          <div class="value">${building.lng.toFixed(4)}</div>
        </div>
      </div>
    </div>
  `;
}

// Comparison panel: renders the same building info into the side comparison panel
export function renderComparePanel(building: BuildingGeo, campus: Campus, data: AllData) {
  if (!comparePanel || !comparePanelBody) return;
  comparePanel.style.display = 'flex';

  const bNameNorm = (building.name || '').toLowerCase().replace(/\s*\(.*?\)\s*/g, '').replace(/[^a-z0-9]/g, '');
  const matchName = (entry: any) => {
    const name = (entry.sitename || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return name === bNameNorm;
  };

  const euiArr = Array.isArray(data.euiOverview?.all_buildings) ? data.euiOverview.all_buildings : [];
  const euiEntry = euiArr.find(matchName);
  const allSus = ((data.sustainability as any)?.buildings ?? []) as any[];
  const susEntry = allSus.find(matchName);
  const topArr = Array.isArray(data.topBuildings) ? data.topBuildings : [];
  const topEntry = topArr.find(matchName);
  const effObj = data.buildingEfficiency as any;
  const effArr = [
    ...(Array.isArray(effObj?.least_efficient) ? effObj.least_efficient : []),
    ...(Array.isArray(effObj?.most_efficient) ? effObj.most_efficient : []),
  ];
  const effEntry = effArr.find(matchName);

  const electricity = topEntry?.annual_kwh ?? effEntry?.annual_kwh ?? euiEntry?.annual_kwh ?? null;
  const eui = euiEntry?.eui ?? effEntry?.eui ?? topEntry?.eui ?? null;
  const score = susEntry?.score ?? null;
  const grade = susEntry?.grade ?? null;
  const sqft = building.area || euiEntry?.gross_area || susEntry?.sqft || 0;
  const totalUnivKwh = (data.monthlyElectricity?.values ?? []).reduce((s: number, v: number) => s + v, 0);
  const buildingShare = electricity && totalUnivKwh > 0 ? (electricity / totalUnivKwh * 100).toFixed(2) + '%' : 'N/A';

  const scoreColor = score !== null
    ? score >= 70 ? 'green' : score >= 40 ? 'amber' : 'red'
    : '';

  comparePanelBody.innerHTML = `
    <div class="panel-section">
      <h2>${building.name}</h2>
      <div class="stat-row">
        <div class="stat-card"><div class="label">Campus</div><div class="value">${building.campus}</div></div>
        <div class="stat-card"><div class="label">Area</div><div class="value">${sqft > 0 ? sqft.toLocaleString() + ' ft²' : 'N/A'}</div></div>
      </div>
      <div class="stat-row">
        <div class="stat-card"><div class="label">Floors</div><div class="value">${building.floorsAbove || 'N/A'}${building.floorsBelow ? ' + ' + building.floorsBelow + ' below' : ''}</div></div>
        <div class="stat-card"><div class="label">Built</div><div class="value">${building.year || 'Unknown'}</div></div>
      </div>
    </div>

    ${electricity !== null ? `
    <div class="panel-section">
      <h2>⚡ Energy</h2>
      <div class="stat-row">
        <div class="stat-card"><div class="label">Annual kWh</div><div class="value amber">${fmt(electricity)}</div></div>
        <div class="stat-card"><div class="label">% of University</div><div class="value">${buildingShare}</div></div>
      </div>
      ${eui !== null ? `<div class="stat-row"><div class="stat-card"><div class="label">EUI (kBtu/ft²)</div><div class="value ${eui > 500 ? 'red' : eui > 200 ? 'amber' : 'green'}">${eui.toFixed(0)}</div></div></div>` : ''}
    </div>
    ` : `<div class="panel-section"><div class="prediction-card"><div class="pred-title">⚠️ No Metered Data</div></div></div>`}

    ${score !== null ? `
    <div class="panel-section">
      <h2>🌿 Sustainability</h2>
      <div class="stat-row">
        <div class="stat-card"><div class="label">Score</div><div class="value ${scoreColor}">${score}/100</div></div>
        <div class="stat-card"><div class="label">Grade</div><div class="value ${scoreColor}">${grade || 'N/A'}</div></div>
      </div>
    </div>
    ` : ''}
  `;

  // Sync scroll with main panel
  const mainContent = document.querySelector('#panel .panel-content') as HTMLElement;
  const compareContent = document.querySelector('#compare-panel .panel-content') as HTMLElement;
  if (mainContent && compareContent) {
    mainContent.onscroll = () => { compareContent.scrollTop = mainContent.scrollTop; };
    compareContent.onscroll = () => { mainContent.scrollTop = compareContent.scrollTop; };
  }
}

export function closeComparePanel() {
  if (comparePanel) comparePanel.style.display = 'none';
}

document.getElementById('compare-close')?.addEventListener('click', closeComparePanel);
