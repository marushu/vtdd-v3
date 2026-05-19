# VTDD v3 Control Plane

## Thesis

VTDD v3 は ChatGPT thread を operational home として扱わない。durable home は GitHub truth、VPS Codex CLI execution event、明示的な authority gate に支えられた Cloudflare dashboard である。

## Roles

- Cloudflare Worker: dashboard、API route、policy gate、operator page。
- VPS Codex CLI: LLM brain と implementation runner。
- GitHub: durable Issues、PRs、checks、branches、comments、queue records。
- Passkey operator: high-risk approval boundary。
- Custom GPT: optional conversational surface と migration compatibility。

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

- `/orchestrator`: 複数 repo の work inbox。
- `/progress/:executionId`: 単一 execution の waiting room。
- `/decisions`: merge / deploy / close / retry queue。

## Authority Boundary

read-only dashboard operation は GO 不要。

以下は GO + real passkey が必要。

- merge
- deploy
- DNS mutation
- credential mutation
- permission mutation
- destructive cleanup
- repository administration
- authority gate を緩める policy change

## v2 からの移行

`vtdd-v2-p` から以下の概念を再利用する。

- passkey approval model
- GitHub App read/write boundary
- VPS runner queue と execution ID
- generated PR body discipline
- runtime truth over memory

Custom GPT Action Schema を primary product surface として継承しない。
