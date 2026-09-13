# Current Task

Updated: 2026-09-13

## Objective

- Build a demoable MVP of "AI二度寝裁判所" within a 1-hour budget (started 2026-09-13, see AGENTS.md § Project for the concept). Voice in (Web Speech API) → Claude verdict (`/api/judge`) → ElevenLabs speech out (`/api/speak`) → alarm/plan reschedule shown on screen, with the "call in sick" action gated behind a 3-second human long-press.

## Current state

- Branch: `main`
- Baseline or latest accepted commit: `4ccab67` (Cockpit + PR workflow doc update), pushed to `origin/main`
- Remote: `https://github.com/syrup-murayama/TEAM6` (public — switched from private so branch protection could apply), origin uses HTTPS (SSH key auth failed — publickey denied)
- Branch protection on `main`: enabled server-side (1 required approving review, dismiss-stale-reviews on, force-push and deletion blocked)
- Working tree: clean
- Active tasks/worktrees: none yet — no Cockpit tasks opened, no PRs exercised

## Active task topology

| Role | Task ID | Branch/worktree | Reports to | Status |
|---|---|---|---|---|
| Master | Unknown | Unknown | Human gate | Unknown |
| Worker | Unknown | Unknown | Unknown | Unknown |
| Independent reviewer | Unknown | Unknown | Human gate | Unknown |

- Immutable comparison refs: None verified.
- Authority conflicts: None verified.

## Team roster (GitHub collaborators on TEAM6)

| GitHub username | Repo role | Hackathon role | Status |
|---|---|---|---|
| syrup-murayama | admin (owner) | Lead implementer | active |
| (assistant — GitHub username TBD) | write | Implementation assistant | TBD |
| ginana0015-creator / asukaman7 / yukimmo91-lab | write | 2 of these 3 make presentation/demo materials; roles not yet assigned per-person | accepted (repo access), role TBD |

Only 2 people write app code for this build (lead + 1 assistant); the other 2 focus on presentation, not push access restriction.

## Accepted decisions

- Product concept locked: "AI二度寝裁判所" (see AGENTS.md § Project). Superseded the earlier "collect 4 separate episodes and synthesize a concept" plan — the team converged on one idea instead (episodes preserved as design inspiration in `docs/episodes/`).
- Stack locked: Node.js + Express backend (`/api/judge` → Claude API, `/api/speak` → ElevenLabs), plain HTML/CSS/JS frontend, Web Speech API for voice input. No build step, no frontend framework — chosen for the 1-hour budget.
- Actual coding roster is 2 people (lead + 1 assistant), not all 4 — the "all four implement in parallel" assumption from earlier in the day did not hold once real roles were assigned. The other 2 members produce presentation/demo material. Task contracts and branch splitting should target 2 concurrent workstreams, not 4.
- Workflow: PR-required merges to `main` still applies (see `AGENTS.md` § Team workflow (Cockpit + PR)), just with fewer concurrent branches than originally planned.
- API keys (Anthropic, ElevenLabs) must come from environment variables, never committed — repo is public.

## Work in progress

- None yet.

## Blockers and risks

- Repo is now public — anything pushed to it is visible to anyone. Do not commit secrets, credentials, or non-public hackathon material; keep those out of the tracked tree entirely (not just `.gitignore`'d after the fact).
- Voice input via the Web Speech API (`SpeechRecognition`) is Chrome-only and needs mic permission granted live during the demo — test this on the actual demo machine/browser before presenting, not just in dev.
- 1-hour time budget is tight for voice-in + LLM judge + TTS + reschedule UI; if time runs short, cut voice input first (fall back to the sleepiness slider from `docs/design/screen-flow.md`) before cutting the ElevenLabs voice-out, since the "AI speaks the verdict" moment is the strongest demo beat.
- SSH push to GitHub fails with "Permission denied (publickey)" for this machine/account — origin was switched to HTTPS as a workaround. Other machines/developers may hit the same issue; fix with `gh auth setup-git` or an added SSH key if SSH is preferred later.
- Assistant's GitHub username not yet collected — needed to confirm they already have write access (repo currently has 4 named collaborators; confirm the assistant is one of them).

## Supervision cost

- Contract amendments: 0 verified
- Worker correction rounds: 0 verified
- Report corrections: 0 verified
- Parent reruns: 0 verified
- Reviewer remediation rounds: 0 verified

## Next actions

1. Scaffold the Express app (`npm init`, `express`, `.env`/`.gitignore` for API keys) — lead implementer.
2. Confirm which of the 3 remaining collaborators is the "implementation assistant" and split work: e.g. lead builds `/api/judge` + `/api/speak` + verdict/reschedule screens, assistant builds the alarm/input/voice-capture screens per `docs/design/screen-flow.md`.
3. Wire the conversation loop: `SpeechRecognition` transcript → `/api/judge` (Claude) → verdict text/JSON → `/api/speak` (ElevenLabs) → `<audio>` playback → reschedule UI.
4. Implement the long-press "call in sick" human gate exactly as designed (3-second hold, not a single tap).
5. Test on the actual demo browser/machine (mic permission, audio autoplay) before presenting.
6. Update this file at the next clean boundary (after MVP works or if the 1-hour budget runs out first).
