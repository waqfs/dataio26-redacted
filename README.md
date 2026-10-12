# Data I/O 2026 — 3D Campus Energy Visualizer

An interactive 3D exploration of campus energy use, building efficiency, and weather-driven demand across Ohio State's campuses.

## About

This project turns a shared energy dataset into a spatial interface: explore the university, select a campus, inspect individual buildings, and compare their energy profiles. This repository is a portfolio fork of our team's hackathon project.

The main experience lives in `3d/`. A companion chart dashboard lives in `visualizer/`, and the Python analysis and preprocessing pipeline lives in `exploration/`.

## Hackathon Context & Awards

Our team built this project at **Data I/O in February 2026**. Every participating team received a specific shared dataset and was challenged to build a project from it. Our 3D campus energy visualizer won **1st Place in the Advanced Track**.

## Core Features

- Explore an interactive Three.js scene with campus markers, camera transitions, and building-level selection.
- Inspect energy use intensity, metered consumption, floor area, building age, and campus summaries.
- Compare buildings side by side through linked information panels.
- View monthly consumption, weather relationships, efficiency insights, and precomputed forecasts.
- Explore a companion Preact/Chart.js dashboard with utility trends, hourly patterns, and sustainability scores.
- Render the included Ohio Stadium STL model alongside geospatial building data.

## Technical Highlights

- **Spatial data and rendering:** latitude/longitude coordinates are projected into a shared 3D scene, with map tiles positioned on the ground plane and raycasting used for campus and building interactions.
- **Joining heterogeneous datasets:** Python scripts aggregate meter readings and connect them with building metadata and hourly weather records to produce browser-ready JSON.
- **Comparing unlike buildings:** energy use intensity and peer comparisons help contextualize raw consumption alongside building area, age, and usage.
- **Exploratory forecasting:** the analysis code implements trend/seasonal electricity projections and weather-linked gas estimates using NumPy and pandas. The site displays precomputed outputs, not a live forecasting service; results are exploratory hackathon analyses.
- **Static delivery:** committed JSON and STL assets allow the main visualization to run without a backend. Asset paths respect the `/dataio26/` deployment prefix.

## Tech Stack

| Component | Technologies |
| --- | --- |
| 3D explorer | TypeScript, Three.js, OrbitControls, STLLoader, Vite 7 |
| Companion dashboard | Preact, Preact ISO, Chart.js, TypeScript, Vite |
| Analysis | Python, pandas, NumPy, Matplotlib, seaborn |
| Data | Precomputed JSON, building geodata, STL model |
| Campus maps | Committed USGS The National Map snapshots |
| Tooling and hosting | Bun, GitHub Pages |

## Local Setup

Use **Node.js 22.12+ (24 recommended)** and **Bun 1.4.3**.

```bash
git clone https://github.com/waqfs/dataio26-redacted.git
cd dataio26-redacted/3d
bun install --frozen-lockfile
bun run dev
```

Open the Vite address. A WebGL-capable browser is required. The campus background maps are committed under `3d/public/maps`, so the visualization does not contact a map service at runtime.

The map snapshot contains high-resolution, dark-themed WebP images for the zoom level and campus extents requested by the application. To refresh it from the public USGS The National Map service, install Pillow and run `python scripts/snapshot_map_tiles.py` from `3d/`. The source and local styling are recorded in the snapshot manifest, and USGS is attributed in the interface.

### Production build

```bash
cd 3d
bun run build
bunx tsc --noEmit
```

The generated `3d/dist/` directory is ready to serve under `/dataio26/`. To test it locally, run `bunx vite preview` from `3d/` and visit the displayed address with that path.

### Companion chart dashboard

```bash
cd visualizer
bun install --frozen-lockfile
bun run dev
```

This dashboard is separate from the main 3D portfolio deployment. Its build command is `bun run build`.

