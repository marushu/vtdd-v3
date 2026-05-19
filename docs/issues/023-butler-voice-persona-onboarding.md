# Issue: Butler voice persona と owner 呼称 onboarding

GitHub Issue: #23

## 意図

Dashboard Butler を単なる入力フォームではなく、音声出力 / テキストのどちらでも応答できる執事長 persona として扱う。

初回は落ち着いた年配の仕事のできる執事長らしい声と文体で挨拶し、owner をどう呼ぶかを確認してから保存する。呼称の聞き間違い / 入力ミスの可能性があるため、音声でもテキストでも確認ステップを挟む。

## 初回スクリプト

> ご主人様、執事長の Butler と申します。ご主人様をなんとお呼びすれば良いでしょうか？

owner が返答したら、Butler は候補を復唱する。

> 承知いたしました。今後は「{呼称}」とお呼びしてよろしいでしょうか？

owner が肯定したら確定する。否定または修正があれば再入力に戻る。

## 成功条件

- Butler profile に persona preset を持てる。
- 初期 persona は `head_butler_elder_calm`。
- 初期呼称は `ご主人様`。
- owner display name / 呼称は dashboard からいつでも変更できる。
- Butler が応答を音声出力できる。
- 音声出力は browser / device の Speech Synthesis を第一候補にする。
- voice preset は「落ち着いた年配の仕事のできる執事長」を目標にし、端末で選べる日本語 voice、rate、pitch で可能な範囲に寄せる。
- 端末 voice で理想声が作れない場合は、外部 TTS を使わず text persona に degrade できる。
- 音声でもテキストでも呼称 onboarding ができる。
- 聞き間違い / 入力ミス対策として、呼称は必ず確認後に保存する。
- 実際の voice engine が未対応の場合は text persona として degrade する。
- 呼称は chat / RAG に無制限保存せず、設定値として保存する。

## 非ゴール

- 特定実在人物の声真似。
- ユーザーの同意なしに本名や個人情報を推定すること。
- 聞き取った呼称の即時自動確定。
- 外部 TTS / OpenAI audio / API key billing を default にすること。
- 特定の声質を端末非依存で保証すること。
- high-risk action を persona 会話だけで承認すること。

## 検証

- 初回 onboarding 文言が表示される test。
- Butler 応答が speech synthesis 可能な場合に speak queue へ入る test。
- 呼称候補が pending のまま保存され、confirm 後に確定する test。
- owner が後から呼称を変更できる test。
- voice output unsupported の場合、text onboarding に degrade する確認。
