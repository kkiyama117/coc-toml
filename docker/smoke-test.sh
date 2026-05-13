#!/usr/bin/env bash
# Smoke tests for coc-toml inside the Docker / Podman image.
#
# Strategy:
#   * The build itself is checked by running `node --check` on the bundled
#     extension entry point — catches syntax errors and missing files.
#   * The Tombi binary is bundled in the image so we can exercise project
#     config discovery and TOML-version switching directly via `tombi lint`
#     without needing a live coc.nvim session (headless coc.nvim has
#     unreliable initialization behavior for automated tests).
#
# Modes:
#   smoke-test                   build check + tombi --version (no scenarios)
#   smoke-test all               build check + every scenario below
#   smoke-test no-config         lint a fixture with NO tombi.toml
#                                (sample is TOML 1.0-compatible — must PASS)
#   smoke-test with-config-v1.0  fixture with tombi.toml pinning v1.0.0;
#                                sample uses v1.1-only syntax — must FAIL
#   smoke-test with-config-v1.1  fixture with tombi.toml pinning v1.1.0;
#                                sample uses v1.1-only syntax — must PASS
#
# Escape hatch: any argv that doesn't match a known mode is exec'd directly,
# e.g. `smoke-test nvim /work/examples/test.toml`.

set -euo pipefail

FIXTURES_ROOT=/work/docker/fixtures
EXT_BUNDLE=/work/lib/index.js

print_header() {
  echo "[smoke-test] coc-toml version: $(node -p "require('/work/package.json').version")"
  echo "[smoke-test] tombi: $(tombi --version)"
  echo "[smoke-test] node:  $(node --version)"
}

check_build() {
  echo "[smoke-test] checking build artifact: ${EXT_BUNDLE}"
  if [[ ! -s "$EXT_BUNDLE" ]]; then
    echo "[smoke-test] FAIL: ${EXT_BUNDLE} missing or empty"
    return 1
  fi
  # Parse-only check: catches syntax errors without requiring coc.nvim runtime.
  if ! node --check "$EXT_BUNDLE"; then
    echo "[smoke-test] FAIL: ${EXT_BUNDLE} has JS syntax errors"
    return 1
  fi
  echo "[smoke-test] PASS: build artifact parses"
  return 0
}

# Run one fixture scenario.
#
# Args:
#   $1 = scenario directory name under fixtures/
#   $2 = expected outcome: "pass" (lint exits 0) or "fail" (lint exits non-zero)
#   $3 = required substring in lint output (only checked when expected="fail")
run_scenario() {
  local name="$1"
  local expected="$2"
  local needle="${3:-}"
  local dir="${FIXTURES_ROOT}/${name}"

  if [[ ! -d "$dir" ]]; then
    echo "[smoke-test] FAIL ${name}: fixture directory missing: $dir"
    return 1
  fi

  echo "[smoke-test] --- scenario: ${name} (expect=${expected}) ---"
  echo "[smoke-test]   dir=${dir}"

  local out rc
  set +e
  out=$(cd "$dir" && tombi lint sample.toml 2>&1)
  rc=$?
  set -e

  echo "$out" | sed 's/^/      /'
  echo "[smoke-test]   lint exit=${rc}"

  case "$expected" in
    pass)
      if [[ $rc -eq 0 ]]; then
        echo "[smoke-test]   PASS ${name}: lint succeeded as expected"
        return 0
      fi
      echo "[smoke-test]   FAIL ${name}: expected lint to succeed (exit=0), got ${rc}"
      return 1
      ;;
    fail)
      if [[ $rc -eq 0 ]]; then
        echo "[smoke-test]   FAIL ${name}: expected lint to fail, but it succeeded"
        return 1
      fi
      if [[ -n "$needle" ]] && ! grep -qF "$needle" <<<"$out"; then
        echo "[smoke-test]   FAIL ${name}: lint failed but output missing '${needle}'"
        return 1
      fi
      echo "[smoke-test]   PASS ${name}: lint failed as expected"
      return 0
      ;;
    *)
      echo "[smoke-test]   FAIL ${name}: unknown expected outcome '${expected}'"
      return 1
      ;;
  esac
}

run_all_scenarios() {
  local rc=0
  run_scenario no-config         pass                                              || rc=$?
  run_scenario with-config-v1.0  fail "TOML v1.0.0 or earlier"                     || rc=$?
  run_scenario with-config-v1.1  pass                                              || rc=$?
  return $rc
}

# --- main ---

print_header

case "${1:-}" in
  "" )
    check_build
    ;;
  all )
    rc=0
    check_build || rc=$?
    run_all_scenarios || rc=$?
    if [[ $rc -eq 0 ]]; then
      echo "[smoke-test] ALL PASS"
    else
      echo "[smoke-test] AT LEAST ONE CHECK FAILED (rc=$rc)"
    fi
    exit $rc
    ;;
  no-config )
    run_scenario no-config pass
    ;;
  with-config-v1.0 )
    run_scenario with-config-v1.0 fail "TOML v1.0.0 or earlier"
    ;;
  with-config-v1.1 )
    run_scenario with-config-v1.1 pass
    ;;
  build )
    check_build
    ;;
  * )
    # Escape hatch: pass through to exec.
    exec "$@"
    ;;
esac
