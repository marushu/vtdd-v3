# Issue: chat / execution の realtime 更新

GitHub Issue: #16

## 意図

dashboard を開いたまま、runner progress と chat message が更新される体験を作る。

オーナーが待っている間に「壊れたのか？」と思わず、進捗が流れてくる状態にする。

## 成功条件

- chat detail / progress page が定期 refresh または SSE / WebSocket で更新される。
- 初期 MVP では polling でもよい。
- 初期 MVP では active chat と queued/running/waiting progress page に軽量 refresh を入れる。
- 更新時に scroll / layout が破綻しない。
- failure / blocker / decision waiting が目立つ。
- iPhone で見ても負荷が高すぎない。

## 非ゴール

- 最初から完全な WebSocket streaming。
- raw terminal stream の表示。
- push notification 本実装。

## 検証

- polling または realtime update の browser smoke test。
- progress / chat page に refresh metadata が入る test。
- mobile viewport 確認。
