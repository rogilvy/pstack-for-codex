# Run authorized overnight work

An overnight request changes the lifecycle of a task. It does not expand authority.

![A robot tends a workbench at night while a written checklist stays visible.](./images/overnight.jpg)

## Write an overnight contract

Name the goal, finish condition, checkout, allowed writes, and stop condition:

```text
$poteto-mode keep working overnight in a fresh worktree from <base>. Migrate every caller to the new parser. Done means the old-call scan is empty and the full test suite passes. Do not push, open a pull request, or merge. Stop on an external credential or product decision.
```

The worktree keeps the run separate from other checkouts. A decision log makes the morning review shorter:

```text
$show-me-your-work record the decisions for this run.
```

Pre-answer common authority questions. State whether commits are allowed and whether the run must stop before a push, pull request, merge, deployment, or external message. Name credentials and product decisions as stop conditions.

## Use supported lifecycle objects

Codex may use a durable goal and a thread heartbeat only because the request asks for continued overnight work. The workflow checkpoints progress through supported task tools. It does not keep a shell process alive with a sleep loop.

A scheduled task, recurring monitor, or separate user-owned task still needs an explicit request for that object. The phrase "overnight" does not authorize an external message, pull request, merge, deployment, or new repository.

## Audit the result

In the morning, inspect:

1. the finish-condition evidence.
2. the integrated diff and current branch.
3. `decisions.tsv` if the run created one.
4. the agent receipt, including missing lanes, fallbacks, and observed or unverified model pairs.
5. remaining processes, worktrees, and scratch outputs.

Treat every child report as a claim until the parent checks the artifact.

If the run cannot reach the finish condition after repeated evidence-based attempts, it must stop and record the blocker. Continued execution is not permission to hide failure or weaken the finish condition.

## Configure Benny separately

Benny is a polling automation pack, not an overnight shortcut. Use `$setup-benny` only when you intend to configure Slack, tracker, repository, control-adapter, and canonical-state integration.

Setup does not activate Benny. It can reconcile exactly two `PAUSED` project automations only after explicit authority. A later request is required to activate them after the six canaries pass. Polling may add up to one schedule interval of latency, and overlap windows can reread events. Destination idempotency prevents duplicate effects.

Next: [Steer with principle names](./08-principles.md).

## Run a queue or a larger program

[Autopilot-full](../../skills/poteto-mode/playbooks/autopilot-full.md) carries independent work through build, verification, and merge only when each external action is authorized. Each owner needs independent verification; it cannot merge on its own verdict.

[Autopilot-stack](../../skills/poteto-mode/playbooks/autopilot-stack.md) is the same workflow without merging. Independent PRs stay independent. Stack a PR only on one it actually builds on, then review and land them yourself.

Verification scales with the size and risk of the change. A rebase or minor correction gets a fresh verifier; new behavior or a large new diff calls for broader verification. The verdict must match the final patch, including after patch-changing pushes.

[Orchestrate](../../skills/poteto-mode/playbooks/orchestrate.md) is an agentic coordinator for programs that outlive a single session. It assigns bounded work, checks artifacts, and coordinates integration rather than implementing code itself. The old `orch` CLI is removed. Keep ordinary work in the current task; a standing coordinator, separate task, or heartbeat still needs lifecycle authority.

## Catch up without changing the work

Invoke `$ketchup` for a plain-language account of what changed and the choices waiting on you, with recommendations, evidence, and risk. `$ketchup-video` offers a short subtitled slide video when rendering is available and keeps pending decisions in text. Both use supported task evidence and report history gaps. Neither authorizes a merge or any other pending action.
