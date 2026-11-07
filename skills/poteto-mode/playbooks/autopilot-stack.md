Delegation, lifecycle, isolation, history, and capability fallbacks follow `../references/codex-agent-runtime.md`.

### Autopilot-stack

Run `playbooks/autopilot-full.md`, but do not merge. This means autonomous build and verification followed by operator handoff, not a mandatory linear stack.

1. **Stop at verified in place of step 5.** Each PR must be verified and green at its current head. Hand the PRs to the operator. Nobody merges, arms auto-merge, or pushes after the handoff without the operator's go. Every authorized lifecycle tick names this playbook so the no-merge rule survives resumption. Creating that lifecycle still requires explicit authority.
2. **Stack only an actual dependency.** A PR builds on another PR only when its change requires it. Base that PR on its dependency's branch per **Size and stacks** in `playbooks/opening-a-pr.md`; otherwise branch from trunk. Each dependent PR rebases onto its parent's exact tip, and a stack root rebases onto trunk. A new lower head restacks the PRs above it. Apply the patch-id rule in `playbooks/shipping.md` to retain a verdict only when its evidence remains valid; run CI and mergeability at the current head.
3. **Preserve single-writer ownership.** The parent coordinates topology and authorized external writes. Each owner writes only its own isolated branch. Never retarget, submit, or force-push another owner's branch. Report verified head/base pairs and remaining gaps at handoff. A request to state the plan is not permission to execute; a stop immediately holds all writers.
