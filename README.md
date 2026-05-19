# VTDD v3

Cloudflare-native orchestration dashboard for VTDD.

VTDD v3 moves the primary work surface away from ChatGPT thread history and
toward a durable Cloudflare control plane backed by GitHub truth and the VPS
Codex CLI runner.

## Goal

- Dashboard-first AI development operations.
- Multi-repository and multi-execution visibility.
- VPS Codex CLI as the product runner.
- GitHub Issues, PRs, checks, and comments as durable truth.
- Passkey-gated high-risk actions.
- Custom GPT as an optional conversational entrance, not the source of truth.

## Initial Surfaces

- `/` and `/orchestrator`: active work dashboard.
- `/progress/:executionId`: single execution progress page.
- `/api/executions`: execution list JSON.
- `/api/executions/:executionId`: execution detail JSON.

## Domain Notes

`vtdd.hibou-web.com` currently resolves to Sakura Internet:

- A: `163.43.87.169`
- reverse: `www3929.sakura.ne.jp`
- parent DNS appears to use Route 53 nameservers.

Moving this host to Cloudflare is a DNS/admin mutation and requires governed
approval before execution.

## Safety

This repo starts with read/display surfaces only. Merge, deploy, DNS,
credential, permission, and destructive actions must remain behind explicit
GO + passkey approval.
