#!/usr/bin/env python3
"""Validate delegated-task report structure and Git evidence using stdlib only."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path, PurePosixPath
from typing import Any


REQUIRED_KEYS = {
    "status",
    "taskTopology",
    "baseline",
    "resultCommit",
    "changedFiles",
    "commands",
    "acceptanceResults",
    "initiativeActions",
    "dissentRecords",
    "decisions",
    "deviations",
    "unmetItems",
    "environmentalEffects",
    "remainingRisks",
    "supervisionCost",
    "mechanismEvidence",
    "layerChecks",
    "concurrencyEvidence",
}
TOPOLOGY_KEYS = {
    "masterTaskId",
    "workerTaskId",
    "createdByTaskId",
    "reportBackTaskId",
    "reviewerTaskId",
    "humanGate",
    "branch",
    "worktree",
    "isolationMechanism",
    "controlRef",
}
CONTROL_REF_KEYS = {"kind", "name", "commit", "createdBy", "createdAt", "arbitrationRule"}
CONCURRENCY_KEYS = {"applicable", "mechanism", "simultaneousStartOracle", "result"}
VALID_STATUSES = {"success", "partial", "blocked", "failed"}
CONTROL_REF_KINDS = {"tag", "ref", "branch", "not-applicable"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("report", type=Path, help="UTF-8 JSON final report")
    parser.add_argument("--repo", type=Path, default=Path.cwd(), help="Git repository")
    parser.add_argument(
        "--permitted-path",
        action="append",
        default=[],
        help="Allowed path prefix; repeatable",
    )
    parser.add_argument("--master-task-id")
    parser.add_argument("--worker-task-id")
    parser.add_argument("--created-by-task-id")
    parser.add_argument("--report-back-task-id")
    parser.add_argument("--reviewer-task-id")
    parser.add_argument("--human-gate")
    parser.add_argument("--baseline")
    parser.add_argument("--result-commit")
    parser.add_argument("--competing", action="store_true")
    parser.add_argument("--require-clean", action="store_true")
    return parser.parse_args()


def git(repo: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", "-C", str(repo), *args],
        check=False,
        capture_output=True,
        text=True,
    )


def require_object(value: Any, label: str, errors: list[str]) -> dict[str, Any]:
    if not isinstance(value, dict):
        errors.append(f"{label} must be an object")
        return {}
    return value


def safe_relative_path(value: Any) -> str | None:
    if not isinstance(value, str) or not value:
        return None
    path = PurePosixPath(value)
    if path.is_absolute() or ".." in path.parts:
        return None
    return path.as_posix()


def under_prefix(path: str, prefix: str) -> bool:
    normalized = prefix.rstrip("/")
    return path == normalized or path.startswith(f"{normalized}/")


def main() -> int:
    args = parse_args()
    errors: list[str] = []
    try:
        report = json.loads(args.report.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        print(
            json.dumps(
                {"ok": False, "errors": [f"cannot read report: {error}"]},
                ensure_ascii=False,
            )
        )
        return 1

    report = require_object(report, "report", errors)
    missing = sorted(REQUIRED_KEYS - report.keys())
    if missing:
        errors.append(f"missing report keys: {', '.join(missing)}")
    if report.get("status") not in VALID_STATUSES:
        errors.append("status must be success, partial, blocked, or failed")
    if report.get("status") == "success" and report.get("unmetItems") not in ([], None):
        errors.append("success report must have an empty unmetItems array")

    topology = require_object(report.get("taskTopology"), "taskTopology", errors)
    missing_topology = sorted(TOPOLOGY_KEYS - topology.keys())
    if missing_topology:
        errors.append(f"missing taskTopology keys: {', '.join(missing_topology)}")
    expected_topology = {
        "masterTaskId": args.master_task_id,
        "workerTaskId": args.worker_task_id,
        "createdByTaskId": args.created_by_task_id,
        "reportBackTaskId": args.report_back_task_id,
        "reviewerTaskId": args.reviewer_task_id,
        "humanGate": args.human_gate,
    }
    for key, expected in expected_topology.items():
        if expected is not None and topology.get(key) != expected:
            errors.append(f"{key} does not match expected control-plane identity")

    control_ref = require_object(topology.get("controlRef"), "taskTopology.controlRef", errors)
    missing_control_ref = sorted(CONTROL_REF_KEYS - control_ref.keys())
    if missing_control_ref:
        errors.append(f"missing controlRef keys: {', '.join(missing_control_ref)}")
    isolation = topology.get("isolationMechanism")
    if not isinstance(isolation, str) or not isolation:
        errors.append("taskTopology.isolationMechanism must be a non-empty string")
    if args.competing:
        if control_ref.get("kind") in (None, "not-applicable"):
            errors.append("competing report requires an immutable control ref")
        if isolation in ("not-applicable", "same worktree", ""):
            errors.append("competing report requires an explicit isolated worktree mechanism")
        if not isinstance(control_ref.get("arbitrationRule"), str) or not control_ref.get("arbitrationRule"):
            errors.append("competing control ref requires arbitrationRule")

    concurrency = require_object(report.get("concurrencyEvidence"), "concurrencyEvidence", errors)
    missing_concurrency = sorted(CONCURRENCY_KEYS - concurrency.keys())
    if missing_concurrency:
        errors.append(f"missing concurrencyEvidence keys: {', '.join(missing_concurrency)}")
    if concurrency.get("applicable") is True:
        for key in ("mechanism", "simultaneousStartOracle", "result"):
            if not isinstance(concurrency.get(key), str) or not concurrency.get(key):
                errors.append(f"concurrencyEvidence.{key} must be non-empty when applicable")

    baseline = report.get("baseline")
    result = report.get("resultCommit")
    if args.baseline is not None and baseline != args.baseline:
        errors.append("baseline does not match expected contract baseline")
    if args.result_commit is not None and result != args.result_commit:
        errors.append("resultCommit does not match expected result commit")
    if control_ref.get("kind") not in CONTROL_REF_KINDS:
        errors.append("taskTopology.controlRef.kind is invalid")
    for key in ("name", "commit", "createdBy", "createdAt", "arbitrationRule"):
        if not isinstance(control_ref.get(key), str) or not control_ref.get(key):
            errors.append(f"taskTopology.controlRef.{key} must be a non-empty string")
    if control_ref.get("kind") != "not-applicable" and control_ref.get("commit") != result:
        errors.append("immutable control ref commit must equal resultCommit")
    commits_valid = True
    for label, commit in (("baseline", baseline), ("resultCommit", result)):
        if not isinstance(commit, str) or not commit:
            errors.append(f"{label} must be a non-empty commit")
            commits_valid = False
        elif git(args.repo, "rev-parse", "--verify", f"{commit}^{{commit}}").returncode != 0:
            errors.append(f"{label} is not a commit in the repository: {commit}")
            commits_valid = False

    raw_changed = report.get("changedFiles")
    changed: list[str] = []
    if not isinstance(raw_changed, list):
        errors.append("changedFiles must be an array")
    else:
        for value in raw_changed:
            normalized = safe_relative_path(value)
            if normalized is None:
                errors.append(f"unsafe or invalid changedFiles entry: {value!r}")
                continue
            changed.append(normalized)
            if args.permitted_path and not any(
                under_prefix(normalized, prefix) for prefix in args.permitted_path
            ):
                errors.append(f"changed file outside permitted paths: {normalized}")

    if commits_valid and isinstance(baseline, str) and isinstance(result, str):
        diff = git(args.repo, "diff", "--name-only", f"{baseline}..{result}")
        if diff.returncode == 0:
            actual = sorted(line for line in diff.stdout.splitlines() if line)
            if sorted(changed) != actual:
                errors.append("changedFiles does not match baseline-to-result Git diff")
        else:
            errors.append("cannot compute baseline-to-result Git diff")
        if git(args.repo, "diff", "--check", f"{baseline}..{result}").returncode != 0:
            errors.append("git diff --check failed for baseline-to-result range")

    commands = report.get("commands")
    if not isinstance(commands, list):
        errors.append("commands must be an array")
    else:
        for index, command in enumerate(commands):
            if (
                not isinstance(command, dict)
                or not isinstance(command.get("command"), str)
                or not isinstance(command.get("exitCode"), int)
            ):
                errors.append(
                    f"commands[{index}] must contain command string and integer exitCode"
                )

    for key in (
        "acceptanceResults",
        "initiativeActions",
        "dissentRecords",
        "decisions",
        "deviations",
        "unmetItems",
        "environmentalEffects",
        "remainingRisks",
        "layerChecks",
    ):
        if not isinstance(report.get(key), list):
            errors.append(f"{key} must be an array")
    require_object(report.get("mechanismEvidence"), "mechanismEvidence", errors)

    supervision = require_object(report.get("supervisionCost"), "supervisionCost", errors)
    for key in (
        "contractAmendments",
        "workerCorrectionRounds",
        "reportCorrections",
        "parentReruns",
        "reviewerRemediationRounds",
    ):
        value = supervision.get(key)
        if not isinstance(value, int) or value < 0:
            errors.append(f"supervisionCost.{key} must be a non-negative integer")

    if args.require_clean:
        status = git(args.repo, "status", "--porcelain")
        if status.returncode != 0 or status.stdout.strip():
            errors.append("worktree is not clean")

    print(json.dumps({"ok": not errors, "errors": errors}, ensure_ascii=False, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
