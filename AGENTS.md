# AGENTS.md

## Purpose

VTDD v3 は VTDD 開発作業の Cloudflare-native orchestrator です。

Product goal は、オーナーが ChatGPT thread history を source of truth にせず、iPhone / iPad から複数 GitHub repository、VPS Codex CLI execution、PR、checks、reviewer signal、人間の判断 queue を管理できるようにすることです。

## Core Rules

- GitHub runtime truth は memory より強い。
- ChatGPT thread は optional な conversation surface であり、execution truth ではない。
- Cloudflare dashboard が owner-facing home。
- VPS Codex CLI が execution runner。
- GitHub Issues / PRs / checks / comments が durable work record。
- 高リスク操作には明示的な GO + real passkey が必要。
- governed approval なしに DNS、credential、permission、repository settings、deploy、destructive resource を変更しない。
- dashboard に chain-of-thought、full terminal logs、secrets、tokens、approval grant values、raw sensitive material を出さない。

## 日本語運用ルール

- Owner-facing の Issue title / Issue body / Issue comment / PR title / PR body / review response / docs は日本語を default にする。
- API field、route、phase/status enum、code symbol、test identifier は runner 契約または実装都合として英語のままでよい。
- PR body は Issue の成功条件、変更内容、検証、残りリスクを日本語で対応づける。
- 英語で Issue / PR を作ってしまった場合は、実装より先に日本語へ戻す。

## Completion Boundary

v3 feature は以下を満たしたときだけ complete と扱う。

- dashboard がその機能を expose できる。
- runner または GitHub truth がその状態を update できる。
- オーナーが iPhone / iPad から recover できる。
- authority boundary が見える。
- test または live evidence が workflow を証明している。

## Development Style

- 小さな Cloudflare Worker route と明示的な JSON contract を優先する。
- 最初の dashboard MVP は dependency-light に保つ。
- React などの rich frontend は route / API contract が安定してから追加する。
- long-running execution は必ず `executionId` で addressable にする。
- execution card は status、phase、branch、PR URL、blocker、last update、next human action を表示する。
