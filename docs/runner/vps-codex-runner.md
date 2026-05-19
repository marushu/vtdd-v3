# VPS Codex Runner

Issue: #5

この runner は、Cloudflare dashboard の queue と VPS Codex CLI execution をつなぐ最初の bridge です。

## Dashboard flow

1. オーナーが `POST /api/dispatch` で安全な task を投げる。
2. Worker が Cloudflare KV に queued execution を作る。
3. VPS runner が `GET /api/runner/queue?limit=1` を呼ぶ。
4. VPS runner が `POST /api/runner/claim` で execution を claim する。
5. VPS runner が `POST /api/execution-events` で進捗を報告する。

## local dry-run

```sh
VTDD_ORCHESTRATOR_URL=https://vtdd-v3-orchestrator.polished-tree-da7c.workers.dev \
npm run runner:once
```

dry-run が default です。Codex CLI を起動せず、queued execution の claim と安全な progress event の送信だけを確認します。

## 実 Codex CLI execution

```sh
VTDD_ORCHESTRATOR_URL=https://vtdd-v3-orchestrator.polished-tree-da7c.workers.dev \
VTDD_WORKSPACE_ROOT=/home/vtdd/workspaces \
VTDD_RUNNER_EXECUTE=1 \
npm run runner:once
```

Runner は意図的に merge、deploy、Issue close、credential mutation、DNS change を実行しません。これらは owner-governed dashboard decision のままです。

## safety boundary

- raw terminal stream を Cloudflare へ送らない。
- chain-of-thought を Cloudflare へ送らない。
- failure report は exit code と短い blocker に留める。
- high-risk dispatch type は runner pickup 前に Worker が拒否する。
