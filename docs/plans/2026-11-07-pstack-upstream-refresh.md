# Refresh pstack to 0.15.36

Plugin 0.5.0 derives from the `pstack/` directory of `cursor/plugins` at commit `6b0300214a09fd6029cfb7077043125758cd1fd2`. The baseline is the Codex plugin 0.4.0 at `d5b20bce6f0602e3155960b5ea46e47fa0692ad2`, tracking upstream 0.15.24 at `1e5c90a4b6f249917bd21fe361b3a2a7deb741b8`.

The source inventory grows from 169 to 573 files: 411 additions, 51 modifications, and seven deletions. The per-path review is recorded in `compatibility/pstack-map.json`; source hashes remain separate from derivative code. No raw upstream branch or remote is delivered.

## Codex adaptation research

The existing fork is a behavioral port, not a manifest rename. It registers explicit-only skills through the Codex manifest and `agents/openai.yaml`, aliases long identities, and validates installed resources. It replaces source-host personas with optional receipted Codex profiles and requires observable model/effort evidence before explicit configuration. Its central runtime contract keeps authority with the parent, isolates concurrent writers, declares missing-capability fallbacks, uses supported task history, and requires explicit lifecycle authorization. Trusted hooks control cross-turn activation. Benny remains a dormant polling pack with separate activation and canary gates.

Those contracts remain in force. Source-host command syntax, private transcript scans, implicit lifecycle creation, and model names are not imported.

## Behavioral refresh

- Add explicit-only `create-formal-verification-skill`, `maintain-formal-verification-skill`, `statechart`, and `ketchup-video`. The catalog now contains 59 skills, including the derivative setup-benny entry, and 23 playbooks.
- Import the statechart compiler and captured TLC fixtures. Keep 401 source files byte-identical. Adapt instructions, package identity, installation gates, optional renderer tests, and strict TypeScript annotations. Missing Java/TLC does not silently install software; explicit opt-in is required.
- Replace the retired orchestration CLI with an agent-led coordination playbook. Remove the CLI launch wrapper, source, tests and typecheck target together. Keep parent-owned integration, live evidence, isolated writers and bounded lifecycle authority.
- Replace static Interrogate voting/rubrics with isolated executable reproductions and independent parent reruns. Remove the four retired reference files.
- Make Autopilot-stack the no-merge handoff, with stacks only for actual dependencies. Scale independent verification to patch size and rerun affected checks after patch changes.
- Carry updated prompt sharpening, complete catch-up decisions, reflection copy-before-edit, principles, and model-aware Arena judging without weakening Codex evidence or authorization rules.
- Port fork-aware PR stack discovery, timeout-bounded waits, and multi-backtick plan parsing. Retain Codex pagination checks, waitSeconds naming and inherited model validation. The upstream worktree timestamp patch applies only to a private transcript scan that Codex deliberately does not use, so the supported-history audit is retained.
- Keep Claude-specific harness instructions out of the runtime; map that source path to the Codex adaptation documentation. Installation examples target this fork.

## Verification

Run both frozen dependency installs, then `npm test`. The release gate includes all Node contract tests, watcher and plan Bun tests, statechart compiler/replay tests, both TypeScript checks, the generated compatibility report check, and a clean temporary Codex install/remove smoke. Live TLC and opt-in rendering are additional checks; skips must remain visible.

`node scripts/import-upstream.mjs --source <temporary-source>/pstack --verify-lock --dry-run` must verify exactly 573 source files. The compatibility tests also check every mapped derivative path and each byte-identical source hash.

Live model routing, connector permissions, trusted user-session hook activation, and Benny canaries are not established by the offline or temporary installation tests. No activation, merge, deployment, or installed-user-plugin upgrade is part of this change.
