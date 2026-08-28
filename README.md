# Legal Metrology Compliance System

Foundation for a government Legal Metrology inspector application that supports packaged-commodity compliance inspections.

## Phase 1

Phase 1 provides a modular Express API foundation, environment configuration, MongoDB connection handling, CORS, JSON parsing, centralized error responses, health monitoring, and secure Inspector authentication. OCR, AI analysis, rule evaluation, reports, and analytics remain later phases.

## Prerequisites

- Node.js 18 or newer
- MongoDB 6 or newer, running locally or available through a hosted connection

## Setup

1. Install dependencies:

	```powershell
	npm install
	```

2. Copy `.env.example` to `.env`, set `MONGODB_URI`, and replace `JWT_SECRET` with a long random secret. Keep `.env` out of source control.

3. Start the API:

	```powershell
	npm start
	```

	For development with automatic restarts:

	```powershell
	npm run dev
	```

The API listens on `http://localhost:5000` by default.

The API fails to start when MongoDB cannot be reached so it never presents a false healthy state.

## Health Check

```text
GET /api/health
```

When MongoDB is available, the response is:

```json
{
  "success": true,
  "message": "Legal Metrology Compliance API is running",
  "database": "connected"
}
```


## Inspector Authentication

The Inspector-only authentication API provides:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me (Bearer token required)
```

New registrations remain `PENDING` until department or administrator approval. Only `ACTIVE` inspectors can log in. Approval must be performed through a controlled administrative workflow or a safe development database operation; no public approval endpoint is exposed.

The static frontend pages are available under `frontend/pages/`:

```text
login.html
register.html
officer-dashboard.html
```

## Structure

- `frontend/`: inspector-facing web application
- `backend/`: Express API and future service modules
- `ai-service/`: future OCR and AI assistance services
- `database/`: schema and seed references
- `rules/`: versioned compliance rule definitions
- `docs/`: architecture and operational documentation
