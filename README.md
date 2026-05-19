# VTDD v3

VTDD 用の Cloudflare-native オーケストレーション dashboard。

VTDD v3 は、主作業面を ChatGPT thread history から離し、GitHub truth と VPS Codex CLI runner に支えられた Cloudflare control plane へ移す。

## 目的

- dashboard-first の AI 開発運用。
- 複数 repository / 複数 execution の可視化。
- VPS / local runner を product runner にする。
- GitHub Issues、PRs、checks、comments を durable truth にする。
- 高リスク操作は passkey gate の後ろに置く。
- Custom GPT は optional な conversational entrance であり、source of truth ではない。

## 初期 surface

- `/` と `/orchestrator`: active work dashboard。
- `/progress/:executionId`: 単一 execution の進捗ページ。
- `/repositories/:owner/:repo/chats`: repository ごとの開発チャット。
- `/chats/:chatId`: execution / Issue / PR に紐づく開発チャット。
- `/api/executions`: execution list JSON。
- `/api/executions/:executionId`: execution detail JSON。
- `/api/runner/queue`: VPS runner 用 queue read。
- `/api/runner/claim`: VPS runner 用 claim。

## Roadmap

五月雨で出た v3 構想の実装済み / 未実装一覧は `docs/roadmap/samidare-backlog.md` に固定する。

直近の未実装は dashboard auth、RAG adapter、chat rollover、Voice/Text Driven Development、Butler intent router、VPS 常駐 runner、realtime 更新。

## Issue / PR 言語

Owner-facing の Issue、PR、Issue comment、PR body、docs は日本語を default にする。

API field、phase value、status value、code symbol は runner 契約のため英語のまま残してよい。

## Domain notes

`vtdd.hibou-web.com` は現在 Sakura Internet を向いている。

- A: `163.43.87.169`
- reverse: `www3929.sakura.ne.jp`
- parent DNS は Route 53 nameserver を使っている。

この host を Cloudflare に移すことは DNS/admin mutation なので、実行前に governed approval が必要。

## Safety

Merge、deploy、DNS、credential、permission、destructive action は明示的な GO + passkey approval の後ろに残す。

## Cost Boundary

VTDD v3 は追加 OpenAI API 課金や Codex backend dependency を default にしない。

`OPENAI_API_KEY` / API key billing mode は明示承認、budget cap、dashboard 上の cost risk 表示なしに使わない。
