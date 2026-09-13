# Implementation Review Checklist

## Master acceptance

- [ ] Compare the exact baseline-to-result diff.
- [ ] Confirm baseline and branch were correct before the worker edited.
- [ ] Inspect tracked, untracked, and generated files.
- [ ] Confirm the required mechanism was used, not only the expected output shape.
- [ ] Confirm the worker did not weaken or rewrite the acceptance oracle.
- [ ] Rerun critical checks independently, preferably from a clean environment.
- [ ] Verify positive, negative, transition, and recovery behavior as relevant.
- [ ] For check-then-side-effect paths, identify the serialization mechanism and deterministically test simultaneous starts; do not infer concurrency safety from sequential duplicate tests.
- [ ] Test direct invocation and layer bypass where a gate, executor, handler, adapter, or storage layer can be called independently.
- [ ] Confirm every safety invariant is enforced at each layer required by design, especially immediately before side effects.
- [ ] Check reported commits, exit codes, environmental effects, and remaining risks.
- [ ] Confirm Markdown/JSON reports match files and Git history; do not rely on PTY completion text.
- [ ] Confirm competing implementations remained isolated when independence was required.
- [ ] Confirm the first completed comparison result has an immutable control ref with exact kind/name/commit/creator/time, a predeclared simultaneous-completion arbitration rule, and every remediation uses a new branch/worktree.
- [ ] Verify the concrete isolation mechanism prevents competing workers from reading or writing one another's worktree.
- [ ] Match master, worker, creator, report-back, reviewer, and human-gate identities against the control plane; stop acceptance on any unexplained conflict.
- [ ] Preserve meaningful failed attempts and audit evidence.
- [ ] Confirm worker initiative stayed inside the reversible budget and every yellow/red decision was resolved explicitly.
- [ ] For Level 3 or long-horizon workers (for example Qoder), confirm checkpoint/re-sync reports actually landed at the agreed cadence and did not silently finalize a design decision between checkpoints.
- [ ] Assess whether the parent contract was complete and whether rejected worker dissent concealed a better or safer outcome.

## Independent review

- [ ] Read the design and task contract rather than relying on the implementation summary.
- [ ] Read the diff and source in context.
- [ ] Rerun tests and reproduce at least one critical behavior when risk warrants.
- [ ] Resolve evidence references back to real inputs and execution paths.
- [ ] Check whether prompts, fixtures, mappings, or test changes prescribe the expected answer.
- [ ] Record pass, conditional pass, or remediation with exact evidence.
- [ ] Review the parent decision trail as well as the worker implementation.
- [ ] Exercise concurrency, reentrancy, TOCTOU, crash boundaries, duplicate/out-of-order delivery, and stale-lock recovery when relevant.
- [ ] Use at least one negative oracle that fails when a required safety mechanism is removed or bypassed.
- [ ] Check whether high test counts merely enumerate contract examples while omitting system-level properties.

## Human gate

- [ ] Review unresolved risks and reviewer findings.
- [ ] Confirm destructive, external, production, release, authority, and phase changes explicitly.
- [ ] Do not treat a completed agent turn as approval or project completion.
- [ ] Review supervision cost: contract amendments, correction rounds, report corrections, reruns, and reviewer remediation.
