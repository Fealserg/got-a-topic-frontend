# Repository Guidelines

## Product and scope

«Есть тема» — conference networking by interests. Tagline: «Есть что обсудить. Осталось найти с кем.». User interface and product documentation are Russian. This repository owns the Next.js frontend; FastAPI is a separate repository and the sole owner of business rules.

## Structure

`app/page.tsx`: landing, profiles, matching and meetings. `app/api/[...path]/route.ts`: transport-only HTTP proxy. `components/form-feedback.tsx`: validation and unsaved-change handling. `components/ui/`: local shadcn-style components. `docs/specification.md`: UI requirements. `docs/ux-interfeys.md`: chosen UX guidelines. `e2e/`: browser scenarios. `tests/`: proxy regressions.

## Commands

Node.js 22 LTS. `npm ci`; `API_BASE_URL=http://localhost:8000 npm run dev`; `npm test`; `npm run typecheck`; `npm run build`; `npm run test:e2e` with running services and Playwright browsers installed. See README for setup.

## Architecture and platform

Use standalone Next.js, not static export. Browser requests are relative `/api/*`; runtime backend origin is server-only `process.env['API_BASE_URL']`. Bracket access avoids RelaxDev build substitution. Validate configuration, never take backend URLs from user input. Proxy forwards session cookies and preserves status codes, without meeting logic.

## Changes and checks

TypeScript strict, descriptive names, accessible labels, 44px targets, visible focus, field errors on blur and protection for unsaved profiles. Preserve input on API/network failures. Update API usage against `docs/openapi.json`, never invent a contract. Add focused regressions for changed behavior; run tests, typecheck and build. State browser/deployment checks that could not run.

Never commit .env, sessions or real participant data. Do not overwrite existing user changes. Commit subjects: concise imperative, e.g. `Handle unavailable backend`. PRs explain behavior, validation, linked requirement and screenshots for visible changes.
