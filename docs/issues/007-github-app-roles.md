# Issue: v3 GitHub App 権限と runner credential

## 意図

Dashboard に standing admin power を持たせず、v2 の role separation model を VTDD v3 に移植する。

## 必要な role

- VTDD v3 Orchestrator read/write app: repository runtime truth 用。
- VTDD VPS Codex CLI app: runner-owned implementation branch と PR 用。
- VTDD reviewer app: reviewer comment と reviewer marker writeback 用。
- 任意の mac Codex app: emergency / local maintenance 用。

## 成功条件

- 必要な GitHub App role と visible bot identity を文書化する。
- role ごとの repository permission を列挙する。
- 必要な Actions secrets / Worker secrets を secret value なしで列挙する。
- app credential が不足している場合は安全に degrade し、dashboard に表示する。
- app installation、permission mutation、secret sync は GO + passkey governed operation のままにする。

## 非ゴール

- 明示的な governed approval なしで GitHub App を作成すること。
- human collaborator の追加。
- owner credential の共有。
