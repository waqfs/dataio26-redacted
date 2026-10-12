import { ChartComponent } from '../components/Chart';
import { useData } from '../hooks/useData';
import { useState } from 'preact/hooks';

const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  accent: '#f59e0b',
  danger: '#ef4444',
  success: '#10b981',
  muted: '#6b7280',
};

const CAMPUS_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
];

// 1. Buildings per Campus
export function BuildingsPerCampus() {
  const { data, loading } = useData<Array<{ campus: string; count: number }>>('/data/01_buildings_per_campus.json');
  if (loading || !data) return <div class="chart-loading">Loading...</div>;

  return (
    <ChartComponent
      type="bar"
      height={350}
      data={{
        labels: data.map(d => d.campus),
        datasets: [{
          label: 'Buildings',
          data: data.map(d => d.count),
          backgroundColor: CAMPUS_COLORS.slice(0, data.length),
          borderRadius: 4,
        }],
      }}
      options={{
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: { x: { title: { display: true, text: 'Number of Buildings' } } },
      }}
    />
  );
}

// 2. Utility Breakdown (Jan) - excluding infrastructure
export function UtilityBreakdown() {
  const { data, loading } = useData<any>('/data/01_utility_breakdown.json');
  if (loading || !data) return <div class="chart-loading">Loading...</div>;

  const items = data.without_infrastructure
    .filter((d: any) => d.total > 0 && !['OIL28SEC', 'STEAMRATE', 'COOLING_POWER'].includes(d.utility));

  const utilColors: Record<string, string> = {
    ELECTRICITY: '#f59e0b',
    GAS: '#ef4444',
    STEAM: '#6b7280',
    COOLING: '#3b82f6',
    HEAT: '#ef4444',
  };

  return (
    <ChartComponent
      type="bar"
      height={300}
      data={{
        labels: items.map((d: any) => `${d.utility} (${d.readingunits})`),
        datasets: [{
          label: 'Total (Jan 2025)',
          data: items.map((d: any) => d.total),
          backgroundColor: items.map((d: any) => utilColors[d.utility] || '#6b7280'),
          borderRadius: 4,
        }],
      }}
      options={{
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => `${ctx.parsed.y.toLocaleString()} ${items[ctx.dataIndex].readingunits}`,
            },
          },
        },
        scales: {
          y: { type: 'logarithmic', title: { display: true, text: 'Energy (log scale)' } },
          x: { ticks: { maxRotation: 0 } },
        },
      }}
    />
  );
}

// 3. Weather Overview
export function WeatherOverview() {
  const { data, loading } = useData<any[]>('/data/01_weather_overview.json');
  if (loading || !data) return <div class="chart-loading">Loading...</div>;

  // Downsample to weekly averages for smoother display
  const weekly: any[] = [];
  for (let i = 0; i < data.length; i += 7) {
    const chunk = data.slice(i, i + 7);
    weekly.push({
      date: chunk[0].date_only,
      avg_temp: chunk.reduce((s: number, d: any) => s + d.avg_temp, 0) / chunk.length,
      avg_humidity: chunk.reduce((s: number, d: any) => s + d.avg_humidity, 0) / chunk.length,
      avg_wind: chunk.reduce((s: number, d: any) => s + d.avg_wind, 0) / chunk.length,
    });
  }

  return (
    <ChartComponent
      type="line"
      height={350}
      data={{
        labels: weekly.map(d => d.date),
        datasets: [
          {
            label: 'Temperature (°F)',
            data: weekly.map(d => d.avg_temp.toFixed(1)),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y',
          },
          {
            label: 'Humidity (%)',
            data: weekly.map(d => d.avg_humidity.toFixed(1)),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y1',
          },
          {
            label: 'Wind Speed (mph)',
            data: weekly.map(d => d.avg_wind.toFixed(1)),
            borderColor: '#10b981',
            tension: 0.4,
            yAxisID: 'y2',
          },
        ],
      }}
      options={{
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { ticks: { maxTicksLimit: 12 } },
          y: { position: 'left', title: { display: true, text: '°F' } },
          y1: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: '%' } },
          y2: { display: false },
        },
      }}
    />
  );
}

