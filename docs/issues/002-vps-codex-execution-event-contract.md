# Issue: VPS Codex CLI execution event contract

## Intent

Define the event contract that lets VPS Codex CLI report progress to the
Cloudflare dashboard.

## Success Criteria

- Runner can emit `queued`, `picked_up`, `codex_starting`, `planning`,
  `editing_files`, `running_tests`, `pushing_branch`, `creating_pr`,
  `waiting_review`, `completed`, `failed`, `canceled`, and `stale`.
- Events include `executionId`, repo, issue, branch, phase, current step,
  touched files if safe, PR URL if available, blocker, and timestamp.
- Events are safe for owner-facing display.
- No full terminal stream or chain-of-thought is exposed.

## Non-goals

- Parallel scheduling policy.
- Notification delivery.
- Retry/cancel controls.
