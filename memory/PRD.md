# CAPACITY CONNECT — Product Requirements Document

## Product overview

CAPACITY CONNECT is a centralized workforce capability-building system for the
Ministry of Earth Sciences (MoES), created for SIH26075. It helps employees,
trainers, and administrators identify competency gaps, manage learning, and
measure capability improvement.

## Users

- **Employees** view assigned learning, competency gaps, recommendations, and
  certificates.
- **Trainers** create and manage courses and learning content.
- **Administrators** manage employees, learning assignments, competency gaps,
  and organization-wide analytics.

## Core requirements

1. Secure role-based access for Admin, Trainer, and Employee users.
2. Employee and learning management with courses, assignments, progress, and
   certificates.
3. Competency profiles and gap analytics that identify learning priorities.
4. Personalized recommendations and AI-generated learning paths.
5. A responsive MoES-themed React interface backed by FastAPI and MongoDB.

## Architecture

- **Frontend:** React Create React App with CRACO, React Router, Tailwind, and
  Shadcn UI components under `/app/frontend`.
- **Backend:** FastAPI with Motor MongoDB access, JWT role protection, and API
  routes under `/api` in `/app/backend/server.py`.
- **Database:** MongoDB using `MONGO_URL` and `DB_NAME` environment variables.
- **AI:** Emergent LLM integration for learning paths and generated quizzes.
- **Deployment:** Vercel serves the static React frontend; the FastAPI and
  MongoDB service must be hosted separately at a public HTTPS origin.

## Implemented

### Foundation

- Role-based Admin, Trainer, and Employee dashboards.
- MoES visual system, responsive navigation, courses, enrollment, progress,
  competency profiles, gap analytics, notifications, and certificates.
- Seeded demo accounts recorded in `/app/memory/test_credentials.md`.

### P0 completion — 2026-09-13

- Added `GET /api/analytics/employee-dashboard` for authenticated employees.
  It returns dashboard statistics, enriched enrollments, certificates,
  competency data, and recommendations.
- Updated the employee dashboard to use that single API contract, show a clear
  load error state, and expose unique critical test IDs.
- Corrected duplicate employee quick-sign-in test IDs and removed the frontend
  production build warning.
- Added Vercel configuration in `/app/vercel.json`, Node 20 pinning in
  `/.nvmrc`, API base validation, SPA route rewrites, and deployment guidance
  in `/app/DEPLOYMENT.md`.
- Improved backend enrollment, assignment, and competency-gap queries to avoid
  deployment-blocking N+1 lookup patterns.

## Verification

- `yarn build` in `/app/frontend` completes successfully with no warnings.
- Employee dashboard API, competency gaps, and no-op course assignment pass
  live API smoke tests.
- Automated verification: 8 backend tests passed; employee/admin/trainer
  routing, direct dashboard visits, and a 375px mobile layout passed.
- Deployment readiness scan passed with no blockers.

## Prioritized roadmap

### P1

- Verify the AI recommendation engine against representative competency gaps.
- Add trainer PDF upload and AI-generated MCQ quizzes.
- Split the large backend route file into focused routers and services.

### P2

- Add in-app or email notifications for course assignments and deadlines.
- Add pagination and deeper analytics for larger employee populations.