// 4. Monthly by Utility
export function MonthlyByUtility() {
  const { data, loading } = useData<any>('/data/02_monthly_by_utility.json');
  if (loading || !data) return <div class="chart-loading">Loading...</div>;

  const utilColors: Record<string, string> = {
    ELECTRICITY: '#f59e0b',
    GAS: '#ef4444',
    STEAM: '#6b7280',
    COOLING: '#3b82f6',
    HEAT: '#ec4899',
  };

  const utils = ['ELECTRICITY', 'GAS', 'STEAM', 'HEAT'].filter(u => data[u]);

  return (
    <div class="chart-grid-2x2">
      {utils.map((util: string) => {
        const d = data[util];
        return (
          <div class="mini-chart" key={util}>
            <h4>{util} ({d.units})</h4>
            <ChartComponent
              type="line"
              height={200}
              data={{
                labels: d.months,
                datasets: [{
                  label: util,
                  data: d.values,
                  borderColor: utilColors[util] || '#6b7280',
                  backgroundColor: (utilColors[util] || '#6b7280') + '20',
                  fill: true,
                  tension: 0.3,
                  pointRadius: 4,
                }],
              }}
              options={{
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    ticks: {
                      callback: (v: number) => v >= 1e9 ? `${(v / 1e9).toFixed(1)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : v.toLocaleString(),
                    },
                  },
                },
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// 5. Monthly Electricity
export function MonthlyElectricity() {
  const { data, loading } = useData<any>('/data/02_monthly_electricity.json');
  if (loading || !data) return <div class="chart-loading">Loading...</div>;

  const maxVal = Math.max(...data.values);
  const colors = data.values.map((v: number) => {
    const intensity = v / maxVal;
    return `rgba(59, 130, 246, ${0.4 + intensity * 0.6})`;
  });

  return (
    <ChartComponent
      type="bar"
      height={300}
      data={{
        labels: data.months,
        datasets: [{
          label: 'Electricity (kWh)',
          data: data.values,
          backgroundColor: colors,
          borderRadius: 4,
        }],
      }}
      options={{
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => `${(ctx.parsed.y / 1e6).toFixed(1)}M kWh`,
            },
          },
        },
        scales: {
          y: {
            title: { display: true, text: 'kWh' },
            ticks: { callback: (v: number) => `${(v / 1e6).toFixed(0)}M` },
          },
        },
      }}
    />
  );
}

// 6. Temperature vs Energy Timeline (with utility selector)
export function TempElectricityTimeline() {
  const { data, loading } = useData<any[]>('/data/03_temp_electricity_timeline.json');
  const [selectedUtility, setSelectedUtility] = useState('electricity');
  if (loading || !data) return <div class="chart-loading">Loading...</div>;

  const utilities = ['electricity', 'gas', 'steam', 'cooling', 'heat'];
  const utilLabels: Record<string, string> = {
    electricity: 'Electricity (kWh)', gas: 'Gas (kWh)', steam: 'Steam (kg)',
    cooling: 'Cooling (kWh)', heat: 'Heat (kWh)',
  };
  const utilColors: Record<string, string> = {
    electricity: '#3b82f6', gas: '#ef4444', steam: '#6b7280',
    cooling: '#06b6d4', heat: '#ec4899',
  };

  // Downsample to weekly for performance
  const weekly: any[] = [];
  for (let i = 0; i < data.length; i += 7) {
    const chunk = data.slice(i, i + 7);
    weekly.push({
      date: chunk[0].date,
      avg_temp: chunk.reduce((s: number, d: any) => s + d.avg_temp, 0) / chunk.length,
      value: chunk.reduce((s: number, d: any) => s + (d[selectedUtility] || 0), 0) / chunk.length,
    });
  }

  return (
    <div>
      <div class="chart-filters">
        <label>Utility:</label>
        {utilities.map(u => (
          <button
            key={u}
            class={`filter-btn ${selectedUtility === u ? 'active' : ''}`}
            style={selectedUtility === u ? { backgroundColor: utilColors[u], borderColor: utilColors[u] } : {}}
            onClick={() => setSelectedUtility(u)}
          >{u.charAt(0).toUpperCase() + u.slice(1)}</button>
        ))}
      </div>
      <ChartComponent
        type="line"
        height={350}
        data={{
          labels: weekly.map(d => d.date),
          datasets: [
            {
              label: 'Temperature (°F)',
              data: weekly.map(d => d.avg_temp.toFixed(1)),
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239,68,68,0.1)',
              fill: true,
              tension: 0.4,
              yAxisID: 'y',
            },
            {
              label: utilLabels[selectedUtility],
              data: weekly.map(d => d.value),
              borderColor: utilColors[selectedUtility],
              backgroundColor: utilColors[selectedUtility] + '20',
              fill: true,
              tension: 0.4,
              yAxisID: 'y1',
            },
          ],
        }}
        options={{
          interaction: { mode: 'index', intersect: false },
          plugins: { legend: { position: 'top' } },
          scales: {
            x: { ticks: { maxTicksLimit: 12 } },
            y: { position: 'left', title: { display: true, text: 'Temperature (°F)' }, grid: { color: 'rgba(239,68,68,0.1)' } },
            y1: {
              position: 'right',
              title: { display: true, text: utilLabels[selectedUtility] },
              grid: { drawOnChartArea: false },
              ticks: { callback: (v: number) => v >= 1e9 ? `${(v / 1e9).toFixed(1)}B` : `${(v / 1e6).toFixed(0)}M` },
            },
          },
        }}
      />
    </div>
  );
}

// 7. Age vs Efficiency (with campus filter)
export function AgeVsEfficiency() {
  const { data, loading } = useData<any[]>('/data/04_age_vs_efficiency.json');
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
  if (loading || !data) return <div class="chart-loading">Loading...</div>;

  const valid = data.filter(d => d.eui > 0 && d.construction_year > 1850);
  const campuses = [...new Set(valid.map(d => d.campus).filter(Boolean))] as string[];
  const campusColorMap: Record<string, string> = {};
  campuses.forEach((c, i) => { campusColorMap[c] = CAMPUS_COLORS[i % CAMPUS_COLORS.length]; });

  const filtered = selectedCampus === 'all' ? valid : valid.filter(d => d.campus === selectedCampus);
  const displayCampuses = selectedCampus === 'all' ? campuses : [selectedCampus];

  return (
    <div>
      <div class="chart-filters">
        <label>Campus:</label>
        <button class={`filter-btn ${selectedCampus === 'all' ? 'active' : ''}`} onClick={() => setSelectedCampus('all')}>All</button>
        {campuses.map(c => (
          <button
            key={c}
            class={`filter-btn ${selectedCampus === c ? 'active' : ''}`}
            onClick={() => setSelectedCampus(c)}
          >{c}</button>
        ))}
      </div>
      <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 0.5rem' }}>Showing {filtered.length} buildings</p>
      <ChartComponent
        type="scatter"
        height={350}
        data={{
          datasets: displayCampuses.map(campus => ({
            label: campus,
            data: filtered.filter(d => d.campus === campus).map(d => ({
              x: d.construction_year,
              y: d.eui,
            })),
            backgroundColor: campusColorMap[campus] + '80',
            borderColor: campusColorMap[campus],
            pointRadius: 5,
          })),
        }}
        options={{
          plugins: { legend: { position: 'top' }, tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const campusData = filtered.filter(d => d.campus === ctx.dataset.label);
                const point = campusData[ctx.dataIndex];
                return point ? `${point.sitename}: EUI ${point.eui} (${point.construction_year})` : '';
              },
            },
          }},
          scales: {
            x: { title: { display: true, text: 'Construction Year' } },
            y: {
              title: { display: true, text: 'EUI (kWh/sqft)' },
              type: 'logarithmic',
            },
          },
        }}
      />
    </div>
  );
}

// 8. Campus Comparison
export function CampusComparison() {
  const { data, loading } = useData<any[]>('/data/04_campus_comparison.json');
  if (loading || !data) return <div class="chart-loading">Loading...</div>;

  const metered = data.filter(d => d.total_kwh > 0);

  return (
    <div>
      <ChartComponent
        type="bar"
        height={300}
        data={{
          labels: data.map(d => d.campusname),
          datasets: [
            {
              label: 'Total Buildings',
              data: data.map(d => d.total_buildings),
              backgroundColor: '#3b82f680',
              borderColor: '#3b82f6',
              borderWidth: 1,
              borderRadius: 4,
            },
            {
              label: 'Metered Buildings',
              data: data.map(d => d.num_metered_buildings),
              backgroundColor: '#10b98180',
              borderColor: '#10b981',
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        }}
        options={{
          plugins: { legend: { position: 'top' } },
          scales: { x: { ticks: { maxRotation: 45 } } },
        }}
      />
      {metered.length > 0 && (
        <div class="campus-stats">
          <h4>Energy Data (Metered Campuses)</h4>
          <table>
            <thead>
              <tr><th>Campus</th><th>Buildings</th><th>Total kWh</th><th>Avg EUI</th></tr>
            </thead>
            <tbody>
              {metered.map(d => (
                <tr key={d.campusname}>
                  <td>{d.campusname}</td>
                  <td>{d.num_metered_buildings}</td>
                  <td>{(d.total_kwh / 1e9).toFixed(2)}B</td>
                  <td>{d.avg_eui.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// 9. Top Buildings (with search)
export function TopBuildings() {
  const { data, loading } = useData<any[]>('/data/04_top_buildings.json');
  const [search, setSearch] = useState('');
  const [count, setCount] = useState(25);
  if (loading || !data) return <div class="chart-loading">Loading...</div>;

  const filtered = search
    ? data.filter(d => d.sitename.toLowerCase().includes(search.toLowerCase()))
    : data.slice(0, count);

  return (
    <div>
      <div class="chart-filters">
        <input
          type="text"
          class="filter-input"
          placeholder="Search buildings..."
          value={search}
          onInput={(e: any) => setSearch(e.target.value)}
        />
        {!search && (
          <>
            <label>Show:</label>
            {[10, 25].map(n => (
              <button key={n} class={`filter-btn ${count === n ? 'active' : ''}`} onClick={() => setCount(n)}>{n}</button>
            ))}
          </>
        )}
      </div>
      <ChartComponent
        type="bar"
        height={Math.max(300, filtered.length * 22)}
        data={{
          labels: filtered.map(d => d.sitename.length > 30 ? d.sitename.slice(0, 28) + '...' : d.sitename),
          datasets: [{
            label: 'Annual Electricity (kWh)',
            data: filtered.map(d => d.annual_kwh),
            backgroundColor: filtered.map((_, i) => {
              const intensity = 1 - (i / Math.max(filtered.length, 1)) * 0.6;
              return `rgba(239, 68, 68, ${intensity})`;
            }),
            borderRadius: 4,
          }],
        }}
        options={{
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx: any) => {
                  const d = filtered[ctx.dataIndex];
                  return `${(d.annual_kwh / 1e6).toFixed(1)}M kWh | EUI: ${d.eui} | ${d.campus || 'N/A'}`;
                },
              },
            },
          },
          scales: {
            x: {
              title: { display: true, text: 'Annual Electricity (kWh)' },
              ticks: { callback: (v: number) => `${(v / 1e6).toFixed(0)}M` },
            },
          },
        }}
      />
    </div>
  );
}

// 10. Building Efficiency (Best & Worst)
export function BuildingEfficiency() {
  const { data, loading } = useData<any>('/data/04_building_efficiency.json');
  if (loading || !data) return <div class="chart-loading">Loading...</div>;

  const worst = data.least_efficient.slice(0, 15);
  const best = data.most_efficient.slice(0, 15);

  return (
    <div class="efficiency-grid">
      <div>
        <h4 style={{ color: '#ef4444' }}>Least Efficient (Highest EUI)</h4>
        <ChartComponent
          type="bar"
          height={350}
          data={{
            labels: worst.map((d: any) => d.sitename.length > 25 ? d.sitename.slice(0, 23) + '...' : d.sitename),
            datasets: [{
              label: 'EUI (kWh/sqft)',
              data: worst.map((d: any) => d.eui),
              backgroundColor: '#ef444480',
              borderColor: '#ef4444',
              borderWidth: 1,
              borderRadius: 4,
            }],
          }}
          options={{
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: { x: { title: { display: true, text: 'EUI (kWh/sqft)' } } },
          }}
        />
      </div>
      <div>
        <h4 style={{ color: '#10b981' }}>Most Efficient (Lowest EUI)</h4>
        <ChartComponent
          type="bar"
          height={350}
          data={{
            labels: best.map((d: any) => d.sitename.length > 25 ? d.sitename.slice(0, 23) + '...' : d.sitename),
            datasets: [{
              label: 'EUI (kWh/sqft)',
              data: best.map((d: any) => d.eui),
              backgroundColor: '#10b98180',
              borderColor: '#10b981',
              borderWidth: 1,
              borderRadius: 4,
            }],
          }}
          options={{
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: { x: { title: { display: true, text: 'EUI (kWh/sqft)' } } },
          }}
        />
      </div>
      <p class="total-analyzed">Total buildings analyzed: {data.total_buildings_analyzed}</p>
    </div>
  );
}

// 11. Day-of-Week × Hour Heatmap (implemented as a grid of colored cells)
export function DowHourHeatmap() {
  const { data, loading } = useData<any>('/data/05_dow_hour_heatmap.json');
  if (loading || !data) return <div class="chart-loading">Loading...</div>;

  const allVals = data.values.flat();
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const range = maxVal - minVal;

  const getColor = (val: number) => {
    const norm = (val - minVal) / range;
    // Blue to yellow to red
    const r = Math.round(norm < 0.5 ? norm * 2 * 255 : 255);
    const g = Math.round(norm < 0.5 ? norm * 2 * 200 : (1 - (norm - 0.5) * 2) * 200);
    const b = Math.round(norm < 0.5 ? 255 * (1 - norm * 2) : 0);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div class="heatmap-container">
      <div class="heatmap-grid">
        <div class="heatmap-corner"></div>
        {data.hours.map((h: number) => (
          <div class="heatmap-hour-label" key={h}>{h}</div>
        ))}
        {data.days.map((day: string, di: number) => (
          <>
            <div class="heatmap-day-label" key={`day-${di}`}>{day}</div>
            {data.values[di].map((val: number, hi: number) => (
              <div
                key={`${di}-${hi}`}
                class="heatmap-cell"
                style={{ backgroundColor: getColor(val) }}
                title={`${day} ${hi}:00 — ${val.toFixed(1)} kWh avg`}
              />
            ))}
          </>
        ))}
      </div>
      <div class="heatmap-legend">
        <span>{minVal.toFixed(1)} kWh</span>
        <div class="heatmap-gradient" />
        <span>{maxVal.toFixed(1)} kWh</span>
      </div>
    </div>
  );
}

// 12. EUI Distribution (with campus filter)
export function EUIOverview() {
  const { data, loading } = useData<any>('/data/06_eui_overview.json');
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
  if (loading || !data) return <div class="chart-loading">Loading...</div>;

  const allBuildings = data.all_buildings;
  const campuses = [...new Set(allBuildings.map((b: any) => b.campus).filter(Boolean))] as string[];
  const buildings = selectedCampus === 'all' ? allBuildings : allBuildings.filter((b: any) => b.campus === selectedCampus);

  // Create histogram buckets
  const euis = buildings.map((b: any) => b.eui).filter((e: number) => e > 0);
  const bucketSize = 100;
  const maxBucket = Math.min(Math.ceil(Math.max(...euis) / bucketSize) * bucketSize, 3000);
  const buckets: number[] = [];
  const labels: string[] = [];
  for (let i = 0; i < maxBucket; i += bucketSize) {
    const count = euis.filter((e: number) => e >= i && e < i + bucketSize).length;
    buckets.push(count);
    labels.push(`${i}-${i + bucketSize}`);
  }
  const overflow = euis.filter((e: number) => e >= maxBucket).length;
  if (overflow > 0) {
    buckets.push(overflow);
    labels.push(`${maxBucket}+`);
  }

  // Compute stats for current selection
  const sortedEui = [...euis].sort((a, b) => a - b);
  const mean = euis.reduce((s: number, v: number) => s + v, 0) / euis.length;
  const median = sortedEui[Math.floor(sortedEui.length / 2)] || 0;

  return (
    <div>
      <div class="chart-filters">
        <label>Campus:</label>
        <button class={`filter-btn ${selectedCampus === 'all' ? 'active' : ''}`} onClick={() => setSelectedCampus('all')}>All ({allBuildings.length})</button>
        {campuses.map(c => {
          const cnt = allBuildings.filter((b: any) => b.campus === c).length;
          return (
            <button key={c} class={`filter-btn ${selectedCampus === c ? 'active' : ''}`} onClick={() => setSelectedCampus(c)}>
              {c} ({cnt})
            </button>
          );
        })}
      </div>
      <ChartComponent
        type="bar"
        height={300}
        data={{
          labels,
          datasets: [{
            label: 'Number of Buildings',
            data: buckets,
            backgroundColor: '#3b82f680',
            borderColor: '#3b82f6',
            borderWidth: 1,
          }],
        }}
        options={{
          plugins: { legend: { display: false } },
          scales: {
            x: { title: { display: true, text: 'EUI Range (kWh/sqft)' }, ticks: { maxRotation: 45, autoSkip: true, maxTicksLimit: 15 } },
            y: { title: { display: true, text: 'Buildings' } },
          },
        }}
      />
      <div class="eui-stats">
        <div class="stat"><span class="stat-label">Buildings</span><span class="stat-value">{euis.length}</span></div>
        <div class="stat"><span class="stat-label">Median EUI</span><span class="stat-value">{median.toFixed(1)}</span></div>
        <div class="stat"><span class="stat-label">Mean EUI</span><span class="stat-value">{mean.toFixed(1)}</span></div>
      </div>
    </div>
  );
}

// Weekday vs Weekend pattern
export function WeekdayWeekend() {
  const { data, loading } = useData<any>('/data/05_weekday_weekend.json');
  if (loading || !data) return <div class="chart-loading">Loading...</div>;

  return (
    <ChartComponent
      type="line"
      height={300}
      data={{
        labels: data.hours.map((h: number) => `${h}:00`),
        datasets: [
          {
            label: 'Weekday',
            data: data.weekday,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.1)',
            fill: true,
            tension: 0.3,
          },
          {
            label: 'Weekend',
            data: data.weekend,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245,158,11,0.1)',
            fill: true,
            tension: 0.3,
          },
        ],
      }}
      options={{
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { title: { display: true, text: 'Hour of Day' }, ticks: { maxTicksLimit: 12 } },
          y: { title: { display: true, text: 'Avg Reading (kWh)' } },
        },
      }}
    />
  );
}

// ===== PREDICTIVE MODEL CHARTS =====

// Electricity Forecast with confidence interval
export function ElectricityForecast() {
  const { data, loading } = useData<any>('/data/pred_monthly_forecast.json');
  if (loading || !data) return <div class="chart-loading">Loading...</div>;

  const allMonths = [...data.actual.months, ...data.forecast.months];
  const actualData = [...data.actual.values, ...Array(6).fill(null)];
  const trendData = [...data.trend.values, ...Array(6).fill(null)];
  const forecastData = [...Array(12).fill(null), ...data.forecast.values];
  const upperData = [...Array(12).fill(null), ...data.forecast.upper];
  const lowerData = [...Array(12).fill(null), ...data.forecast.lower];

  return (
    <ChartComponent
      type="line"
      height={300}
      data={{
        labels: allMonths,
        datasets: [
          {
            label: 'Actual',
            data: actualData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
          },
          {
            label: 'Trend',
            data: trendData,
            borderColor: '#6b728080',
            borderDash: [5, 5],
            pointRadius: 0,
            tension: 0.3,
          },
          {
            label: 'Forecast',
            data: forecastData,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245,158,11,0.15)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            borderDash: [3, 3],
          },
          {
            label: '95% CI Upper',
            data: upperData,
            borderColor: 'rgba(245,158,11,0.3)',
            backgroundColor: 'rgba(245,158,11,0.05)',
            fill: '+1',
            pointRadius: 0,
            borderDash: [2, 2],
          },
          {
            label: '95% CI Lower',
            data: lowerData,
            borderColor: 'rgba(245,158,11,0.3)',
            pointRadius: 0,
            borderDash: [2, 2],
          },
        ],
      }}
      options={{
        plugins: { legend: { position: 'top' } },
        scales: {
          y: {
            title: { display: true, text: 'Electricity (kWh)' },
            ticks: { callback: (v: number) => v >= 1e9 ? `${(v / 1e9).toFixed(1)}B` : `${(v / 1e6).toFixed(0)}M` },
          },
        },
      }}
    />
  );
}

// Temperature-Energy Prediction Curve
export function TempEnergyCurve() {
  const { data, loading } = useData<any>('/data/pred_temp_energy_curve.json');
  if (loading || !data) return <div class="chart-loading">Loading...</div>;

  // Downsample curve for chart (every 5th point)
  const curvePoints = data.curve.temperatures
    .filter((_: number, i: number) => i % 5 === 0)
    .map((t: number, i: number) => ({ x: t, y: data.curve.predicted_energy[i * 5] }));

  const actualPoints = data.actual_points.map((p: any) => ({
    x: p.temp,
    y: p.energy,
  }));

  return (
    <div>
      <ChartComponent
        type="scatter"
        height={300}
        data={{
          datasets: [
            {
              label: 'Prediction Curve',
              data: curvePoints,
              showLine: true,
              borderColor: '#ef4444',
              backgroundColor: 'transparent',
              pointRadius: 0,
              borderWidth: 2,
              tension: 0.4,
            },
            {
              label: 'Monthly Actuals',
              data: actualPoints,
              backgroundColor: '#3b82f680',
              borderColor: '#3b82f6',
              pointRadius: 7,
            },
          ],
        }}
        options={{
          plugins: {
            legend: { position: 'top' },
            tooltip: {
              callbacks: {
                label: (ctx: any) => {
                  if (ctx.datasetIndex === 1) {
                    const p = data.actual_points[ctx.dataIndex];
                    return `${p.month}: ${p.temp.toFixed(0)}°F → ${(p.energy / 1e6).toFixed(0)}M kWh`;
                  }
                  return `${ctx.parsed.x}°F → ${(ctx.parsed.y / 1e6).toFixed(0)}M kWh`;
                },
              },
            },
          },
          scales: {
            x: { title: { display: true, text: 'Temperature (°F)' } },
            y: {
              title: { display: true, text: 'Electricity (kWh)' },
              ticks: { callback: (v: number) => `${(v / 1e6).toFixed(0)}M` },
            },
          },
        }}
      />
      <div class="eui-stats">
        <div class="stat"><span class="stat-label">Optimal Temp</span><span class="stat-value">{data.optimal_temperature}°F</span></div>
        <div class="stat"><span class="stat-label">R²</span><span class="stat-value">{data.r_squared}</span></div>
        <div class="stat"><span class="stat-label">Heating Penalty</span><span class="stat-value">+{data.insights.heating_penalty_pct}%</span></div>
        <div class="stat"><span class="stat-label">Cooling Penalty</span><span class="stat-value">+{data.insights.cooling_penalty_pct}%</span></div>
      </div>
    </div>
  );
}

// Gas Forecast with HDD model
export function GasForecast() {
  const { data, loading } = useData<any>('/data/pred_gas_forecast.json');
  if (loading || !data) return <div class="chart-loading">Loading...</div>;

  const allMonths = [...data.actual.months, ...data.forecast.months];
  const actualData = [...data.actual.values, ...Array(6).fill(null)];
  const predictedData = [...data.predicted.values, ...data.forecast.values];

  return (
    <div>
      <ChartComponent
        type="line"
        height={250}
        data={{
          labels: allMonths,
          datasets: [
            {
              label: 'Actual Gas',
              data: actualData,
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239,68,68,0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 4,
            },
            {
              label: 'HDD Model Prediction',
              data: predictedData,
              borderColor: '#f59e0b',
              borderDash: [5, 5],
              tension: 0.3,
              pointRadius: 3,
            },
          ],
        }}
        options={{
          plugins: { legend: { position: 'top' } },
          scales: {
            y: {
              title: { display: true, text: 'Gas (kWh)' },
              ticks: { callback: (v: number) => v >= 1e9 ? `${(v / 1e9).toFixed(1)}B` : `${(v / 1e6).toFixed(0)}M` },
            },
          },
        }}
      />
      <div class="eui-stats" style={{ marginTop: '0.5rem' }}>
        <div class="stat"><span class="stat-label">Model R²</span><span class="stat-value">{data.hdd_model.r_squared}</span></div>
        <div class="stat"><span class="stat-label">Method</span><span class="stat-value">HDD Linear</span></div>
      </div>
    </div>
  );
}

// Sustainability Scores Overview
export function SustainabilityScores() {
  const { data, loading } = useData<any>('/data/pred_sustainability_scores.json');
  const [sortBy, setSortBy] = useState<'score' | 'eui'>('score');
  if (loading || !data) return <div class="chart-loading">Loading...</div>;

  const cats = data.categories;
  const sorted = [...data.buildings].sort((a: any, b: any) =>
    sortBy === 'score' ? a.score - b.score : b.eui - a.eui
  );
  const worst20 = sorted.slice(0, 20);

  const gradeColors: Record<string, string> = {
    'A+': '#10b981', 'A': '#34d399', 'B': '#3b82f6',
    'C': '#f59e0b', 'D': '#ef4444', 'F': '#991b1b', 'F-': '#450a0a',
  };

  return (
    <div>
      <div class="chart-grid-2x2">
        <div class="mini-chart">
          <h4>Score Distribution</h4>
          <ChartComponent
            type="doughnut"
            height={200}
            data={{
              labels: ['Excellent (A/A+)', 'Good (B)', 'Needs Work (C)', 'Poor (D/F)'],
              datasets: [{
                data: [cats.excellent, cats.good, cats.needs_improvement, cats.poor],
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
              }],
            }}
            options={{ plugins: { legend: { position: 'right' } } }}
          />
        </div>
        <div class="mini-chart">
          <h4>Priority Retrofits (Worst 20)</h4>
          <div class="chart-filters" style={{ marginBottom: '0.3rem' }}>
            <label>Sort:</label>
            <button class={`filter-btn ${sortBy === 'score' ? 'active' : ''}`} onClick={() => setSortBy('score')}>By Score</button>
            <button class={`filter-btn ${sortBy === 'eui' ? 'active' : ''}`} onClick={() => setSortBy('eui')}>By EUI</button>
          </div>
          <ChartComponent
            type="bar"
            height={300}
            data={{
              labels: worst20.map((b: any) => b.sitename.length > 20 ? b.sitename.slice(0, 18) + '...' : b.sitename),
              datasets: [{
                label: 'EUI (kWh/sqft)',
                data: worst20.map((b: any) => b.eui),
                backgroundColor: worst20.map((b: any) => (gradeColors[b.grade] || '#6b7280') + '80'),
                borderColor: worst20.map((b: any) => gradeColors[b.grade] || '#6b7280'),
                borderWidth: 1,
                borderRadius: 3,
              }],
            }}
            options={{
              indexAxis: 'y',
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (ctx: any) => {
                      const b = worst20[ctx.dataIndex];
                      return `${b.sitename}: EUI ${b.eui} | Grade ${b.grade} | ${(b.annual_kwh / 1e6).toFixed(1)}M kWh/yr`;
                    },
                  },
                },
              },
              scales: { x: { title: { display: true, text: 'EUI (kWh/sqft)' } } },
            }}
          />
        </div>
      </div>
      <div class="eui-stats">
        <div class="stat"><span class="stat-label">Buildings</span><span class="stat-value">{data.summary.total_buildings}</span></div>
        <div class="stat"><span class="stat-label">Avg Score</span><span class="stat-value">{data.summary.avg_score}/100</span></div>
        <div class="stat"><span class="stat-label">Savings Potential</span><span class="stat-value">{data.summary.potential_savings_mwh.toLocaleString()} MWh</span></div>
      </div>
    </div>
  );
}
