# Vercel frontend deployment

CAPACITY CONNECT is a React frontend with a separate FastAPI and MongoDB backend.
Deploy the frontend to Vercel and set its API URL to the public HTTPS address of
the separately deployed backend.

## Vercel project settings

The repository-root `vercel.json` configures these values automatically:

- Install command: `yarn --cwd frontend install --frozen-lockfile`
- Build command: `yarn --cwd frontend build`
- Output directory: `frontend/build`
- Node.js version: `20`

Do not configure a Vercel Root Directory when using this repository configuration.

## Required Vercel environment variable

Add this variable for Production, Preview, and Development as appropriate:

| Name | Value |
| --- | --- |
| `REACT_APP_BACKEND_URL` | `https://your-public-fastapi-domain.example` |

Use the backend origin only, without `/api` or a trailing slash. The React app
adds `/api` itself.

## Backend requirements

Deploy the FastAPI service to a public HTTPS host and configure its environment:

| Name | Value |
| --- | --- |
| `MONGO_URL` | Your MongoDB connection URL |
| `DB_NAME` | Your MongoDB database name |
| `JWT_SECRET` | A strong, private signing secret |
| `CORS_ORIGINS` | `https://your-vercel-project.vercel.app` |
| `EMERGENT_LLM_KEY` | Required only for AI learning paths and quiz generation |

After assigning a custom Vercel domain, append it to `CORS_ORIGINS` as a
comma-separated origin. Do not include path segments or a trailing slash.

## Validation checklist

1. Confirm the Vercel build uses Yarn and completes without lockfile changes.
2. Open `/login`, sign in, and confirm the correct role dashboard opens.
3. Open a direct route such as `/dashboard` or `/admin/gap-dashboard` in a new
   browser tab; the SPA rewrite should load the app instead of a Vercel 404.
4. Confirm the browser network panel shows requests to your public FastAPI
   origin, including `/api/auth/login` and `/api/analytics/employee-dashboard`.