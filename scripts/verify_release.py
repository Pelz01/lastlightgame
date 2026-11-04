#!/usr/bin/env python3
"""Run the complete judge evidence gate from a clean snapshot of HEAD."""
import argparse
import hashlib
import json
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE_ARTIFACTS = (
    "docs/economy-v0.2.md",
    "docs/judge-demo.md",
    "site/replay.html",
    "site/replay-data.js",
)


def run(command, root):
    result = subprocess.run(
        command,
        cwd=root,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    if result.returncode:
        raise RuntimeError(
            f"{' '.join(command)} failed with exit {result.returncode}:\n{result.stdout}"
        )
    return result.stdout.strip()


def run_gate(root):
    python = sys.executable
    checks = [
        ("unit_tests", [python, "-m", "unittest", "discover", "-s", "scripts", "-p", "test_*.py"]),
        ("edge_tests", [python, "scripts/check_rule_edges.py"]),
        ("witness", [python, "scripts/check_witness.py"]),
        ("faq_drift", [python, "scripts/build_faq.py", "--check"]),
        ("replay_drift", [python, "scripts/build_replay.py", "--check"]),
        ("judge_replay", [python, "scripts/compare_strategies.py", "--replay"]),
    ]
    results = {}
    for name, command in checks:
        output = run(command, root)
        results[name] = {"passed": True, "last_line": output.splitlines()[-1] if output else ""}
    return results


def artifact_manifest(root):
    """Bind the release result to the exact judge-facing evidence files."""
    return {
        path: {
            "bytes": (root / path).stat().st_size,
            "sha256": hashlib.sha256((root / path).read_bytes()).hexdigest(),
        }
        for path in EVIDENCE_ARTIFACTS
    }


def clean_snapshot():
    commit = run(["git", "rev-parse", "HEAD"], ROOT)
    tree = run(["git", "rev-parse", f"{commit}^{{tree}}"], ROOT)
    archive = subprocess.Popen(
        ["git", "archive", "--format=tar", commit],
        cwd=ROOT,
        stdout=subprocess.PIPE,
    )
    with tempfile.TemporaryDirectory(prefix="last-light-release-") as directory:
        root = Path(directory)
        assert archive.stdout is not None
        with tarfile.open(fileobj=archive.stdout, mode="r|") as bundle:
            bundle.extractall(root, filter="data")
        if archive.wait() != 0:
            raise RuntimeError("git archive failed")
        return commit, tree, run_gate(root), artifact_manifest(root)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--in-place",
        action="store_true",
        help="check the working tree instead of a clean committed snapshot",
    )
    args = parser.parse_args()
    try:
        working_tree_clean = not bool(run(["git", "status", "--porcelain"], ROOT))
        if args.in_place:
            commit = run(["git", "rev-parse", "HEAD"], ROOT)
            tree = run(["git", "rev-parse", f"{commit}^{{tree}}"], ROOT)
            results = run_gate(ROOT)
            artifacts = artifact_manifest(ROOT)
            mode = "working-tree"
        else:
            commit, tree, results, artifacts = clean_snapshot()
            mode = "clean-git-archive"
        print(json.dumps({
            "artifacts": artifacts,
            "commit": commit,
            "python": sys.version.split()[0],
            "source_tree": tree,
            "working_tree_clean": working_tree_clean,
            "mode": mode,
            "passed": True,
            "checks": results,
        }, indent=2, sort_keys=True))
    except (OSError, RuntimeError, subprocess.SubprocessError) as error:
        print(json.dumps({"passed": False, "error": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
