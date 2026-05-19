# VTDD v3 Control Plane

## Thesis

VTDD v3 should not treat a ChatGPT thread as the operational home. The durable
home is a Cloudflare dashboard backed by GitHub truth, VPS Codex CLI execution
events, and explicit authority gates.

## Roles

- Cloudflare Worker: dashboard, API routes, policy gates, operator pages.
- VPS Codex CLI: LLM brain and implementation runner.
- GitHub: durable Issues, PRs, checks, branches, comments, and queue records.
- Passkey operator: high-risk approval boundary.
- Custom GPT: optional conversational surface and migration compatibility.

## Initial Data Model

Execution record:

- `executionId`
- `repository`
- `issueNumber`
- `branch`
- `status`
- `phase`
- `progress`
- `currentStep`
- `prUrl`
- `blocker`
- `lastUpdatedAt`
- `nextHumanAction`
- `returnThreadUrl`

## Owner-Facing Pages

- `/orchestrator`: multi-repo work inbox.
- `/progress/:executionId`: single execution waiting room.
- `/decisions`: merge/deploy/close/retry queue.

## Authority Boundary

Read-only dashboard operations do not need GO.

The following require GO + real passkey:

- merge
- deploy
- DNS mutation
- credential mutation
- permission mutation
- destructive cleanup
- repository administration
- policy changes that relax authority gates

## Migration From v2

Reuse concepts from `vtdd-v2-p`:

- passkey approval model
- GitHub App read/write boundaries
- VPS runner queue and execution IDs
- generated PR body discipline
- runtime truth over memory

Do not inherit the Custom GPT Action Schema as the primary product surface.
