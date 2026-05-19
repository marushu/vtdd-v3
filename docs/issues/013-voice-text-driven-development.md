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
- mic mode 開始時に可能なら Screen Wake Lock を取得し、マイク終了時に解放する。
- Wake Lock が未対応 / 拒否 / visibility change で解除された場合、状態を画面に表示して owner が気づける。
- iPhone 運転中利用を想定し、画面注視を前提にしない voice-first feedback を持つ。
- Butler voice persona / 呼称 onboarding は #23 に従い、Butler 応答の音声出力とテキスト表示の両方で扱う。
- deploy / merge / close / credential / DNS は音声だけで実行しない。
- GO + passkey が必要な intent は、音声会話中でも compact approval sheet に流す。
- compact approval sheet は action kind、repository、Issue / PR、risk、evidence summary、expiresAt を短く表示する。
- compact approval sheet には「GO + passkey」ボタンと「あとで判断」ボタンを出せる。
- 「GO + passkey」ボタン押下を WebAuthn / passkey ceremony の user gesture として使える。
- passkey success 後は短命 approval grant を作り、該当 action だけに scope する。
- passkey failure / cancel / timeout は安全に decision queue へ戻す。

## 非ゴール

- Worker 側で音声認識 API を呼ぶこと。
- 音声ファイル保存。
- high-risk action の音声自動実行。
- 完全な自然言語 intent router。
- 画面ロック後の background recording 保証。
- iOS / browser の OS 制約を超える sleep 制御。
- passkey 成功後の scope 外 high-risk action 実行。

## 検証

- mic UI が chat detail に出る test / live 確認。
- transcript confirmation の UI 確認。
- unsupported browser fallback の確認。
- Wake Lock supported / unsupported の UI state 確認。
- mic stop / page hidden / navigation で Wake Lock が解放される確認。
- compact approval sheet が high-risk intent で表示される確認。
- passkey cancel / timeout が action 実行せず decision queue に戻る test。
- approval grant が action kind / repository / Issue / PR に scope される test。
