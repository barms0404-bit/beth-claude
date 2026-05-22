"""Manual smoke test — hits every backend endpoint and prints pass/fail.

Usage:
    python scripts/smoke.py --base http://localhost:8000
    python scripts/smoke.py --base https://api.armstrongarikat.com --include-cron

Exit code is non-zero on any failure. `--include-cron` additionally POSTs to
each report-run endpoint (requires ANTHROPIC_API_KEY on the server; burns
LLM budget).

stdlib only — runnable without installing requirements.txt.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def _get(url: str) -> tuple[int, object]:
    req = Request(url, headers={"Accept": "application/json"})
    with urlopen(req, timeout=20) as resp:
        body = resp.read()
        return resp.getcode(), (json.loads(body) if body else None)


def _post(url: str) -> tuple[int, object]:
    req = Request(url, method="POST", headers={"Content-Type": "application/json"})
    with urlopen(req, timeout=300) as resp:
        body = resp.read()
        return resp.getcode(), (json.loads(body) if body else None)


# (label, path, required keys on the JSON object, or None)
CHECKS: list[tuple[str, str, set[str] | None]] = [
    ("GET /health",                     "/health",                          {"status", "environment"}),
    ("GET /api/agents",                 "/api/agents",                      None),
    ("GET /api/market/snapshot",        "/api/market/snapshot",             None),
    ("GET /api/top-50",                 "/api/top-50",                      {"snapshot_time", "entries"}),
    ("GET /api/reports",                "/api/reports",                     None),
    ("GET /api/reports/latest",         "/api/reports/latest",              None),
    ("GET /api/reports/archive",        "/api/reports/archive",             None),
    ("GET /api/recommendations/top",    "/api/recommendations/top",         None),
    ("GET /api/activity",               "/api/activity",                    None),
    ("GET /api/tickers/AAPL",           "/api/tickers/AAPL",                {"symbol"}),
    ("GET /api/tickers/AAPL/news",      "/api/tickers/AAPL/news",           None),
    ("GET /api/tickers/AAPL/history",   "/api/tickers/AAPL/history",        None),
    ("GET /api/verifications/AAPL",     "/api/verifications/AAPL",          None),
]


def run_checks(base: str) -> int:
    fail = 0
    print(f"Smoke testing {base}\n")
    for label, path, must_keys in CHECKS:
        url = base.rstrip("/") + path
        t0 = time.monotonic()
        try:
            code, data = _get(url)
        except (HTTPError, URLError) as exc:
            print(f"FAIL  {label:<32}  {exc}")
            fail += 1
            continue
        dt = (time.monotonic() - t0) * 1000
        if code != 200:
            print(f"FAIL  {label:<32}  HTTP {code}")
            fail += 1
            continue
        if must_keys and isinstance(data, dict):
            missing = must_keys - set(data.keys())
            if missing:
                print(f"FAIL  {label:<32}  missing keys: {sorted(missing)}")
                fail += 1
                continue
        print(f"PASS  {label:<32}  ({dt:.0f} ms)")
    return fail


def run_crons(base: str) -> int:
    fail = 0
    print()
    for slot in ("market_prep", "mid_day", "market_close"):
        url = f"{base.rstrip('/')}/api/reports/run/{slot}"
        try:
            code, _ = _post(url)
            print(f"PASS  POST /api/reports/run/{slot:<13}  HTTP {code}")
        except HTTPError as exc:
            if exc.code == 503:
                print(f"SKIP  POST /api/reports/run/{slot:<13}  503 (no ANTHROPIC_API_KEY)")
            else:
                print(f"FAIL  POST /api/reports/run/{slot:<13}  {exc}")
                fail += 1
        except URLError as exc:
            print(f"FAIL  POST /api/reports/run/{slot:<13}  {exc}")
            fail += 1
    return fail


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://localhost:8000")
    parser.add_argument(
        "--include-cron",
        action="store_true",
        help="Also POST to each /api/reports/run/{slot} (burns LLM budget).",
    )
    args = parser.parse_args()

    fail = run_checks(args.base)
    if args.include_cron:
        fail += run_crons(args.base)

    print()
    if fail:
        print(f"{fail} check(s) failed.")
        sys.exit(1)
    print("All checks passed.")


if __name__ == "__main__":
    main()
