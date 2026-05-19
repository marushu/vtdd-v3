# Issue: VPS 常駐 runner と token gate

GitHub Issue: #15

## 意図

VPS Codex CLI を product runner として常駐化し、Cloudflare dashboard の queue / chat と安全に接続する。

Mac Codex ではなく VPS runner が通常の実行面になる状態を作る。

## 成功条件

- VPS runner が定期的に queue を poll できる。
- runner token gate があり、未認証 runner は queue / claim / message append できない。
- systemd などの常駐方法を文書化する。
- runner は raw terminal log / chain-of-thought を dashboard に送らない。
- runner は PR URL / blocker / summary / next action を chat と progress に返す。
- failure / stale / hung を dashboard に表示できる。

## 非ゴール

- token / secret の repo への保存。
- GO + passkey なしの credential mutation。
- merge / deploy / close の runner 自動実行。

## 検証

- local dry-run runner test。
- token required route test。
- VPS 上の manual smoke test。
