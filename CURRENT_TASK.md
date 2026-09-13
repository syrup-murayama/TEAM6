# Current Task

Updated: 2026-09-13

## Objective

- Product decided: **AI二度寝裁判所** (AI Snooze Court). User enters current sleepiness, last night's bedtime, wake time, and today's schedule; a mock "AI" judge rules whether snoozing is allowed and for how many minutes, then previews the alarm/schedule shifted accordingly. Skipping work entirely is gated behind an explicit human long-press confirmation — never an AI decision.
- Current slice: frontend-only static mock (no backend, no real AI/calendar integration) to get a demoable experience fast within the hackathon time budget.

## Current state

- Branch: `main`
- Baseline or latest accepted commit: `4ccab67` (Cockpit + PR workflow doc update), pushed to `origin/main`
- Remote: `https://github.com/syrup-murayama/TEAM6` (public — switched from private so branch protection could apply), origin uses HTTPS (SSH key auth failed — publickey denied)
- Branch protection on `main`: enabled server-side (1 required approving review, dismiss-stale-reviews on, force-push and deletion blocked)
- Working tree: modified on branch `ginana0015-creator/setup-workspace` — added `index.html`, `style.css`, `script.js` (static mock of AI二度寝裁判所) and this doc update; not yet pushed/PR'd as of this update
- Active tasks/worktrees: `ginana0015-creator/setup-workspace` (this session, implementing the frontend mock)

## Active task topology

| Role | Task ID | Branch/worktree | Reports to | Status |
|---|---|---|---|---|
| Master | Unknown | Unknown | Human gate | Unknown |
| Implementation Worker | Cockpit task (ginana0015-creator, this session) | `ginana0015-creator/setup-workspace` | Human gate (ginana0015-creator) | In progress — mock UI built, verified via automated browser interaction, PR pending |
| Independent reviewer | Unknown | Unknown | Human gate | Unknown |

- Immutable comparison refs: None verified.
- Authority conflicts: None verified.

## Team roster (GitHub collaborators on TEAM6)

| GitHub username | Repo role | Status |
|---|---|---|
| syrup-murayama | admin (owner) | active |
| ginana0015-creator | write | accepted |
| asukaman7 | write | accepted |
| yukimmo91-lab | write | accepted |

All four members now have write access to TEAM6.

## Accepted decisions

- Product: AI二度寝裁判所 (see Objective above). `AGENTS.md` Type/Stack updated to `web-frontend` / static HTML+CSS+JS accordingly.
- All four team members are developers and will implement in parallel (not a single-coder team as first assumed). Task contracts should expect multiple simultaneous human implementers on the same repo — use branches/worktrees per contributor, and treat concurrent-edit conflicts and merge order as an explicit topic when splitting work, not an afterthought.
- Workflow: all four use Cockpit to run their work, split by role/scope, and land changes on `main` only via reviewed Pull Requests (no direct push to `main`). See `AGENTS.md` § Team workflow (Cockpit + PR).

## Work in progress

- `ginana0015-creator/setup-workspace`: built the first working slice — `index.html` + `style.css` + `script.js` at repo root, a self-contained static mock:
  - Input panel: sleepiness slider (1-5), last bedtime, wake time, current alarm time, today's schedule busyness.
  - Mock "AI" judge (`judge()` in `script.js`, rule-based, no real model/API call): scores sleepiness + schedule leniency against hours slept, decides allow/deny and allowed snooze minutes, renders a court-verdict-styled card (case number, facts, main ruling, reasoning) plus a before/after preview of the alarm time and a demo schedule list shifted by the granted minutes.
  - Human gate: a separate "skip work today" button requires a 2-second pointer long-press to confirm (progress-fill animation); releasing early cancels with no effect. This path is fully independent of the judge logic — the AI never decides this.
  - Verified by scripted browser interaction (Cockpit in-app browser: DOM snapshot + `evaluate` + `click`), not just visual inspection: confirmed default time autofill, an allow-case (short sleep, high sleepiness, light schedule → "認容" + correct alarm shift), a deny-case (long sleep → "却下"), long-press completing after 2.2s, and early release correctly cancelling. Screenshot capture via `cockpit browser screenshot` hung/timed out in this environment (killed after backgrounding twice) and was not obtained; functional verification stands in for it.
  - Not yet pushed; no PR opened yet.

## Blockers and risks

- Repo is now public — anything pushed to it is visible to anyone. Do not commit secrets, credentials, or non-public hackathon material; keep those out of the tracked tree entirely (not just `.gitignore`'d after the fact).
- All four developers may now touch `index.html`/`style.css`/`script.js` at the same time since the first slice landed at the repo root with no module boundaries yet — role/scope split among the four developers still not formally defined; agree on file/feature ownership before more parallel Cockpit tasks start, to keep PRs low-conflict.
- No automated tests exist for the judge logic or the long-press gate; current verification is manual/scripted-browser only (see Work in progress). Worth adding at least a few unit-style checks for `judge()` if more logic branches get added.
- SSH push to GitHub fails with "Permission denied (publickey)" for this machine/account — origin was switched to HTTPS as a workaround. Other machines/developers may hit the same issue; fix with `gh auth setup-git` or an added SSH key if SSH is preferred later.

## Supervision cost

- Contract amendments: 0 verified
- Worker correction rounds: 0 verified
- Report corrections: 0 verified
- Parent reruns: 0 verified
- Reviewer remediation rounds: 0 verified

## Next actions

1. Push `ginana0015-creator/setup-workspace` and open a PR to `main`; get 1 approving review per branch protection.
2. Split remaining scope across the other three developers (e.g. real AI/LLM call behind the judge, actual alarm/calendar integration, styling/animation polish, tests) and record it in the task topology table above; open one Cockpit task/branch per person.
3. Decide whether the "AI" judge stays a mock rule-based function for the demo or gets wired to a real model call — currently a deliberate simplification, not yet escalated as a yellow/red decision.
4. Create task contracts (`docs/agent/task-contract-template.md` copies) once work is delegated to other agent workers, not just human developers each on their own branch.
5. Update this file at the next clean boundary.
