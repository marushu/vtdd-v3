# Issue: Dashboard を対象 GitHub アカウントだけに制限する

GitHub Issue: #10

## 意図

現在の Cloudflare Worker URL は公開 URL なので、VTDD dashboard / chat / execution / search を未認証ユーザーに見せない。

対象 GitHub account / allowed user だけが dashboard を見られる状態にする。

## 成功条件

- dashboard / chats / progress / API は deny-by-default にできる。
- 未認証アクセスは dashboard data を返さない。
- 認証済みユーザーの identity を dashboard に表示できる。
- Cloudflare Access または GitHub OAuth のどちらを primary にするか決める。
- runner API は browser user auth と別の runner token gate を持つ。
- local/dev/test では明示的に auth bypass できる。
- auth 設定不足は dashboard に安全に表示される。

## 非ゴール

- GO + passkey なしの production auth policy 変更。
- GitHub App permission mutation。
- DNS / domain migration。
- secret value の repo への保存。

## 検証

- 未認証 request が 401/403 になる test。
- dev bypass が test で通ること。
- runner token と browser auth が混ざらないこと。
