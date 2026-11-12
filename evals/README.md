# Release evaluation evidence

This directory is the release ledger for `pstack-for-codex` version `0.5.1`, derived from upstream pstack `0.15.36` at `6b0300214a09fd6029cfb7077043125758cd1fd2`. The immutable upstream file inventory is [`../upstream.lock.json`](../upstream.lock.json); [`cases/coverage.yaml`](cases/coverage.yaml) maps all 58 upstream skills and all 23 upstream playbooks, while [`cases/representative.yaml`](cases/representative.yaml) covers direct, indirect, incomplete-input, negative-trigger, unsupported-capability, setup, hook, and connector boundaries.

## Recorded environment

| Evidence | Verdict |
|---|---|
| Codex | `codex-cli 0.167.0-alpha.4` observed during the 2026-11-07 clean temporary-profile installation smoke; installation, resource checks, setup/teardown, hook boundaries and removal passed. |
| Models | No model inventory was exposed by the exercised plugin CLI. Actual model names and effort pairs are therefore **unverified/inherited**, not claimed. Setup tests cover supplied observable-model fixtures and unsupported pairs. |
| Permissions | Offline verification used the host's observable local process permissions. No live connector permission or model-generated write was exercised. Installed smoke uses only a temporary `CODEX_HOME` and temporary marketplace. |
| Offline tests | `npm run verify:offline` checks the static plugin, lifecycle, watcher/plan tooling, statechart compiler/replay, both TypeScript projects, Benny fake adapters, and documentation without installing into a Codex profile. `npm run verify` remains an alias for this offline-only target. |
| Installed behavior | `npm run test:installed` requires the `codex` CLI, adds the local marketplace, installs the plugin into a fresh temporary Codex profile, validates the installed skill files, runs setup/teardown and hook boundary checks, and proves that the exact installed path is removed. The exercised smoke validates installed files, not prompt-time discovery or model dispatch. |
| Benny canaries | `not-run`: both automation descriptors remain `PAUSED`. Read-only, test-channel triage, repro-only, bounded-fix, concurrent-race, and ambiguous-write canaries require operator-owned real adapters before activation. |

## Release disposition

All 59 registered skills are explicit-only. All 58 upstream skills and 23 playbooks have positive offline-contract outcomes and applicable authority, capability, and negative-trigger boundaries. Connector- and trust-dependent live activation is deferred, with the automation tasks paused. Polling latency, hook trust, connector availability, model diversity, and Bun availability remain declared limitations; none is presented as verified when it was not observable.

Run `npm test` (or `npm run verify:release`) for the mandatory release gate. It runs offline verification followed by the installed-profile smoke and fails closed when the `codex` prerequisite is unavailable. A release is blocked by any failed test, missing coverage row, stale compatibility report, residual temporary profile/cache, unpaused Benny descriptor, or an unverified live-activation claim.

## Statechart refresh evidence

On 2026-11-07, the statechart suite passed 293 tests with Node 24.22.1, Java 21 and the official TLC 1.7.4 JAR verified against SHA-256 `936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88`. This run exercised captured corpus replay, live model checking, 4,000 generated config cases and generated-model comparisons. Its renderer suite was intentionally skipped. A separate explicitly enabled render run passed all 74 tests with Pele 1.9.0, Mermaid 11.16.0 and jsdom 26.1.0 in a temporary cache. The default no-TLC run passed 193 tests and skipped 67 optional checks.

The frozen statechart dependency install and strict TypeScript check passed. The Codex boundary regression proves that missing Java/TLC never triggers a default mise install. No live user account, connector activation, model dispatch or existing user installation was exercised.
