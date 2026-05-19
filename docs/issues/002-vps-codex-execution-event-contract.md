# Issue: VPS Codex CLI 進捗イベント契約

## 意図

VPS Codex CLI が Cloudflare dashboard へ進捗を報告できる event contract を定義する。

## 成功条件

- Runner が `queued`, `picked_up`, `codex_starting`, `planning`, `editing_files`, `running_tests`, `pushing_branch`, `creating_pr`, `waiting_review`, `completed`, `failed`, `canceled`, `stale` を送れる。
- Event が `executionId`, repo, issue, branch, phase, current step, 安全な touched files, PR URL, blocker, timestamp を含められる。
- Event は owner-facing 表示に安全な形へ制限される。
- full terminal stream や chain-of-thought を公開しない。

## 非ゴール

- 並列 scheduling policy。
- 通知 delivery。
- retry / cancel control。
