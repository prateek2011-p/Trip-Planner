# FairTrip Web Planner

FairTrip Web Planner is a full-stack JavaScript version of the deterministic group-trip planner.

It uses:

- Node.js backend with built-in `http`
- HTML, CSS, and browser JavaScript frontend
- Shared planner engine in plain JavaScript
- Node's built-in test runner
- Friendly form-based input for travellers, activities, and trip events
- Detailed itinerary cards with activity names, costs, time, energy, satisfaction, and plain-English reasoning

No external packages are required.

## Run

```bash
npm start
```

On Windows PowerShell, if `npm` is blocked by script policy, use either:

```powershell
npm.cmd start
```

or:

```powershell
node server.js
```

Open:

```text
http://localhost:3000
```

The UI lets users add travellers, activities, and events without writing JSON, then shows a detailed itinerary with plain-English reasoning.

## Test

```bash
npm test
```

On Windows PowerShell:

```powershell
npm.cmd test
```

or:

```powershell
node --test tests\*.test.js
```

## API

Health:

```text
GET /api/health
```

Sample data:

```text
GET /api/sample
```

Generate plan:

```text
POST /api/plan
Content-Type: application/json
```

Request body shape:

```json
{
  "days": 2,
  "hoursPerDay": 8,
  "travellers": [],
  "activities": [],
  "events": []
}
```

## Why This Is Good For An SDE Project

This project shows both product and engineering skills:

- Algorithm design with deterministic tie-breaking
- Backend API design
- Frontend form design and itinerary visualization
- Test coverage for planner behavior
- Clean separation between domain logic and HTTP/UI code

Resume line:

```text
Built a full-stack JavaScript trip-planning app with a deterministic optimization engine, event-driven replanning, a Node.js API, and an interactive HTML/CSS/JS frontend.
```
