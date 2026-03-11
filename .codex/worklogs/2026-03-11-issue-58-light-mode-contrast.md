# 2026-03-11 issue-58-light-mode-contrast

## Timestamp
- 2026-03-11 17:05

## Task ID / Branch
- issue: #58
- branch: `codex/light-mode-cta-contrast`

## Task
- fixed light-mode contrast for CTA buttons in the friends header and chat participants menu

## Context
- the `+` action in the friends list and the invite action in the participants menu were hard to see in light mode
- the current implementation used `bg-[var(--cta-bg)]` while `--cta-bg` is a gradient token, so the background could fall back poorly

## Changes
- added a shared `.cta-button` rule in `src/App.css`
- moved the participants invite button and the floating create-room button to the shared CTA style
- kept the small friends-header `+` button lighter and more icon-like by using stronger foreground contrast instead of a full CTA treatment
- moved the participants invite button in `ParticipantsMenu.jsx` to the shared CTA class
- split the participants menu actions into `Invite | Cancel` on the first row and a separate destructive `Leave` button on the next row
- toned down the online status styling in the participants list to a quieter dot + pill treatment that matches the brand better
- pushed the offline state further into the background so online/offline is easier to distinguish without increasing saturation

## Docs
- None

## Validation
- executed: `npm run build`
- follow-up: visually confirm light/dark mode contrast on the friends screen and participants menu in the browser

## Open risks
- this change fixes the buttons covered by issue #58, but other gradient-backed buttons may still need the same treatment if they use the same pattern

## Next
- manually verify the two affected buttons in light and dark mode
- if the visual result is good, commit and open a PR for issue #58
