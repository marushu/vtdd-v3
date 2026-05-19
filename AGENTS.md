# AGENTS.md

## Purpose

VTDD v3 は VTDD 開発作業の Cloudflare-native orchestrator です。

Product goal は、オーナーが ChatGPT thread history を source of truth にせず、iPhone / iPad から複数 GitHub repository、VPS Codex CLI execution、PR、checks、reviewer signal、人間の判断 queue を管理できるようにすることです。

## Core Rules

- GitHub runtime truth は memory より強い。
- ChatGPT thread は optional な conversation surface であり、execution truth ではない。
- Cloudflare dashboard が owner-facing home。
- VPS / local runner が execution runner。Codex CLI を使う場合でも、追加 OpenAI API 課金や Codex backend 依存を前提にしない。
- GitHub Issues / PRs / checks / comments が durable work record。
- VTDD v3 は VTDD repo 自体だけでなく、owner の他 repository を開発するための orchestrator である。
- Butler は repository registry / allowlist / GitHub App installation / runner clone readiness を確認してから他 repository を読む、または実行する。
- 未許可 repository、GitHub App 未install、runner clone 未準備の repository は実行せず、readiness gap として dashboard に表示する。
- GitHub App 作成 / install / permission mutation / secret sync は guided auto-provision として扱い、GO + passkey と GitHub owner/admin の承認画面なしに実行しない。
- GitHub App private key、client secret、webhook secret は dashboard / logs / RAG に表示しない。
- `OPENAI_API_KEY` / API-key billing mode は default 禁止。明示承認なしに runner へ渡さない。
- runner auth mode は dashboard に `browser_chatgpt`, `chatgpt_codex_cli`, `api_key`, `local_tool_only`, `unknown` として表示できるようにする。
- 高リスク操作には明示的な GO + real passkey が必要。
- governed approval なしに DNS、credential、permission、repository settings、deploy、destructive resource を変更しない。
- オーナーの「一任」は bounded delegated session として扱い、scope / expiry / allowed actions / excluded high-risk actions を見える状態にする。
- 音声 GO は owner intent として受け取ってよいが、high-risk action は real passkey または既存の短命 approval grant がなければ実行しない。
- 音声会話中の high-risk action は compact approval sheet を表示し、「GO + passkey」ボタン押下を WebAuthn / passkey ceremony の user gesture として使ってよい。
- passkey cancel / timeout / scope mismatch は action を実行せず、decision queue に戻す。
- 運転中や hands-free 利用では、high-risk action の実行ではなく decision queue / 後続確認へ送る。
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

## Parallel Execution Boundary

Issue: #17

VPS / local runner は複数 execution を扱える前提で設計する。ただし同一 repository の並行開発は Butler / dashboard scheduler が conflict risk を判定してから runner に渡す。

新しい開発 intent が来たら、まず以下に分類する。

- `parallel_safe`: repository は同じでも Issue / branch / write set が分離できるため並行 dispatch 可能。
- `queue_required`: 同一 branch、同一 Issue、同一 touched file、または open PR overlap があり、順番待ちが必要。
- `dry_run_required`: write set が不明なため、planning-only / dry-run runner で衝突可能性を調べる。
- `human_decision_required`: scope conflict、authority conflict、または high-risk action が含まれる。

Butler は owner のアイデアを止めない。すぐ execution できない場合でも chat / idea record を保存し、owner-facing 日本語で「キューに入れました」「先に dry-run します」「この2件は同時実行できません」を返す。

同一 repository で複数 execution を走らせる場合は、別 branch / 別 worktree / 明示 write ownership を使う。main 直編集や同一 branch の複数 runner 書き込みは禁止。
