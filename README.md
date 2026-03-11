# Fastbreak Event Dashboard

Built as part of the Fastbreak engineering interview exercise.

Live Url: [https://fastbreak-dashboard-psi.vercel.app]
Repo: [https://github.com/Jpease1020/fastbreak-dashboard]

## Overview

Small event management app built for the Fastbreak coding exercise.

The goal of the exercise was to make a few clean architectural decisions appropriate for a small application. I structred the app keeping data access on the server, enforcing ownership close to the the database, and avoid adding unneccessary infrastructure that a project of this size doesn't need.

Users can:
- sign up/log in (email or Google)
- create, edit, and delete events
- attach multiple venues to an event
- search and filter events from the dashboard

## Tech Stack
- Next.js 16 (App Router)
- TypeScript
- Supabase (DB and Auth)
- Tailwind, shadcn/ui
- React Hook Form 
- Zod validation
- Vitest, Playwright

## Architecture

The app follows a simple flow: UI -> Server Actions -> Supabase

The client is responsible for UI state and interaction. The server is responsible for validation authorization, and persistence.

The dashboard shows all events from all users, but edit and delete buttons only appear on events the user owns. The edit page also checks ownership server-side. Navigating to someone else's event URL returns a 404. There are two layers, the UI hides controls you can't use, and the server rejects mutations you're not authorized for.

### Key choices:

- Server Actions instead of API routes
All mutations (auth + event CRUD) run through Server Actions. This keeps mutation logic on the server without building a separate API layer.

- Supabase access stays server-side
Client components never directly talk to the database. This keeps auth checks and persistence logic centralized.

- Consistent action pattern
All actions use a small safeAction() wrapper that standardizes error handling and return types.

- Filtering happens in the database
Search and sport filters live in the URL and trigger a server-side query rather than filtering in client state.

- Validation
Zod validation runs both client-side (UX) and server-side (actual trust boundary).

- URL-driven filtering
Search/filter state lives in the URL so it survives refresh and stays shareable.


## Data Model

Two main tables:

events
- id
- user_id
- name
- sport_type
- date_time
- description

event_venues
- id
- event_id
- name
- address

Venues are modeled separately so events can support a dynamic list of locations.

## Trade-offs

- Venue updates
One thing requiring consideration was how to handle multiple venues during edits. Instead of diffing rows, I chose to delete existing venues and reinsert the new set. For this scale of application that keeps the logic simpler and avoids partial update edge cases.

- Shared dashboard vs. per-user view 
I chose to show all events to all users (the challenge says "display list of all sports events") but scope mutation controls to the owner. This means the dashboard works as a read-only feed for discovery, while edit/delete are gated at both the UI level (buttons hidden) and the server level (atomic user_id check in the WHERE clause). If per-user scoping were needed, it's a one-line change to add .eq("user_id", user.id) to the getEvents query.

## What I Would Improve Next

If this were moving beyond a coding exercise I would:
- add a real Supabase integration test environment
- document and harden row-level security policies
- add better server-side logging for failed mutations
- extract domain logic into a service layer if the app grew

For this challenge I focused on keeping the architecture simple and predictable rather than over-engineering it.

## Run Locally:
Install dependencies and run the dev server:
- Create .env.local:
- npm install
- npm run dev

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

## Tests:
npm run test
npm run test:e2e
