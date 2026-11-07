---
name: interrogate
description: "Use for \"interrogate\", \"adversarial review\", \"multi-model review\", \"challenge this\", \"stress test this code\", \"find blind spots\", or \"tear this apart\". Adversaries try to break a change or design, and only findings proven by a run survive."
---

# Interrogate

Delegation and optional capabilities follow `../poteto-mode/references/codex-agent-runtime.md`.

Adversaries try to break a change or a design. A finding survives only when a run proves it. Report the findings. Do not apply fixes.

## Frame

The scope is what the user names. Otherwise it is the branch diff from its merge base with the base branch, through the working tree. State the intent with the **in-your-own-words** skill, from the user's message, the commits, and the PR description. Ask the user when the intent is unclear.

## Fan out

Run Phase A steps 3 and 4 and Phase B of the **arena** skill, with four changes. Use the `interrogate reviewers` list in the installed pstack model profiles in place of `arena runners`. Copy the scope's uncommitted changes, including relevant untracked files, into each isolated worktree without changing the source checkout. Spawn generic adversaries through supported subagent tools. Each may write only repros in its own worktree, not fixes to the reviewed checkout. Keep `model` and `reasoning_effort` separate; inherit the parent pair unless the user or a validated profile requests another available pair. Report unverified served identities and reduced model diversity. In place of the arena task and rationale, give each adversary the scope, the intent, and this brief:

> Break this change. Prove each finding with a run against the real code, such as a failing test, a repro script, or command output that shows the wrong behavior. For a design or plan, run a prototype or probe the current tree. Keep repros in your own worktree. Report each finding with a title, the exact command, the output it printed, and the output the intent requires. Leave out anything you did not run. That covers style, naming, structure, and risks that need a future change to matter. No findings is a valid result.

If subagents or safe writable isolation are unavailable, use `sequential-parent` in a separate output directory or worktree. If a real run cannot be made within authority, report a coverage gap, never a verified finding. Never run a destructive repro or transmit data outside the authorized scope merely to prove a finding.

## Verify

Verify each finding per arena Phase F by rerunning its command. Keep a finding when the output shows the failure and the failure breaks the intent. Drop the rest. Merge findings that share a root cause.

Skip arena Phases C, D, and E. Adversaries find different failures, so the verdict keeps every verified finding, not one adversary's list.

## Output

- **Intent**: the restatement.
- **Findings**: for each verified finding, the command, its output, how it breaks the intent, and the adversaries that found it. Say "no verified findings" when none survive.
- **Dropped**: for each adversary, the count of dropped findings and why.

Also report reviewer lanes, requested versus observed model evidence, dropouts, and verification gaps. A child report is evidence, not proof until the parent reruns it.
