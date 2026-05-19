# Issue: Owner notifications

## Intent

Notify the owner when work changes state without requiring the owner to poll
ChatGPT threads.

## Candidate Events

- PR created.
- tests failed.
- tests passed.
- reviewer objected.
- ready for human decision.
- deploy required.
- deploy completed.
- execution stale or hung.

## Success Criteria

- Dashboard has an unread notification center.
- Notifications link to progress pages and PRs.
- External push channel is pluggable.
- No secret or approval grant value is included.

## Non-goals

- SMS delivery in MVP.
- Team notification routing.
