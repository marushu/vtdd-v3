# Issue: VPS 常駐 runner と token gate

GitHub Issue: #15

## 意図

VPS runner を product runner として常駐化し、Cloudflare dashboard の queue / chat と安全に接続する。

Mac Codex ではなく VPS runner が通常の実行面になる状態を作る。

Codex CLI を使う場合でも、追加 OpenAI API 課金や Codex backend 依存を default にしない。まずは GitHub 操作、shell、test、PR 作成、dashboard event 送信を runner の中核とし、LLM 呼び出しは auth mode / cost mode を明示した時だけ扱う。

## 成功条件

- VPS runner が定期的に queue を poll できる。
- runner token gate があり、未認証 runner は queue / claim / message append できない。
- runner auth mode を `browser_chatgpt`, `chatgpt_codex_cli`, `api_key`, `local_tool_only`, `unknown` として報告できる。
- default は `local_tool_only` または owner の既存 ChatGPT / Codex plan 枠であり、API key billing mode ではない。
- `OPENAI_API_KEY` が runner 環境に存在する場合、明示許可なしには停止または警告できる。
- API key billing mode は GO + passkey と budget cap がない限り使わない。
- dashboard に runner auth mode / cost risk / budget guard state を表示できる。
- systemd などの常駐方法を文書化する。
- runner は raw terminal log / chain-of-thought を dashboard に送らない。
- runner は PR URL / blocker / summary / next action を chat と progress に返す。
- failure / stale / hung を dashboard に表示できる。

## 非ゴール

- token / secret の repo への保存。
- GO + passkey なしの credential mutation。
- 明示許可なしの OpenAI API key 利用。
- OpenAI / Codex backend を必須 dependency として設計すること。
- merge / deploy / close の runner 自動実行。

## 検証

- local dry-run runner test。
- token required route test。
- `OPENAI_API_KEY` 存在時に default 実行が止まる / 警告される test。
- runner auth mode が dashboard event に含まれる test。
- VPS 上の manual smoke test。
