# Flownium Development Rules

This document defines project-specific development rules for Flownium Chat.

These rules apply to any contributor working on the codebase.

## 1. General Rules

1. Review this document before modifying code, documentation, or configuration.
2. Work from the current project structure and keep implementation and documentation aligned.
3. Use working branches instead of editing `main` directly.
4. Update relevant comments in the same change when behavior changes.
5. Update related documents in the same task when the change affects APIs, screens, flows, or architecture.

## 2. Architecture Rules

1. The current product supports friend-based chat, direct chat reuse, and group chat creation.
2. Chat creation is limited to users with an accepted friendship state.
3. Direct chat reuses an existing two-member room for the same user pair.
4. Adding more participants creates a new group room instead of converting an existing direct room.
5. REST and Socket APIs use JWT authentication.
6. Online state is derived from the socket presence memory map.
7. External URLs must come from environment variables.

## 3. Database Rules

1. MongoDB models should use `timestamps: true` unless there is a clear reason not to.
2. Legacy schema or index problems must be documented with either migration notes or startup correction logic.
3. User-specific state such as friendship, notifications, and read status should be modeled explicitly instead of being hidden in loosely structured payloads.

## 4. Code Style Rules

1. Prefer `async / await` for asynchronous logic.
2. Core business logic must contain Korean comments.
3. Comments should explain intent, important inputs, outputs, and branching reasons.
4. When the flow is non-trivial, use descriptive comments rather than one-word labels.

## 5. Documentation Synchronization Rules

1. When REST or Socket contracts change, update the related documents in the same task.
2. Review these documents when relevant:
   - `docs/common/api-spec.md`
   - `docs/common/socket-events.md`
   - `docs/common/architecture.md`
   - `docs/common/ui-plan.md`
   - `docs/planning/screen-spec.md`
   - `docs/planning/object-spec.md`
   - `docs/common/wbs.md`
3. If the project direction or milestone status changes, update overview and WBS documents together.
4. If a task changes code, docs, validation status, or release readiness, add or update a task-specific worklog in `.codex/worklogs/` in the same task.

## 6. Encoding Rules

1. Files that contain Korean text must be saved in UTF-8.
2. Do not rely on PowerShell default encoding.
3. After editing Korean text, verify the stored content if there is any doubt.
4. If partial insertion or regex replacement breaks section boundaries, switch to a safer block rewrite or file rewrite.

## 7. Logging and Error Rules

1. Separate client-facing messages from internal logs.
2. Do not expose internal exception details directly to users.
3. Keep API error responses aligned with the standard `error.code` structure when applicable.

## 8. Validation Rules

1. Run validation appropriate to the scope of change.
2. Use `npm run build` as the default frontend validation.
3. Use `node --check` for touched backend entrypoints, routes, or models.
4. Realtime changes should be validated with multi-tab or multi-account flows when possible.
