#!/usr/bin/env python3
"""Generate the judge-facing replay asset from the deterministic engine."""
import argparse
import json
from pathlib import Path

from compare_strategies import compare_profiles

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "site" / "replay-data.js"


def render():
    replay = compare_profiles()
    payload = {
        "evidence": "Deterministic AI-policy simulation; not a human playtest or balance proof.",
        **replay,
    }
    return "window.lastLightReplay = " + json.dumps(payload, indent=2, sort_keys=True) + ";\n"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    expected = render()
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text() != expected:
            raise SystemExit("replay-data.js is stale; run python3 scripts/build_replay.py")
        print("replay asset synchronized")
    else:
        OUTPUT.write_text(expected)
        print(f"wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
