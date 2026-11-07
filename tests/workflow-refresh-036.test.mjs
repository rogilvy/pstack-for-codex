import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import test from "node:test";

const source = (relative) => readFile(new URL(`../skills/${relative}`, import.meta.url), "utf8");

// These are instruction contracts, not a claim that an LLM execution was tested.
test("interrogate instructs isolated reproductions and parent reruns, not voting on speculative reviews", async () => {
  const text = await source("interrogate/SKILL.md");
  assert.match(text, /uncommitted changes, including relevant untracked files/);
  assert.match(text, /only repros in its own worktree/);
  assert.match(text, /Do not apply fixes/);
  assert.match(text, /rerunning its command/);
  assert.match(text, /Skip arena Phases C, D, and E/);
  assert.match(text, /no verified findings/);
  assert.match(text, /coverage gap/);
  assert.match(text, /sequential-parent/);
  assert.doesNotMatch(text, /references\/(?:rubric|reviewer-prompt|lead-judgment|code-quality-review)\.md/);
  for (const name of ["rubric", "reviewer-prompt", "lead-judgment", "code-quality-review"]) {
    await assert.rejects(access(new URL(`../skills/interrogate/references/${name}.md`, import.meta.url)), { code: "ENOENT" });
  }
});

test("orchestration is agent-driven while authority and isolation remain explicit", async () => {
  const text = await source("poteto-mode/playbooks/orchestrate.md");
  assert.doesNotMatch(text, /scripts\/orch|orch (?:init|inbox|ledger|frontier|status)/);
  assert.match(text, /retired orchestration CLI or polling loops/);
  assert.match(text, /exclusive paths, separate worktrees, or separate output directories/);
  assert.match(text, /require explicit lifecycle authority/);
  assert.match(text, /parent performs authorized external writes/);
  assert.match(text, /supported task-history APIs/);
  assert.match(text, /current head/);
  assert.match(text, /After two retries/);
  assert.match(text, /sequential-parent/);
});

test("arena cannot silently claim an inherited or unobservable cross-family judge", async () => {
  const text = await source("arena/SKILL.md");
  assert.match(text, /`auto` and `inherit-parent` never qualify/);
  assert.match(text, /requested profile is not evidence/);
  assert.match(text, /skip this lane/);
  assert.match(text, /family check could not run/);
  assert.match(text, /Never retry a rejected pair/);
});

test("autopilot hands off dependent stacks without turning every queue into a stack", async () => {
  const stack = await source("poteto-mode/playbooks/autopilot-stack.md");
  assert.match(stack, /but do not merge/);
  assert.match(stack, /Nobody merges, arms auto-merge, or pushes after the handoff/);
  assert.match(stack, /Stack only an actual dependency/);
  assert.match(stack, /parent coordinates topology and authorized external writes/);
  const full = await source("poteto-mode/playbooks/autopilot-full.md");
  assert.match(full, /Another full swarm runs only for new behavior/);
  assert.match(full, /wording-only change needs no new swarm/);
  assert.match(full, /already in the base does not block unless this PR copies it or newly reaches it/);
  assert.match(full, /Missing required live proof fails closed/);
});

test("sharpen returns a deeper prompt and reflection edits only an approved owned copy", async () => {
  const sharpen = await source("sharpen/SKILL.md");
  assert.match(sharpen, /Then rewrite my prompt/);
  assert.doesNotMatch(sharpen, /Don't hand back a rewritten prompt/);
  const reflect = await source("reflect/SKILL.md");
  assert.match(reflect, /Never edit a skill under `plugins\/cache\/`/);
  assert.match(reflect, /After approval, copy the skill folder there and edit the copy/);
  assert.match(reflect, /Never open a PR or push/);
});
