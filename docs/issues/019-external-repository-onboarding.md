# Issue: 外部 repository onboarding と Butler repository read/develop readiness

GitHub Issue: #19

## 意図

VTDD v3 は VTDD 自体の開発だけでなく、オーナーの他 repository を iPhone / iPad から開発するための orchestrator である。

Butler が対象 repository を安全に解決し、GitHub truth を読み、Issue / PR / checks / files の readiness を把握し、VPS / local runner に開発を渡せる状態を作る。

## 成功条件

- dashboard に repository registry / allowlist を持てる。
- repository ごとに `read_ready`, `write_ready`, `runner_ready`, `auth_missing`, `install_missing`, `clone_missing`, `blocked` を表示できる。
- Butler が owner の自然言語 repository nickname / owner/repo / URL から対象 repo を解決できる。
- 未許可 repository は読まない / 実行しない。
- GitHub App installation がない場合、readiness に `install_missing` を表示し、GO + passkey が必要な setup 導線に流す。
- runner workspace に clone がない場合、`clone_missing` として表示し、clone / fetch setup を governed runner setup に流す。
- Issue / PR / checks / branches / default branch / open PR overlap を runtime truth として読める。
- 対象 repo の AGENTS.md / README / package metadata / test command candidates を startup context として読める。
- repository ごとの chat / progress / decision queue / notifications へ接続できる。
- 権限不足や private repo access failure は owner-facing 日本語で短く返す。

## 非ゴール

- owner 以外の人間 collaborator 追加。
- GO + passkey なしの GitHub App install / permission mutation / secret sync。
- 全 repository への default broad access。
- repository 内容の無制限 RAG 保存。

## 検証

- allowed repo は `read_ready` になる test。
- unallowed repo は execution block される test。
- missing install / missing clone が dashboard に出る test。
- repository nickname 解決 test。
- repo ごとの startup context summary test。
