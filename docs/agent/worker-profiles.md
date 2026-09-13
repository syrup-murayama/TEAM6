# Implementation Worker Profiles

Use these as starting controls, not permanent personality claims. Role authority always comes from the task contract. Update profiles from audited results.

## Codex

- Default initiative: Level 2 for ordinary implementation.
- Use: broad repository integration, premise checking, diagnosis, connective implementation, and reversible local improvement.
- Control: state `role: Implementation Worker`; bound permitted paths and reversible changes; require proposals before architecture, task ownership, dependencies, schema, public behavior, evaluation, or acceptance changes.
- Review: independently check semantic evidence because a self-implementing Codex may favor evidence matching its interpretation.
- Observed strengths to test for: cross-package integration, state-machine reasoning, defense in depth, concurrency control, and premise checking.
- Observed risks to control: self-confirming acceptance, history/report hygiene, and initiative that exceeds a weak parent's intended boundary.

## Grok

- Default initiative: Level 2 for low-risk, reversible, or tightly specified mechanical work — including as a default implementation and research/investigation delegation target when speed or token headroom favors it; Level 1 for hypothesis-sensitive work. Raise or lower this default only from an audited run of results, not from general reputation.
- Use: fast broad implementation, research and investigation/documentation synthesis, modularization, extensive negative tests, and reproducible runners.
- Risk boundary that growth does not widen: route DB/migration/schema and API-contract changes to a higher-caution worker (for example Codex) even when Grok is the default implementer elsewhere. This split is set by the cost of a wrong change (hard to revert vs. `git revert`-able), not by Grok's current capability — do not let an improved track record quietly pull DB/schema work onto Grok without an explicit contract decision.
- Control: state required causal mechanisms and forbidden output-equivalent substitutes; require proposals before dependency, compatibility, host, external-effect, or success-interpretation changes.
- Model/version pinning: when delegating through an editor-native wrapper (for example Cursor), pin the exact Grok model id in the contract (for example `grok4.5high`) instead of leaving it to a default that can silently change.
- Reporting: require UTF-8 Markdown and JSON because PTY summaries may omit important detail, especially Japanese text.
- Experiments: isolate competing worktrees and freeze comparison branches.
- Observed strengths to test for: rapid modular implementation, broad negative-case enumeration, reproducible runners, accurate bounded remediation, and fast/accurate research or documentation synthesis.
- Observed risks to control: optimizing enumerated examples while missing system properties such as TOCTOU or defense-in-depth placement; accepting a conflicting authority instruction without stopping; and report metadata drift.
- Best challenger uses: independent competing implementation, validators, adversarial fixtures, boundary tests, and negative-oracle expansion. Do not infer safety from test count alone.
- Re-audit trigger: re-evaluate this profile after a major Grok version release or after roughly three corrected/rejected tasks in a row; treat any "default delegation target" status as provisional, not permanent.

## Qoder

- Role fit: long-horizon design-and-implementation worker (ACP-based, chosen for extended single-session autonomy and Asia-stack model access such as Qwen/Kimi-class models), not a substitute for the Master Agent — it may hold a co-design sandbox within one delegated workstream, but acceptance, integration, and cross-workstream authority stay with the Master Agent.
- Default initiative: Level 2 baseline. Level 3 (co-design sandbox) only when the contract explicitly scopes one bounded design+implementation subproject (for example, a feature slice from schema sketch through working code) and sets a checkpoint cadence — long unattended autonomy is what makes Level 3 workable here, and also what makes it risky without scheduled check-ins.
- Use: multi-step design-to-implementation workstreams that would otherwise need many small hand-offs, especially when the reason for choosing Qoder over a lab-native CLI is long single-session autonomy or Asia-stack model reach rather than raw implementation speed.
- Control: require a checkpoint or re-sync cadence in the contract (time- or milestone-based), not only a final report — a single long unattended run with no interim checkpoint is a red flag regardless of initiative level. Require proposals before architecture, schema, dependency, or acceptance changes even inside a Level 3 sandbox; co-design widens what Qoder may propose, not what it may unilaterally finalize.
- Invocation note: reachable in Cockpit as `--agent-type qoder` (visual or terminal), with `--system-prompt-preset cockpit` or `qoder`; verify the account profile and usage the same way as other Cockpit-native agents.
- Reporting: same file-based Markdown/JSON requirement as other non-lab-native workers; confirm checkpoint reports actually landed at the agreed cadence, since a long-horizon session can drift for hours without one and still present a clean final summary.
- Observed risks to control: scope creep across a long unattended session; finalizing a design decision that should have been a yellow proposal because no natural stopping point occurred before the contract's checkpoint; and mixing design authority with implementation authority when the contract scoped only one of them.
- Experiments: treat a competing Qoder run the same as any other competing implementation — isolate worktrees and freeze the control ref at first completion.

## Unknown or changed model

Start at Level 1 when mechanism or safety is sensitive and Level 2 for low-risk reversible work. Promote or restrict only from observed, audited outcomes. Never let a profile weaken project invariants or the human gate.
