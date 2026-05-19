# Issue: Butler voice persona と owner 呼称 onboarding

GitHub Issue: #23

## 意図

Dashboard Butler を単なる入力フォームではなく、音声 / テキストのどちらでも会話できる執事長 persona として扱う。

初回は落ち着いた年配の仕事のできる執事長らしい声と文体で挨拶し、owner をどう呼ぶかを確認してから保存する。聞き間違いの可能性があるため、音声入力でもテキスト入力でも確認ステップを挟む。

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
- 音声入力でもテキスト入力でも呼称 onboarding ができる。
- 音声認識の聞き間違い対策として、呼称は必ず確認後に保存する。
- voice preset は「落ち着いた年配の仕事のできる執事長」を目標にする。
- 実際の voice engine が未対応の場合は text persona として degrade する。
- 呼称は chat / RAG に無制限保存せず、設定値として保存する。

## 非ゴール

- 特定実在人物の声真似。
- ユーザーの同意なしに本名や個人情報を推定すること。
- 聞き取った呼称の即時自動確定。
- 音声合成 engine の本実装。
- high-risk action を persona 会話だけで承認すること。

## 検証

- 初回 onboarding 文言が表示される test。
- 呼称候補が pending のまま保存され、confirm 後に確定する test。
- owner が後から呼称を変更できる test。
- voice unsupported の場合、text onboarding に degrade する確認。
