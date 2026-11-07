# Verify and ship

Verification must exercise the artifact that changed. A compiler pass proves types. It does not prove a UI flow, network side effect, or command transcript.

![A robot checks a built machine while another records the result.](./images/verification.jpg)

## State the finish condition

```text
$poteto-mode fix the retry duplicate. Done means the regression test passes and the real command writes one row after an interrupted retry.
```

The parent reruns authoritative checks after integrating child work. A child summary is evidence, not completion.

Match each claim to its proof. A type check supports a type claim. A focused test supports the exercised behavior. A screenshot or recording supports the visible state it shows. None of these alone proves an unrelated runtime or deployment claim.

## Create a project verification skill

If the repository lacks a repeatable real-surface check, ask:

```text
$create-verification-skill create a project skill that launches this CLI, drives one mapped command, captures a transcript, and cleans up.
```

The generated skill lives under `.agents/skills/verify-<app>/`. It contains launch, health, drive, evidence, and cleanup instructions plus a feature map. The generator runs one mapped feature before handing the skill over.

Use `$maintain-verification-skill` to compare an existing verification skill with the current app. It edits only proven drift and reruns affected live checks.

## Prove a property with a formal verification skill

```text
$create-formal-verification-skill the job lease and retry logic. A job must never run twice at once.
```

The generator chooses a high-value property and a fitting verifier. Event ordering often suits a bounded TLA+ model; properties of code inputs call for a code-level verifier when available. If only generated tests are available, it labels them as tests rather than formal proof.

It records the property, tool, bounds, code correspondence, and omissions in a project-local skill under `.agents/skills/`. A deliberately broken control must fail. If the current product already violates the property, report the counterexample without weakening the property or changing product code unless authorized. A pass covers the stated model or bound, not the whole system.

Run `$maintain-formal-verification-skill` after relevant merges or refactors. It checks that the model still matches the code, reruns verification and failing controls, and distinguishes drift from a product bug. Scheduling recurring maintenance requires a separate lifecycle request.

## Show the behavior as a statechart

```text
$statechart what the user sees when they edit a note offline.
```

`$statechart` checks a TLA+ model and generates a Mermaid chart with counterexample paths in the reader's terms. Reproduce a model finding in real code before calling it a product bug. State the model's bounds, hidden transitions, and any unchecked rules.

The compiler supports Node.js 22.18+, Bun 1.1.5+, or Deno 2+. Live checks require Java 11+ and TLC 1.7.4, installed only with opt-in. A missing checker or renderer is a declared limitation, not a reason to invent evidence.

## Review the diff

Run the repository checks, inspect `git diff --check`, and use `$interrogate` for a skeptical review when the risk warrants it. Retain bug findings only after executable repros and independent parent reruns; distinguish rejected claims from checks blocked by missing capabilities. Keep unsupported or trust-dependent checks visible as blockers or deferred operator gates.

## Open or merge only with authority

The [opening-a-PR playbook](../../skills/poteto-mode/playbooks/opening-a-pr.md) prepares a focused branch and pull request. The [babysit playbook](../../skills/poteto-mode/playbooks/babysit.md) watches authorized review and CI work. The [shipping playbook](../../skills/poteto-mode/playbooks/shipping.md) verifies a stack before an authorized landing action.

These playbooks do not infer permission to commit, push, open a pull request, merge, or deploy. State the allowed repository and action in the request. The parent validates the remote and branch immediately before a write.

Before a pull request is ready, compare its current head with the recorded verification result. If the patch changed after verification, rerun the affected checks. Read review dismissals as well as accepted findings.

Next: [Run authorized overnight work](./07-overnight.md).
