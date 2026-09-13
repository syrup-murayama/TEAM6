# Task Contract

## Identity

- Contract version:
- Master task ID:
- Worker task ID, model, and role: Implementation Worker
- Created by task ID:
- Report-back task ID:
- Independent reviewer task ID:
- Human gate identity:
- Repository:
- Baseline commit:
- Branch and worktree:
- Control-plane identity verified at:
- Stop-on-topology-conflict report path:
- Permitted paths:
- Independence requirement and prohibited worktrees:
- Immutable control ref and creation point, when competing:
- Control ref kind/name/commit/creator/created-at:
- Simultaneous completion arbitration rule:
- Remediation branch policy:
- Isolation mechanism and read/write boundary:
- Progress report path:
- Checkpoint/re-sync cadence (required when initiative is Level 3 or the worker runs long unattended sessions, e.g. Qoder):
- Final Markdown report path:
- Final JSON report path:

## Objective

State the user-visible outcome and, when relevant, the hypothesis being tested.

- Parent assumptions the worker is invited to challenge:

## Required mechanism

Name mechanisms that must actually execute for the result to count.

### Safety responsibility matrix

List every invariant and every layer required to enforce it. Add or rename columns for the project.

| Invariant | Gate/input layer | Executor/domain layer | Handler/adapter layer | Storage/serialization layer | Oracle |
|---|---|---|---|---|---|
| (fill in) | required/not applicable | required/not applicable | required/not applicable | required/not applicable | test/evidence |

### Concurrency and crash boundary

- Shared state checked before a side effect:
- Serialization mechanism: lock | transaction | unique constraint | single owner | not applicable
- Atomic boundary and durability guarantee:
- Deterministic simultaneous-start oracle:
- Reentrancy and duplicate/out-of-order behavior:
- Crash, stale-lock, and recovery behavior:

### Evidence objects required in final JSON

- `mechanismEvidence`: concrete mechanism and execution path:
- `layerChecks`: invariant-to-layer checks and results:
- `concurrencyEvidence`: applicable flag, serialization mechanism, simultaneous-start oracle, and result:

## Forbidden substitutions

List shortcuts that could match the output while bypassing the objective.

## Scope and non-goals

### Required

- (fill in)

### Non-goals

- (fill in)

## Decision authority

- Initiative level: 0 specified | 1 challenge | 2 bounded initiative | 3 co-design sandbox
- Green/autonomous changes:
- Reversible-change budget:
- Required rollback method:
- Yellow/must propose before acting:
- Red/human or explicit authority required:

### Worker may decide

- Local implementation details that do not alter behavior, dependencies, safety, evidence, or scope.

### Worker must return before acting

- Design ambiguity or mechanism substitution
- Dependency, runtime, schema, compatibility, or acceptance changes
- Host workaround, external effect, or scope expansion

### Worker must not do

- Modify the parent-owned acceptance oracle to make the work pass
- Access credentials, production, or unassigned repositories/worktrees
- Push, merge, deploy, publish, delete, or change task lifecycle without authority
- Read a competing implementation when independent comparison is required

## Worker dissent path

Record the challenged assumption, evidence, impact, smallest reversible experiment, rollback, and recommendation. Continue only unaffected work until the parent records one of: `accepted`, `rejected`, `experiment_authorized`, or `human_escalation`.

## Acceptance evidence

### Positive cases

- (fill in)

### Negative, transition, and recovery cases

- (fill in)

### Mechanism evidence

- Identify the real adapter, model, command, service, data, or runtime path when relevant.

### Independent verification

- Acceptance oracle fixed by parent before implementation:
- Parent-owned checks:
- Reviewer-owned checks:
- Negative oracle that fails when a required mechanism is removed or bypassed:
- Direct invocation or layer-bypass checks:

## Definition of done

- [ ] Baseline, branch, and scope verified before editing
- [ ] Task topology matches the control plane; no unresolved authority conflict exists
- [ ] Required mechanism executed; forbidden substitutes not used
- [ ] Initiative stayed within the green budget; yellow/red decisions are recorded
- [ ] Positive and relevant negative/transition/recovery cases verified
- [ ] Deviations, failures, environment effects, and risks recorded
- [ ] Result commit and worktree status reported accurately
- [ ] Markdown and JSON reports agree with files, commits, and command exit codes
- [ ] Parent independently reran critical checks
- [ ] Independent review completed when required
- [ ] Relevant concurrency, reentrancy, TOCTOU, crash, and layer-bypass behavior verified
- [ ] Competing result frozen at an immutable control ref before remediation

## Supervision cost

- Contract amendments:
- Worker correction rounds:
- Report corrections:
- Parent reruns:
- Reviewer remediation rounds:
- Unplanned authority or routing interventions:

## Final status

Use exactly one: `success`, `partial`, `blocked`, or `failed`. A narrative completion claim cannot override missing evidence or unmet definition-of-done items. JSON must include `status`, `taskTopology`, `baseline`, `resultCommit`, `changedFiles`, `commands` with exit codes, `acceptanceResults`, `initiativeActions`, `dissentRecords`, `decisions`, `deviations`, `unmetItems`, `environmentalEffects`, `remainingRisks`, `supervisionCost`, `mechanismEvidence`, `layerChecks`, and `concurrencyEvidence`. A `success` report must have an empty `unmetItems` array. `taskTopology` must contain the master, worker, creator, report-back, reviewer, human gate, branch, worktree, isolation mechanism, and control-ref object from this contract. The parent or reviewer should validate it with `validate_task_report.py` or an equivalent repository-native check.
