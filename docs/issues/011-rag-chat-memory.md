# Issue: 既存 RAG に開発チャットを保存・検索できるようにする

GitHub Issue: #11

## 意図

これまで使ってきた VTDD RAG / memory を捨てず、v3 の chat / message / summary / decision / unresolved を安全な単位で投入できるようにする。

Chat が複数スレにまたがっても、該当開発が少しでも入っていれば検索結果に出る状態にする。

## 成功条件

- chat record から RAG 用 memory candidate を生成できる。
- message 単体ではなく、summary / decision / unresolved / evidence を優先保存する。
- full transcript を default で RAG に保存しない。
- repository / Issue / PR / executionId / chatId / parentChatId を metadata として持つ。
- `GET /api/chats/search` と RAG search の役割境界を文書化する。
- 既存 RAG endpoint / storage へ adapter できる interface を作る。
- secret、token、approval grant、raw terminal log、chain-of-thought は投入しない。

## 非ゴール

- vector DB の新規選定。
- 既存 RAG credential の変更。
- full transcript 保存。
- 認可なしの外部 RAG 書き込み。

## 検証

- memory candidate 生成 test。
- unsafe field が candidate に入らない test。
- chatId / executionId / Issue metadata が残る test。
