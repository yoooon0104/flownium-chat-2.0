# Flownium Chat Project Context

This file helps AI agents quickly understand the current repository state before making changes.

## Project Summary

Flownium Chat is a realtime chat service built around Kakao login, friend-based direct chat, group chat, notifications, and unread tracking.

The codebase is beyond the original MVP1 group-chat-only phase.
It now includes most of the first implementation slice of MVP2-B.

## Current Product State

### Already Implemented

- Kakao login and onboarding
- Session restore via `/auth/me`
- Friend search by nickname/email
- Friend request / accept / reject / block backend flow
- Friend-based direct chat creation
- Group chat creation from selected friends
- Notification hub
- Mobile notification screen
- Room participants and online state display
- Room-level unread count
- Message-level unread count display
- Mobile bottom tab bar
- Realtime friendship and notification sync foundation

### In Progress / Needs Real Validation

- Multi-account realtime sync validation
- Exact unread decrease/increase behavior under real use
- Notification flow validation across two real users
- Participant list and online state validation across tabs/devices
- Real-user verification of direct room reuse and group invite behavior

### Not Implemented Yet

- Anonymous chat
- Leave room
- Member removal/admin policy
- Account deletion
- Dedicated settings screen
- Profile image editing/upload

## Current UX Model

### Desktop

- Left panel: profile, actions, Friends/Rooms tabs, lists
- Right panel: chat detail or empty state
- Notification dropdown

### Mobile / Tablet

- Bottom tab bar: Friends / Rooms / Notifications / Settings
- Notification screen is separate from the main list
- Chat detail hides the bottom tab bar

## Core Product Rules

1. Chat creation is limited to accepted friends.
2. A direct chat reuses an existing two-member room if one already exists.
3. Adding more people creates a new group room instead of mutating an existing direct room.
4. Korean comments are required in core business logic.
5. Project documents must be updated when contracts, screens, or architecture change.

## Repository Shape

- `src/`
  - frontend app
- `server/`
  - Express + Socket.IO backend
- `docs/common/`
  - stable project documents
- `docs/planning/`
  - requirements, screen spec, object spec
- `docs/operations/`
  - deploy and validation documents
- `.codex/`
  - AI-facing context and prompts

## Important Working Rules

- Read `docs/development-rules.md` before editing.
- Follow branch and PR workflow from `CONTRIBUTING.md`.
- Do not assume a change is applied until file content or command output confirms it.
- Prefer small, focused branches.
- Keep Korean text files in UTF-8.
- Share PR information only after commit and push are complete.

## Current Branch Policy

- Use focused `feat/*`, `fix/*`, or `docs/*` branches
- Avoid direct work on `main`
- Keep one primary purpose per branch
- Merge only after PR or explicit confirmation

## Known Fragile Areas

- Realtime sync still needs two-account validation for full confidence
- Unread decrease timing needs real-user verification
- Presence is memory-based and may diverge across restarts or multi-instance deployments
- Kakao OAuth remains sensitive to exact redirect URI matching

## Key Documents For Navigation

- `AGENTS.md`
- `CONTRIBUTING.md`
- `docs/development-rules.md`
- `docs/common/architecture.md`
- `docs/common/project-overview.md`
- `docs/common/wbs.md`
- `docs/common/api-spec.md`
- `docs/common/socket-events.md`
- `docs/planning/requirements.md`
- `docs/planning/screen-spec.md`
- `docs/planning/object-spec.md`
- `docs/operations/realtime-validation-checklist.md`

## Deployment Context

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

The project supports both local and deployed execution, but newer realtime flows still need real-account validation.
