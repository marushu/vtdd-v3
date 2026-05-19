# Issue: Evaluate vtdd.hibou-web.com migration to Cloudflare

## Intent

Evaluate whether `vtdd.hibou-web.com` should point to the VTDD v3 Cloudflare
orchestrator.

## Current DNS Truth

- `vtdd.hibou-web.com` A record resolves to `163.43.87.169`.
- Reverse DNS: `www3929.sakura.ne.jp`.
- WHOIS network: SAKURA Internet Inc.
- `hibou-web.com` nameservers are Route 53 nameservers.
- `https://vtdd.hibou-web.com/` currently returns HTTP 200 from nginx.

## Success Criteria

- Current host ownership and content are identified.
- Migration plan names whether to use Route 53 CNAME/A record, Cloudflare
  custom domain, or full zone migration.
- Rollback plan is documented.
- DNS mutation is gated by GO + passkey.

## Non-goals

- Changing DNS in this Issue.
- Deleting Sakura-hosted content.
- Changing Cloudflare secrets.
