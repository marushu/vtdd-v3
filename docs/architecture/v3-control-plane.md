# VTDD v3 Control Plane

## Thesis

VTDD v3 は ChatGPT thread を operational home として扱わない。durable home は GitHub truth、VPS Codex CLI execution event、明示的な authority gate に支えられた Cloudflare dashboard である。

## Roles

- Cloudflare Worker: dashboard、API route、policy gate、operator page。
- VPS / local runner: shell、GitHub 操作、tests、PR 作成、dashboard event 送信を行う execution runner。
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
- `runnerAuthMode`
- `costMode`

## Owner-Facing Pages

- `/orchestrator`: 複数 repo の work inbox。
- `/progress/:executionId`: 単一 execution の waiting room。
- `/decisions`: merge / deploy / close / retry queue。
- `/repositories/:owner/:repo/chats`: repository ごとの開発チャット一覧。
- `/chats/:chatId`: execution / Issue / PR に紐づく開発チャット。

## Samidare Backlog

五月雨で出た追加構想は `docs/roadmap/samidare-backlog.md` に固定する。

主な未実装 scope は #10 dashboard auth、#11 RAG adapter、#12 chat rollover、#13 Voice/Text Driven Development、#14 Butler intent router、#15 VPS 常駐 runner、#16 realtime 更新。

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

## Cost Boundary

VTDD v3 は追加 OpenAI API 課金や Codex backend dependency を default にしない。

Runner の default は `local_tool_only` または owner が明示的に使っている ChatGPT / Codex plan 枠であり、API key billing mode ではない。

`OPENAI_API_KEY` / API key billing mode を使う場合は、GO + passkey、budget cap、dashboard 上の cost risk 表示を必要とする。

Custom GPT Action Schema を primary product surface として継承しない。
