# v2 / v3 separation

## 現在の方針

VTDD の主系は v3 dashboard / orchestrator に移す。

v2 Worker / operator は、v3 が passkey approval runtime を自前実装するまでの
legacy approval provider としてだけ残す。v2 の dashboard / Custom GPT / deploy
workflow を v3 の通常操作面として使わない。

## v3 の責務

- Cloudflare dashboard / repository hub / chat / notification / execution monitor。
- v3 Worker `vtdd-v3-orchestrator` の deploy workflow。
- v3 Worker origin の passkey operator URL。
- GitHub Actions deploy run の監視と dashboard execution への同期。
- VPS runner queue / claim / event ingestion。

## v2 に一時的に残す責務

- same-origin WebAuthn / passkey approval grant 発行。
- `/v2/retrieve/approval-grant` による短命 approval grant retrieval。

この legacy dependency は v3 に passkey approval runtime を移植したら削除候補にする。

## 禁止する混線

- v2 repository の `deploy-production.yml` で v3 Worker を deploy しない。
- v3 用 `approvalGrant` を v2 repository scope として検証しない。
- v3 dashboard の deploy monitor default を v2 workflow repository にしない。
- v3 deploy 用 passkey URL として v2 Worker origin を案内しない。
- approval grant id、token、secret を v3 chat / notification / RAG に保存しない。

## 削除判断

v2 Worker / Cloudflare resources の削除は以下が満たされてから行う。

- v3 が passkey registration / approval / retrieval を自前で持つ。
- v3 deploy workflow が GO + passkey で成功済み。
- v3 dashboard が deploy run success / failure を拾える。
- v2 にしかない operator capability が残っていない。
- 削除は GO + passkey の destructive operation として実行する。
