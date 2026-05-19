# Epic: VTDD v3 Cloudflare オーケストレーターダッシュボード

## 意図

VTDD の主作業場になる Cloudflare dashboard を作る。

オーナーが「どの ChatGPT スレッドだったか」を探さなくても、何が実行中で、何が詰まり、何が完了し、何が review / GO 待ちか分かる状態にする。

## 成功条件

- `/orchestrator` が active / completed execution を一覧できる。
- 各 execution に安定した `/progress/:executionId` ページがある。
- Dashboard card が repo、Issue、branch、phase、progress、PR URL、blocker、last update、next human action を表示する。
- 複数 repository の work を同じ dashboard で扱える。
- secret、approval grant、raw log、chain-of-thought を表示しない。
- 高リスク操作は silent action ではなく、governed operator flow への導線として表示する。

## 非ゴール

- 初期 slice で自然言語 Butler を完全代替すること。
- `vtdd.hibou-web.com` の DNS 移行。
- hosted SaaS billing。
- 自動 merge / deploy / close。

## 検証

- Worker route と API JSON の test。
- deploy 後の desktop / iPhone viewport での目視確認。
