# Standard Automation Template Set

## A. Task Definition Template

Task Type:
- feature | bugfix | review | issue-draft | validation | docs-sync | realtime-verify | release-check | delivery | worklog

Goal:
- <what must be achieved>

Success Criteria:
- <how we know the task is done>

Non-Goals:
- <what must not be changed>

Relevant Context:
- <issue, review finding, bug report, feature note, or release request>

Touched Areas:
- <frontend / backend / docs / realtime / deploy>

Likely Files:
- <paths if known>

Required Validation:
- <required checks>

Optional Validation:
- <extra checks if confidence is still low>

Docs To Review:
- <paths or none>

Docs To Update:
- <paths or none>

Delivery Mode:
- local summary | commit-ready | PR-ready | draft only

Stop Conditions:
- unclear requirements
- active prompt does not allow the action
- validation cannot be executed
- implementation behavior is too ambiguous

## B. Permission Scope Template

## Permission Scope

- Code changes are <allowed / not allowed>.
- Documentation changes are <allowed / not allowed>.
- Commits are not allowed unless the user explicitly asks for them.
- Pushes are not allowed unless the user explicitly asks for them.
- PR creation is not allowed unless the user explicitly asks for it.
- GitHub Issue creation is not allowed unless the user explicitly asks for it.
- Merge is never allowed unless the user explicitly asks for it.
- If an action is not explicitly allowed, treat it as disallowed.

## C. Execution Decision Template

Before acting, decide:

1. Is the goal concrete enough to proceed?
2. What is the smallest path that can complete the task?
3. Which files are likely involved?
4. Is documentation sync required?
5. What is the narrowest useful validation?
6. What would make automatic execution unsafe?

If blocked, report:

Blocked by

Why it blocks progress

What exact confirmation or input is needed

## D. Validation Mapping Template

If frontend UI or state changed:
- run `npm run build`

If backend entrypoint, route, model, or socket wiring changed:
- run `node --check server/index.cjs`
- run narrower checks when possible

If realtime flow changed:
- define whether single-tab, multi-tab, or two-account verification is needed

If docs changed:
- verify file references, contract wording, and consistency

Always report:
- executed checks
- not executed but recommended checks
- residual risks

## E. Documentation Mapping Template

If REST contract changed:
- review / update `docs/common/api-spec.md`

If socket events changed:
- review / update `docs/common/socket-events.md`

If architecture or runtime flow changed:
- review / update `docs/common/architecture.md`

If UI behavior or screen flow changed:
- review / update `docs/common/ui-plan.md`
- review / update `docs/planning/screen-spec.md`

If domain object meaning changed:
- review / update `docs/planning/object-spec.md`

If milestone or scope status changed:
- review / update `docs/common/wbs.md`

## F. Realtime Verification Template

Scenario under test:
- <what realtime behavior is being validated>

Test setup:
- single tab | multi tab | two accounts | deployed env | local env

Steps:
1. <step>
2. <step>
3. <step>

Observed behavior:
- <what actually happened>

Expected behavior:
- <what should happen>

Result:
- confirmed | not reproduced | partially verified | blocked

Remaining uncertainty:
- <what still needs stronger validation>

## G. Release Decision Template

Release decision:
- ready | blocked | conditionally ready

Blocking issues:
- <hard blockers>

Non-blocking risks:
- <follow-up items>

Config dependencies:
- <env vars, redirect URIs, external platform assumptions>

Validation status:
- <executed checks and outcomes>

Recommended next action:
- <what should happen next>

## H. Final Delivery Template

Changed files
- <file path>

Summary
- <what changed>
- <why it changed>

Validation
- <command and result>

Known risks
- <remaining risk or follow-up>

Branch / Commit
- Branch: <branch-name or Not created>
- Commit: <sha or Not created>
- Push: <status>

PR / Compare
- <url or Not created>

## I. Worklog Entry Template

Timestamp

Task

Context

Changes

Docs

Validation

Open risks

Next
