# AGENTS.md

## Purpose

VTDD v3 is the Cloudflare-native orchestrator for VTDD development work.

The product goal is to let the owner manage multiple GitHub repositories,
VPS Codex CLI executions, PRs, checks, reviewer signals, and human decision
queues from iPhone/iPad without relying on ChatGPT thread history as the source
of truth.

## Core Rules

- GitHub runtime truth beats memory.
- ChatGPT threads are optional conversation surfaces, not execution truth.
- Cloudflare dashboard is the owner-facing home.
- VPS Codex CLI is the execution runner.
- GitHub Issues / PRs / checks / comments are durable work records.
- High-risk actions require explicit GO + real passkey.
- Never mutate DNS, credentials, permissions, repository settings, deploys, or
  destructive resources without governed approval.
- Do not expose chain-of-thought, full terminal logs, secrets, tokens, approval
  grant values, or raw sensitive material in dashboards.

## Completion Boundary

A v3 feature is complete only when:

- the dashboard can expose it,
- the runner or GitHub truth can update it,
- the owner can recover from iPhone/iPad,
- authority boundaries are visible,
- tests or live evidence prove the workflow.

## Development Style

- Prefer small Cloudflare Worker routes and explicit JSON contracts.
- Keep the first dashboard MVP dependency-light.
- Add React or a richer frontend only when the route/API contracts are stable.
- Make every long-running execution addressable by `executionId`.
- Every execution card should show status, phase, branch, PR URL if known,
  blocker if any, last update, and next human action.
