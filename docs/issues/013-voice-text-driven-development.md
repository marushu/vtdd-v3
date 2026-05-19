# Issue: Voice/Text Driven Development のマイク入力

GitHub Issue: #13

## 意図

Cloudflare dashboard の chat 画面から、音声入力で開発指示を text 化し、VTDD chat / Butler intent / VPS runner へつなげる。

真の意味での VTDD、Voice/Text Driven Development を成立させる。

## 成功条件

- chat detail に mic button を追加する。
- browser speech recognition が使える環境では音声を text input へ入れられる。
- 音声認識結果は即実行せず、確認可能な text として textarea に入る。
- send すると `POST /api/chats/:chatId/messages` に owner message として保存される。
- mic 非対応 browser では手入力へ degrade する。
- deploy / merge / close / credential / DNS は音声だけで実行しない。
- GO + passkey が必要な intent は明示 gate に流す。

## 非ゴール

- Worker 側で音声認識 API を呼ぶこと。
- 音声ファイル保存。
- high-risk action の音声自動実行。
- 完全な自然言語 intent router。

## 検証

- mic UI が chat detail に出る test / live 確認。
- transcript confirmation の UI 確認。
- unsupported browser fallback の確認。
