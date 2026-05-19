# Issue: Butler intent router for dashboard chat

GitHub Issue: #14

## 意図

dashboard chat / voice text に書かれた owner intent を、dispatch、runner、Issue 作成、PR 確認、stop / retry / archive、governed operator flow へ振り分ける。

Custom GPT Action Schema に閉じず、Cloudflare dashboard 上の Butler が自由に動ける基盤を作る。

## 成功条件

- chat message から candidate intent を生成できる。
- intent type は `investigate`, `implement`, `review_pr`, `show_progress`, `stop`, `retry`, `create_issue`, `rollover_chat`, `archive_chat`, `merge_request`, `deploy_request` を扱う。
- high-risk intent は実行せず decision queue / passkey gate に送る。
- low-risk intent は dispatch preview / queue record 作成へ進められる。
- intent resolution は chat に記録される。
- owner が iPhone から intent を確認できる。

## 非ゴール

- 自律 merge / deploy / close。
- high-risk policy の緩和。
- model provider の固定。

## 検証

- intent classification の deterministic test。
- high-risk intent が実行されず gate に入る test。
- low-risk implement intent が dispatch preview に変換される test。
