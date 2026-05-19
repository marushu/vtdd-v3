# Issue: Codex Security を reviewer signal として取り込む

GitHub Issue: #18

## 意図

Codex Security を VTDD v3 の security reviewer signal として扱い、GitHub repository に対する vulnerability finding / validation / proposed patch / PR を dashboard と decision queue に取り込めるようにする。

Codex Security 本体を VTDD runner 内に再実装するのではなく、OpenAI / ChatGPT 側で repository に接続された Codex Security の結果を、GitHub truth と owner decision flow に接続する。

## 背景

OpenAI Help Center によると、Codex Security は research preview で、GitHub repository に直接接続し、repository 固有の threat model を作り、vulnerability を identify / validate / remediate し、patch suggestion を human review に出す。

## 成功条件

- dashboard が repository ごとに Codex Security status を表示できる。
- Codex Security finding を `security_review`, `validated_vulnerability`, `proposed_patch`, `needs_owner_review` として表現できる。
- Codex Security が作った PR / patch suggestion がある場合、PR link と evidence summary を decision queue に出せる。
- Security finding は merge 前 blocker / warning として PR review flow に入る。
- Codex Security が未接続 / 権限不足 / plan 不足の場合、dashboard がその状態を明示できる。
- Codex Security が有料 / plan 外 / quota reached の場合、VTDD は使えない reviewer として扱い、勝手に有料 mode へ進まない。
- status は `security_not_connected`, `plan_limited`, `quota_reached`, `enabled`, `unknown` を扱える。
- 追加 OpenAI API 課金を default にしない。Codex Security 利用は ChatGPT / Codex workspace 側の plan / access に従う。
- secret、raw exploit details、sensitive validation logs を dashboard / RAG に保存しない。

## 非ゴール

- Codex Security 本体の再実装。
- OpenAI API key で vulnerability scanner を自前実行すること。
- Codex Security enablement や GitHub repository permission mutation を GO + passkey なしに実行すること。
- 有料 Codex Security / API fallback の自動利用。
- validated exploit details の全文保存。

## 検証

- 未接続 repo が `security_not_connected` と表示される test。
- plan 外 / quota reached が reviewer unavailable として表示される test。
- finding summary が decision queue に出る test。
- proposed patch PR link が dashboard に出る test。
- sensitive validation details が保存されない test。
