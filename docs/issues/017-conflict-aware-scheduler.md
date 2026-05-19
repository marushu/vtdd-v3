# Issue: 同一 repository 並行開発の conflict-aware scheduler

GitHub Issue: #17

## 意図

オーナーのアイデアを止めず、同じ repository に複数の開発指示が来ても Butler が衝突リスクを判断し、実行可能なものは VPS Codex CLI へ並行 dispatch、危ないものは queue / dry-run / scope split に回せるようにする。

「1つずつ待つ」体験をなくしつつ、同一ファイル・同一 Issue・同一 branch の衝突で PR が壊れないようにする。

## 成功条件

- repository ごとに active execution / branch / touched files / claimed Issue を一覧できる。
- 新しい開発 intent が来た時、Butler が `parallel_safe`, `queue_required`, `dry_run_required`, `human_decision_required` を判定できる。
- 同一 repository でも write set が分離できる場合は別 branch / 別 worktree で並行 dispatch できる。
- write set が不明な場合は探索 dry-run / planning-only runner を先に走らせられる。
- 衝突リスクが高い場合、Butler は「キューに入れました」「先に dry-run します」「この2件は同時実行不可」を owner-facing 日本語で返す。
- dashboard に repository-level lane / queue / blocked reason を表示する。
- PR 作成前に base branch drift / touched file overlap / open PR overlap を確認する。
- queue されても chat / idea record は即保存され、オーナーのアイデアは止まらない。

## 非ゴール

- conflict を無視した同一 branch 直接編集。
- 自動 merge conflict 解消の全面実装。
- merge / deploy / credential / DNS の自律実行。
- GO + passkey なしの authority gate 緩和。

## 検証

- 2つの別ファイル task が `parallel_safe` になる test。
- 同一ファイル task が `queue_required` になる test。
- write set unknown task が `dry_run_required` になる test。
- dashboard に repo queue / reason が表示される browser smoke test。
