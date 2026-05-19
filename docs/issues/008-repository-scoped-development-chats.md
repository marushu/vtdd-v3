# Issue: リポジトリ別の開発チャット

## 意図

ChatGPT アプリのスレッド一覧を探さなくても、VTDD dashboard 上で repository / Issue / PR / execution に紐づいた開発チャットを開けるようにする。

各チャットに `chatId` を発行し、Butler や dashboard が該当開発のチャット URL を返せる状態にする。

## 成功条件

- repository ごとの chat 一覧ページを持てる。
- chatId が発行され、`/chats/:chatId` で開ける。
- chat が repository、Issue、PR、executionId に紐づく。
- dashboard から repository chat 一覧へ移動できる。
- active / pinned / archived / cold transcript を区別できる。
- archived chat は summary-first で表示される。
- raw transcript は通常 UI では目立たせず、必要時にだけ見える。
- `POST /api/chats` で安全な chat record を作成できる。
- secret、token、approval grant、chain-of-thought、raw terminal log を保存しない。

## 非ゴール

- LLM 返信生成。
- ChatGPT 公式スレッドとの同期。
- WebSocket / realtime streaming。
- 課金 / SaaS multi-tenant 化。
- merge / deploy / close の実行。

## 検証

- Worker test で chat 一覧、chat detail、chat 作成 API を確認する。
- deploy 後に dashboard から repository chat へ移動できることを確認する。
