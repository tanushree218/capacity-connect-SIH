# Vercel Deployment Plan

## Goal

Prepare the website for a reliable Vercel deployment, identify the source of the
reported npm error, and preserve all live dashboard functionality.

## Proposed outcome

- Deploy the React website to Vercel as the public frontend.
- Resolve build, dependency, and configuration issues that prevent Vercel from
  completing an npm/yarn install or production build.
- Configure the deployed website to call a publicly reachable API rather than a
  development-only address.
- Keep the existing role-based Admin, Trainer, and Employee experiences intact.

## Important deployment decision

The application includes a separate FastAPI and MongoDB service. Vercel can host
the frontend, but the backend must remain available through a separate public
backend deployment or be adapted into Vercel serverless functions. The default
proposal is to deploy only the frontend on Vercel and keep the existing FastAPI
backend hosted separately, then connect them through a production API URL.

## Work included after approval

- Inspect the reported npm/Vercel build failure and correct the specific source
  of the failure.
- Review frontend scripts, dependency lockfiles, Vercel configuration, and
  production environment-variable usage.
- Add only the deployment configuration needed for Vercel to build and serve the
  frontend correctly.
- Validate that direct page visits and application navigation work in production.
- Check that API requests use the configured production backend URL.
- Produce concise Vercel setup values and deployment steps for the project.

## Assumptions

- Vercel will host the React frontend.
- The FastAPI/MongoDB backend will be deployed separately and supplied as a
  public HTTPS API URL.
- The existing visual design and functionality should not be redesigned as part
  of this deployment-focused work.

## Decisions worth changing

- If a single-provider deployment is required, the backend can instead be
  adapted for Vercel serverless hosting. This would be a broader architecture
  change and may affect MongoDB connectivity and runtime behavior.
- If the npm error points to a preferred package manager, the deployment can be
  standardized on that tool rather than the current project convention.