# Issue: Dashboard から VPS Codex CLI へ dispatch

## 意図

Custom GPT thread を経由せず、Cloudflare dashboard から VPS Codex CLI execution を開始できるようにする。

## 成功条件

- オーナーが repo、Issue、task type を選べる。
- Dispatch が executionId と queue record を作る。
- Dashboard が progress page URL を即時に表示する。
- Dispatch は Worker 上で OpenAI API credit を消費しない。
- 高リスク操作は dispatch で実行されない。

## 非ゴール

- 完全な自然言語 intent parsing。
- merge / deploy / close execution。
- DNS または credential mutation。
