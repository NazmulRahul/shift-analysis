# Project Handoff: Employee Shift Analytics Platform

This document provides a comprehensive overview of the implementation progress, database architecture, service layouts, recent fixes, and instructions to help a new AI model resume work on this repository immediately with full context.

---

## 1. Project Overview & Objectives
The goal of this project is to build a full-stack Employee Shift Analytics Platform that allows plant operations teams to:
* Ingest shift CSV logs.
* Dynamically clean data, resolving negative durations, duplicate rows, and timestamp overlaps.
* View shift activity timelines, category distributions, heatmaps, and efficiency trends.
* Classify breakdown streak lengths and severity.
* Read automated, rule-based recommendations.

---

## 2. Technical Stack
* **Frontend**: React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + Recharts (visualizations) + Axios (API client) + TanStack Query v5 (state management).
* **Backend**: Django 5.2 + Django REST Framework 3.15 + Pandas/NumPy (data validation and aggregation).
* **Database**: PostgreSQL (Dockerized Production) / SQLite (Local Development default).
* **Containerization**: Docker Compose orchestrating PostgreSQL, Django backend, and React served by Nginx.

---

## 3. Project Structure

### Backend Layout (`backend/`)
* [settings.py](file:///c:/Users/Farhana/Music/shift-analysis/backend/config/settings.py): Integrates database fallback (uses SQLite locally, defaults to Postgres when environment vars are provided).
* [models.py](file:///c:/Users/Farhana/Music/shift-analysis/backend/apps/analytics/models.py): Defines DB schemas for `ShiftRecord` and `DataQualityIssue`.
* [urls.py](file:///c:/Users/Farhana/Music/shift-analysis/backend/apps/analytics/urls.py) & [views.py](file:///c:/Users/Farhana/Music/shift-analysis/backend/apps/analytics/views.py): Configures REST endpoints and query parsers (dates, duration limits, weekdays, hours, months, and data validity).
* **Services** (`backend/apps/analytics/services/`):
  * [cleaner.py](file:///c:/Users/Farhana/Music/shift-analysis/backend/apps/analytics/services/cleaner.py): The ETL processor checking for missing critical info, timestamp inversions, duplicate rows, and overlap conflicts.
  * [efficiency_service.py](file:///c:/Users/Farhana/Music/shift-analysis/backend/apps/analytics/services/efficiency_service.py): Calculates overall efficiency scores and groups chronological trends daily, weekly, or monthly.
  * [streak_service.py](file:///c:/Users/Farhana/Music/shift-analysis/backend/apps/analytics/services/streak_service.py): Identifies consecutive breakdown days and tags severity (Low, Medium, High).
  * [insight_service.py](file:///c:/Users/Farhana/Music/shift-analysis/backend/apps/analytics/services/insight_service.py): Evaluates metrics to create rule-based plant suggestions.

### Frontend Layout (`frontend/`)
* [client.ts](file:///c:/Users/Farhana/Music/shift-analysis/frontend/src/api/client.ts): Axial API integration with custom serialization.
* [App.tsx](file:///c:/Users/Farhana/Music/shift-analysis/frontend/src/App.tsx): Router definitions, theme wrappers, and global sidebar layout.
* **Pages** (`frontend/src/pages/`):
  * [Dashboard.tsx](file:///c:/Users/Farhana/Music/shift-analysis/frontend/src/pages/Dashboard.tsx): KPI metrics grids, charts, filters, and insight alerts.
  * [Upload.tsx](file:///c:/Users/Farhana/Music/shift-analysis/frontend/src/pages/Upload.tsx): Dropzone for CSV ingestion with confirmation prompts.
  * [BreakdownStreaks.tsx](file:///c:/Users/Farhana/Music/shift-analysis/frontend/src/pages/BreakdownStreaks.tsx): Streak tables with badges and timelines.
  * [DataQuality.tsx](file:///c:/Users/Farhana/Music/shift-analysis/frontend/src/pages/DataQuality.tsx): Issue logs with status lists and fix recommendations.
* **Charts** (`frontend/src/components/charts/`):
  * Recharts components for timelines, donut distributions, area trends, frequency bars, and category/date heatmaps.

---

## 4. Key Improvements & Bug Fixes Done So Far

### 1. NameError in Efficiency Trends
* **Issue**: The pandas-based grouping logic inside `calculate_efficiency_trends` in [efficiency_service.py](file:///c:/Users/Farhana/Music/shift-analysis/backend/apps/analytics/services/efficiency_service.py) did not initialize the `trend_data = []` list, causing a crash when appending entries.
* **Fix**: Initialized `trend_data = []` before the pandas loop, restoring functionality.

### 2. Case-Insensitive Uptime Scoring Mismatches
* **Issue**: DB aggregates for overall efficiency were using case-sensitive lookups (`__in`), resulting in 0 downtime calculation if the uploaded database entries were stored capitalized (e.g. "Breakdown" vs lowercase list "breakdown"). This created a mismatch against in-memory pandas trend metrics.
* **Fix**: Rewrote the filter to utilize Django `Q` objects combining `__iexact` query expressions.

### 3. Dynamic Column Parsing (for `shift_data.csv`)
* **Issue**: The dataset file `shift_data.csv` uses column headers `DAY_DATE`, `START`, and `END`, which were not in the processor's column mapping array.
* **Fix**: Added support for standard column variants in [cleaner.py](file:///c:/Users/Farhana/Music/shift-analysis/backend/apps/analytics/services/cleaner.py):
  - `'date'`: `['date', 'day_date', 'day date', 'shift_date', 'shift date']`
  - `'start_time'`: `['shift start date/time', 'start' ...]`
  - `'end_time'`: `['shift end date/time', 'end' ...]`
* **Result**: Tested the upload of `shift_data.csv` using `curl.exe`. It processed all 50 rows (32 valid, 18 invalid, 29 logged issues) and updated the dashboard visualizations.

---

## 5. Verification Commands
To keep validating code changes, use the following local commands:

### Backend Testing
Run unit and integration tests covering cleaning ETLs, models, streaks, efficiency, and views:
```bash
cd backend
.venv\Scripts\activate
python manage.py test
```

### Frontend Verification
Compile Vite and TypeScript configurations to verify build integrity:
```bash
cd frontend
npm run build
```

---

## 6. Future Roadmap & Development Ideas
If extending the repository, consider working on:
1. **Docker PostgreSQL Connectivity Troubleshooting**: On some client environments, port `5432` might be bound by local SQL services. Document alternative port configurations or switch Compose environment files for those cases.
2. **Additional Custom Streak Metrics**: Enable custom thresholds in the frontend streaks view (e.g. letting plant managers customize minimum streak dates or total duration thresholds via sliders).
3. **Database Caching**: Implement Redis or Django cache framework if processing files with more than 100k rows.
