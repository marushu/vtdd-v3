# Epic: VTDD v3 Cloudflare Orchestrator Dashboard

## Intent

Build the Cloudflare dashboard that becomes VTDD's primary work home.

The owner should not need to find the correct ChatGPT thread to understand what
is running, blocked, completed, ready for review, or waiting for GO.

## Success Criteria

- `/orchestrator` lists active and completed executions.
- Each execution has a stable `/progress/:executionId` page.
- Dashboard cards show repo, issue, branch, phase, progress, PR URL, blocker,
  last update, and next human action.
- The dashboard can represent work from multiple repositories.
- The dashboard does not expose secrets, approval grants, raw logs, or
  chain-of-thought.
- High-risk actions are links into governed operator flows, not silent actions.

## Non-goals

- Natural-language Butler replacement in the first slice.
- DNS migration for `vtdd.hibou-web.com`.
- Hosted SaaS billing.
- Automatic merge/deploy/close.

## Validation

- Worker tests for dashboard routes and API JSON.
- Manual browser check on desktop and iPhone viewport after deploy.
