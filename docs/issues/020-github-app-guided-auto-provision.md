# Issue: GitHub App manifest から repository 用 app / installation を guided auto-provision する

GitHub Issue: #20

## 意図

オーナーが他 repository を指定した時、Butler が必要な GitHub App / installation / permission / secret readiness を確認し、不足していれば GO + passkey 後に GitHub App manifest flow で guided auto-provision できるようにする。

完全無人で GitHub admin mutation を実行するのではなく、VTDD が manifest、permission diff、install target、secret destination、rollback note を生成し、オーナーが GitHub の承認画面と passkey gate を通して安全に作成する。

## 背景

GitHub App Manifest flow は、事前設定済み manifest から GitHub App registration を作成し、webhook secret、private key、client secret、app id を生成できる。GitHub docs によると、manifest flow 完了後、登録者は GitHub App の owner になり、自分の account に install できる。

## 成功条件

- repository readiness が `install_missing` / `permission_missing` / `secret_missing` を検知できる。
- Butler が対象 repository の作業内容から必要 role を選べる: orchestrator read、runner write、reviewer comment、security reviewer optional。
- manifest preview に app name、permissions、events、webhook URL、repository selection、risk、secret destination を表示できる。
- GO + passkey 後に GitHub App manifest flow URL を発行できる。
- GitHub から返る temporary code を Worker が受け取り、manifest conversion で app id / pem / webhook secret / client secret を取得できる。
- secret value は dashboard / logs / RAG に表示しない。
- secret sync は Cloudflare Worker secret / VPS runner secret / GitHub Actions secret などの destination ごとに GO + passkey の後ろに置く。
- 作成後、installation id、repository access、permissions、read/write readiness を確認できる。
- enterprise-owned GitHub App など manifest flow 非対応ケースは `manual_setup_required` として表示する。

## 非ゴール

- GO + passkey なしの GitHub App 作成 / install / permission mutation / secret sync。
- owner 以外の人間 collaborator 追加。
- broad all-repositories install を default にすること。
- private key / client secret / webhook secret の平文保存や表示。
- GitHub admin 画面を完全に bypass すること。

## 検証

- manifest preview が必要 permissions を最小化する test。
- GO + passkey なしでは manifest flow URL が発行されない test。
- manifest callback が secret を redaction して保存 route に渡す test。
- selected repository install が readiness を `read_ready` / `write_ready` に更新する test。
- enterprise / unsupported case が `manual_setup_required` になる test。
