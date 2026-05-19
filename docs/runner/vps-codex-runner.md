# VPS Codex Runner

Issue: #5

This runner is the first bridge from the Cloudflare dashboard queue to VPS
Codex CLI execution.

## Dashboard Flow

1. Owner posts a safe task through `POST /api/dispatch`.
2. Worker creates a queued execution in Cloudflare KV.
3. VPS runner calls `GET /api/runner/queue?limit=1`.
4. VPS runner claims one execution with `POST /api/runner/claim`.
5. VPS runner reports progress through `POST /api/execution-events`.

## Local Dry Run

```sh
VTDD_ORCHESTRATOR_URL=https://vtdd-v3-orchestrator.polished-tree-da7c.workers.dev \
npm run runner:once
```

Dry run is the default. It claims one queued execution and posts safe progress
events without starting Codex CLI.

## Real Codex CLI Execution

```sh
VTDD_ORCHESTRATOR_URL=https://vtdd-v3-orchestrator.polished-tree-da7c.workers.dev \
VTDD_WORKSPACE_ROOT=/home/vtdd/workspaces \
VTDD_RUNNER_EXECUTE=1 \
npm run runner:once
```

The runner intentionally does not merge, deploy, close Issues, mutate
credentials, or change DNS. Those remain owner-governed dashboard decisions.

## Safety Boundary

- No raw terminal stream is sent to Cloudflare.
- No chain-of-thought is sent to Cloudflare.
- Failure reports include exit code and concise blocker only.
- High-risk dispatch types are rejected by the Worker before runner pickup.
