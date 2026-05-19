# Issue: vtdd.hibou-web.com の Cloudflare 移行検討

## 意図

`vtdd.hibou-web.com` を VTDD v3 Cloudflare orchestrator へ向けるべきか評価する。

## 現在の DNS truth

- `vtdd.hibou-web.com` の A record は `163.43.87.169`。
- Reverse DNS は `www3929.sakura.ne.jp`。
- WHOIS network は SAKURA Internet Inc.。
- `hibou-web.com` の nameserver は Route 53。
- `https://vtdd.hibou-web.com/` は現在 nginx から HTTP 200 を返す。

## 成功条件

- 現 host の ownership と content を特定する。
- Route 53 CNAME/A record、Cloudflare custom domain、full zone migration のどれを使うか migration plan に明記する。
- rollback plan を文書化する。
- DNS mutation は GO + passkey の後ろに置く。

## 非ゴール

- この Issue 内で DNS を変更すること。
- Sakura-hosted content の削除。
- Cloudflare secret の変更。
