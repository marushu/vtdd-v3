# Issue: VPS Codex CLI の返事を開発チャットへ返す

## 意図

Cloudflare dashboard の開発チャットを、VPS Codex CLI と会話できる場所にする。

オーナーが repository / Issue / execution に紐づいたチャットで指示し、VPS runner が実行中の返事・進捗・blocker・完了報告を該当チャットへ返せるようにする。

## 成功条件

- chat detail から message を追加できる。
- `POST /api/chats/:chatId/messages` で安全な message を append できる。
- `GET /api/chats` が repository / issueNumber / executionId / q で絞り込める。
- VPS runner が executionId に紐づく chat を探し、runner message を返せる。
- runner の返事は raw terminal log や chain-of-thought を含まない。
- chat detail は時系列昇順、chat 一覧と検索結果は updatedAt 降順で表示する。
- 横断検索 API で全 chat から該当開発を検索できる。

## 非ゴール

- realtime WebSocket streaming。
- LLM 返信を Cloudflare Worker で生成すること。
- raw terminal transcript の保存。
- ChatGPT 公式 thread との双方向同期。
- merge / deploy / close 実行。

## 検証

- Worker test で message append、chat filtering、横断検索を確認する。
- runner test で dry-run message が該当 chat へ返ることを確認する。
