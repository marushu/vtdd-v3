import test from "node:test";
import assert from "node:assert/strict";
import worker, { passkeyCredentialValueToBase64Url } from "../src/worker.js";

function createMemoryStore() {
  const map = new Map();
  return {
    async get(key) {
      return map.get(key) ?? null;
    },
    async put(key, value) {
      map.set(key, value);
    }
  };
}

test("health returns service identity", async () => {
  const response = await worker.fetch(new Request("https://example.com/health"), {
    VTDD_V3_MODE: "test"
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.service, "vtdd-v3-orchestrator");
  assert.equal(body.mode, "test");
});

test("orchestrator dashboard renders React PWA shell", async () => {
  const response = await worker.fetch(new Request("https://example.com/orchestrator"), {
    VTDD_V3_MODE: "test"
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  const html = await response.text();
  assert.equal(html.includes('id="root"'), true);
  assert.equal(html.includes("/manifest.webmanifest"), true);
  assert.equal(html.includes("/assets/"), true);

  const api = await worker.fetch(new Request("https://example.com/api/executions"), {
    VTDD_V3_MODE: "test"
  });
  const body = await api.json();
  assert.equal(body.executions.some((execution) => execution.executionId === "remote-codex-issue426-1f5bdj"), true);
});

test("React dashboard does not auto refresh while owner is typing or using voice", async () => {
  const response = await worker.fetch(new Request("https://example.com/orchestrator"), {
    VTDD_V3_MODE: "test"
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.equal(html.includes("setInterval"), false);
  assert.equal(html.includes("12 秒ごとに自動更新"), false);
  const assetPath = html.match(/src="([^"]+\.js)"/)?.[1];
  assert.ok(assetPath);
  const asset = await worker.fetch(new Request(`https://example.com${assetPath}`), {
    VTDD_V3_MODE: "test"
  });
  const js = await asset.text();
  assert.equal(js.includes("setInterval"), false);
  assert.equal(js.includes("12 秒ごとに自動更新"), false);
  assert.equal(js.includes("最新状態を取得"), true);
  assert.equal(js.includes("GitHub Actions / VPS runner event"), true);
});

test("progress page is addressable by executionId", async () => {
  const response = await worker.fetch(
    new Request("https://example.com/progress/remote-codex-issue426-1f5bdj"),
    { VTDD_V3_MODE: "test" }
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.equal(html.includes("Butler 初動応答の高速化"), true);
  assert.equal(html.includes("ファイル編集中"), true);
  assert.equal(html.includes("https://github.com/marushu/vtdd-v2-p"), true);
  assert.equal(html.includes("https://github.com/marushu/vtdd-v2-p/issues/426"), true);
});

test("execution list API returns durable JSON shape", async () => {
  const response = await worker.fetch(new Request("https://example.com/api/executions"), {
    VTDD_V3_MODE: "test"
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(Array.isArray(body.executions), true);
  assert.equal(body.executions[0].executionId, "remote-codex-issue426-1f5bdj");
});

test("decision queue page and API expose human gates", async () => {
  const page = await worker.fetch(new Request("https://example.com/decisions"), {
    VTDD_V3_MODE: "test"
  });
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.equal(html.includes('id="root"'), true);
  assert.equal(html.includes("/manifest.webmanifest"), true);

  const response = await worker.fetch(new Request("https://example.com/api/decisions"), {
    VTDD_V3_MODE: "test"
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.decisions.some((item) => item.authority === "GO + real passkey"), true);
  assert.equal(body.decisions.some((item) => item.repository === "marushu/vtdd-v2-p"), true);
});

test("notifications page and API expose owner signals", async () => {
  const page = await worker.fetch(new Request("https://example.com/notifications"), {
    VTDD_V3_MODE: "test"
  });
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.equal(html.includes("通知"), true);
  assert.equal(html.includes("PR は merge 済み"), true);

  const response = await worker.fetch(new Request("https://example.com/api/notifications"), {
    VTDD_V3_MODE: "test"
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.notifications.length > 0, true);
  assert.equal(body.notifications.some((item) => item.eventType === "human_decision_ready"), true);
});

test("deploy monitor syncs GitHub Actions run into dashboard execution", async () => {
  const fixture = JSON.stringify({
    id: 26085856370,
    status: "completed",
    conclusion: "failure",
    head_branch: "main",
    display_title: "deploy-production",
    html_url: "https://github.com/marushu/vtdd-v2-p/actions/runs/26085856370",
    created_at: "2026-05-19T08:33:39Z",
    updated_at: "2026-05-19T08:33:56Z"
  });
  const env = {
    VTDD_V3_MODE: "test",
    EXECUTION_STORE: createMemoryStore(),
    GITHUB_DEPLOY_RUNS_FIXTURE: fixture
  };

  const page = await worker.fetch(new Request("https://example.com/deploys"), env);
  assert.equal(page.status, 200);
  const pageHtml = await page.text();
  assert.equal(pageHtml.includes('id="root"'), true);
  assert.equal(pageHtml.includes("/manifest.webmanifest"), true);

  const list = await worker.fetch(
    new Request("https://example.com/api/github/deploy-runs?targetRepository=marushu%2Fvtdd-v3&workflowRepository=marushu%2Fvtdd-v2-p"),
    env
  );
  assert.equal(list.status, 200);
  const listBody = await list.json();
  assert.equal(listBody.runs[0].targetRepository, "marushu/vtdd-v3");
  assert.equal(listBody.runs[0].workflowRepository, "marushu/vtdd-v2-p");

  const synced = await worker.fetch(
    new Request("https://example.com/api/github/deploy-run-sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        targetRepository: "marushu/vtdd-v3",
        workflowRepository: "marushu/vtdd-v2-p",
        workflow: "deploy-production.yml",
        runId: "26085856370"
      })
    }),
    env
  );
  assert.equal(synced.status, 201);
  const body = await synced.json();
  assert.equal(body.execution.repository, "marushu/vtdd-v3");
  assert.equal(body.execution.workflowRepository, "marushu/vtdd-v2-p");
  assert.equal(body.execution.status, "failed");
  assert.equal(body.execution.nextHumanAction, "investigate");
  assert.equal(body.runUrl, "https://github.com/marushu/vtdd-v2-p/actions/runs/26085856370");

  const notifications = await worker.fetch(new Request("https://example.com/api/notifications"), env);
  const notificationBody = await notifications.json();
  assert.equal(notificationBody.notifications.some((item) => item.eventType === "deploy_failed"), true);
});

test("v3 deploy workflow and approval validation keep v2/v3 scopes separate", async () => {
  const fs = await import("node:fs/promises");
  const workflow = await fs.readFile(".github/workflows/deploy-production.yml", "utf8");
  const separationDoc = await fs.readFile("docs/architecture/v2-v3-separation.md", "utf8");
  const { validateDeployApprovalGrant } = await import("../scripts/validate-deploy-approval-grant.mjs");

  assert.equal(workflow.includes("target_repository"), true);
  assert.equal(workflow.includes("target_repository must match this v3 repository."), true);
  assert.equal(workflow.includes("--repository \"${{ github.event.inputs.target_repository }}\""), true);
  assert.equal(workflow.includes("wrangler-action@v4"), true);
  assert.equal(workflow.includes("VTDD_GATEWAY_BEARER_TOKEN"), false);
  assert.equal(separationDoc.includes("v3 は passkey approval runtime を自前で持つ"), true);
  assert.equal(separationDoc.includes("v2 repository の `deploy-production.yml` で v3 Worker を deploy しない"), true);

  const approvalGrant = {
    verified: true,
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    scope: {
      actionType: "deploy_production",
      highRiskKind: "deploy_production",
      repositoryInput: "marushu/vtdd-v3"
    }
  };
  assert.equal(validateDeployApprovalGrant({ approvalGrant, repositoryInput: "marushu/vtdd-v3" }).ok, true);
  const wrongScope = validateDeployApprovalGrant({ approvalGrant, repositoryInput: "marushu/vtdd-v2-p" });
  assert.equal(wrongScope.ok, false);
  assert.equal(wrongScope.issues.includes("approvalGrant scope.repositoryInput must match target repo"), true);
});

test("v3 passkey operator URL is same-origin and exposes real runtime endpoints", async () => {
  const response = await worker.fetch(
    new Request("https://example.com/approval/passkey/operator?repositoryInput=marushu%2Fvtdd-v3&phase=execution&actionType=deploy_production&highRiskKind=deploy_production&issueNumber=6"),
    { VTDD_V3_MODE: "test", EXECUTION_STORE: createMemoryStore() }
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.equal(html.includes("v3 passkey operator"), true);
  assert.equal(html.includes("marushu/vtdd-v3"), true);
  assert.equal(html.includes("deploy_production"), true);
  assert.equal(html.includes("GO + passkey 承認"), true);
  assert.equal(html.includes("/api/approval/passkey/register/options"), true);
  assert.equal(html.includes("vtdd-v2-mvp.polished-tree-da7c.workers.dev"), false);

  const status = await worker.fetch(new Request("https://example.com/api/approval/passkey/status"), {
    VTDD_V3_MODE: "test", EXECUTION_STORE: createMemoryStore()
  });
  assert.equal(status.status, 200);
  const body = await status.json();
  assert.equal(body.provider, "vtdd-v3");
  assert.equal(body.passkeyRuntimeImplemented, true);
});

test("v3 passkey runtime creates registration options and blocks approval before registration", async () => {
  const env = { VTDD_V3_MODE: "test", EXECUTION_STORE: createMemoryStore() };
  const registration = await worker.fetch(
    new Request("https://example.com/api/approval/passkey/register/options", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ operatorId: "owner", operatorLabel: "Owner" })
    }),
    env
  );
  assert.equal(registration.status, 201);
  const registrationBody = await registration.json();
  assert.equal(registrationBody.ok, true);
  assert.equal(registrationBody.options.rp.id, "example.com");
  assert.equal(registrationBody.options.rp.name, "VTDD v3");
  assert.equal(typeof registrationBody.sessionId, "string");

  const approval = await worker.fetch(
    new Request("https://example.com/api/approval/passkey/challenge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scope: {
          actionType: "deploy_production",
          highRiskKind: "deploy_production",
          repositoryInput: "marushu/vtdd-v3",
          phase: "execution"
        }
      })
    }),
    env
  );
  assert.equal(approval.status, 409);
  assert.equal((await approval.json()).error, "passkey_not_registered");
});

test("passkey credential persistence keeps string credential ids", () => {
  assert.equal(passkeyCredentialValueToBase64Url("credential-id-from-simplewebauthn"), "credential-id-from-simplewebauthn");
  assert.equal(passkeyCredentialValueToBase64Url(new Uint8Array([1, 2, 3, 254])), "AQID_g");
  assert.equal(passkeyCredentialValueToBase64Url(""), "");
});

test("notification settings default to all events and can filter known event types", async () => {
  const env = { VTDD_V3_MODE: "test", EXECUTION_STORE: createMemoryStore() };
  const settingsPage = await worker.fetch(new Request("https://example.com/notifications/settings"), env);
  assert.equal(settingsPage.status, 200);
  const html = await settingsPage.text();
  assert.equal(html.includes('id="root"'), true);
  assert.equal(html.includes("/manifest.webmanifest"), true);

  const initial = await worker.fetch(new Request("https://example.com/api/notifications/settings"), env);
  const initialBody = await initial.json();
  assert.equal(initialBody.settings.mode, "all");
  assert.equal(initialBody.eventTypes.some((event) => event.key === "runner_event"), true);

  const saved = await worker.fetch(
    new Request("https://example.com/api/notifications/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "selected",
        events: ["human_decision_ready"]
      })
    }),
    env
  );
  assert.equal(saved.status, 200);
  const savedBody = await saved.json();
  assert.deepEqual(savedBody.settings.enabledEvents, ["human_decision_ready"]);

  const filtered = await worker.fetch(new Request("https://example.com/api/notifications"), env);
  const filteredBody = await filtered.json();
  assert.equal(filteredBody.notifications.every((item) => item.eventType === "human_decision_ready"), true);
});

test("PWA manifest and service worker are served without API stale-cache policy", async () => {
  const manifest = await worker.fetch(new Request("https://example.com/manifest.webmanifest"), {
    VTDD_V3_MODE: "test"
  });
  assert.equal(manifest.status, 200);
  assert.match(manifest.headers.get("content-type"), /application\/manifest\+json/);
  const manifestBody = await manifest.json();
  assert.equal(manifestBody.name, "VTDD Butler");
  assert.equal(manifestBody.display, "standalone");
  assert.equal(manifestBody.start_url, "/orchestrator");

  const serviceWorker = await worker.fetch(new Request("https://example.com/service-worker.js"), {
    VTDD_V3_MODE: "test"
  });
  assert.equal(serviceWorker.status, 200);
  assert.match(serviceWorker.headers.get("content-type"), /text\/javascript/);
  const js = await serviceWorker.text();
  assert.equal(js.includes('url.pathname.startsWith("/api/")'), true);
  assert.equal(js.includes('url.pathname === "/retrieve/approval-grant"'), true);
});

test("notification settings keep unknown future events enabled by default", async () => {
  const env = { VTDD_V3_MODE: "test", EXECUTION_STORE: createMemoryStore() };
  await worker.fetch(
    new Request("https://example.com/api/notifications/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "selected",
        events: []
      })
    }),
    env
  );

  const event = await worker.fetch(
    new Request("https://example.com/api/execution-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        executionId: "remote-codex-future-event",
        repository: "marushu/vtdd-v3",
        issueNumber: 4,
        phase: "editing_files",
        currentStep: "Runner emitted a future event.",
        notifications: ["new future event notification"]
      })
    }),
    env
  );
  assert.equal(event.status, 201);

  const response = await worker.fetch(new Request("https://example.com/api/notifications"), env);
  const body = await response.json();
  assert.equal(body.notifications.some((item) => item.eventType === "future_event"), true);
  assert.equal(body.notifications.some((item) => item.eventType === "runner_event"), false);
});

test("dispatch preview returns progress URL without executing", async () => {
  const response = await worker.fetch(
    new Request("https://example.com/api/dispatch/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repository: "marushu/vtdd-v3",
        issueNumber: 1,
        branch: "codex/issue-1",
        task: "Build dashboard"
      })
    }),
    { VTDD_V3_MODE: "test" }
  );
  assert.equal(response.status, 202);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.preview.queue.status, "preview_only");
  assert.equal(body.preview.taskType, "implementation");
  assert.equal(body.preview.progressUrl, "https://example.com/progress/remote-codex-marushu-vtdd-v3-1");
});

test("issues API exposes v3 planning catalog", async () => {
  const response = await worker.fetch(new Request("https://example.com/api/issues"), {
    VTDD_V3_MODE: "test"
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.issues.some((issue) => issue.number === 1), true);
  assert.equal(body.issues.some((issue) => issue.number === 8), true);
});

test("repository registry API stores nickname-only and owner repo targets", async () => {
  const env = {
    VTDD_V3_MODE: "test",
    EXECUTION_STORE: createMemoryStore(),
    GITHUB_REPOSITORY_READINESS_FIXTURE: JSON.stringify({
      "marushu/hibou-piccola-bookkeeping": {
        visibility: "private",
        default_branch: "main",
        html_url: "https://github.com/marushu/hibou-piccola-bookkeeping"
      }
    })
  };
  const initial = await worker.fetch(new Request("https://example.com/api/repositories"), env);
  assert.equal(initial.status, 200);
  const initialBody = await initial.json();
  assert.equal(initialBody.repositories.some((repo) => repo.repository === "marushu/vtdd-v3"), true);

  const tomio = await worker.fetch(
    new Request("https://example.com/api/repositories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "TOMIO" })
    }),
    env
  );
  assert.equal(tomio.status, 201);
  const tomioBody = await tomio.json();
  assert.equal(tomioBody.repository.nickname, "TOMIO");
  assert.equal(tomioBody.repository.repository, null);
  assert.equal(tomioBody.repository.readiness, "unresolved");

  const sunaba = await worker.fetch(
    new Request("https://example.com/api/repositories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "SunabaEye", repository: "marushu/sunaba-eye" })
    }),
    env
  );
  assert.equal(sunaba.status, 201);
  const sunabaBody = await sunaba.json();
  assert.equal(sunabaBody.repository.nickname, "SunabaEye");
  assert.equal(sunabaBody.repository.repository, "marushu/sunaba-eye");
  assert.equal(sunabaBody.repository.readiness, "setup_required");
  assert.equal(sunabaBody.repository.repositoryUrl, "https://github.com/marushu/sunaba-eye");
  assert.equal(sunabaBody.setupRequired, true);
  assert.equal(sunabaBody.repository.v2Parity.butlerComplete, false);
  assert.equal(sunabaBody.repository.v2Parity.checks.some((check) => check.key === "orchestratorGithubApp" && check.status === "missing"), true);
  assert.equal(sunabaBody.setupActions.some((action) => action.url === "https://github.com/marushu/sunaba-eye/settings/installations"), true);

  const renamed = await worker.fetch(
    new Request("https://example.com/api/repositories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "SunabaEye project", repository: "marushu/sunaba-eye" })
    }),
    env
  );
  assert.equal(renamed.status, 201);
  const renamedBody = await renamed.json();
  assert.equal(renamedBody.repository.nickname, "SunabaEye project");
  assert.equal(
    renamedBody.repositories.filter((repo) => repo.repository === "marushu/sunaba-eye").length,
    1
  );

  const resolved = await worker.fetch(
    new Request("https://example.com/api/repositories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "TOMIO", repository: "marushu/hibou-piccola-bookkeeping" })
    }),
    env
  );
  assert.equal(resolved.status, 201);
  const resolvedBody = await resolved.json();
  assert.equal(resolvedBody.repository.repository, "marushu/hibou-piccola-bookkeeping");
  assert.equal(resolvedBody.repositories.some((repo) => repo.id === "repo-tomio"), false);

  const deleted = await worker.fetch(
    new Request(`https://example.com/api/repositories/${encodeURIComponent("repo-marushu-hibou-piccola-bookkeeping")}`, {
      method: "DELETE"
    }),
    env
  );
  assert.equal(deleted.status, 200);
  const deletedBody = await deleted.json();
  assert.equal(deletedBody.deleted.repository, "marushu/hibou-piccola-bookkeeping");
  assert.equal(deletedBody.repositories.some((repo) => repo.repository === "marushu/hibou-piccola-bookkeeping"), false);
});

test("repository registry supports multiple aliases for Butler resolution", async () => {
  const env = { VTDD_V3_MODE: "test", EXECUTION_STORE: createMemoryStore() };
  const created = await worker.fetch(
    new Request("https://example.com/api/repositories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "TOMIO",
        repository: "marushu/hibou-piccola-bookkeeping",
        aliases: ["トミオ"]
      })
    }),
    env
  );
  assert.equal(created.status, 201);
  const createdBody = await created.json();
  assert.deepEqual(createdBody.repository.aliases, ["トミオ"]);

  const added = await worker.fetch(
    new Request(`https://example.com/api/repositories/${encodeURIComponent("repo-marushu-hibou-piccola-bookkeeping")}/aliases`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ alias: "hibou bookkeeping" })
    }),
    env
  );
  assert.equal(added.status, 201);
  const addedBody = await added.json();
  assert.equal(addedBody.repository.aliases.includes("トミオ"), true);
  assert.equal(addedBody.repository.aliases.includes("hibou bookkeeping"), true);

  const deleted = await worker.fetch(
    new Request(`https://example.com/api/repositories/${encodeURIComponent("repo-marushu-hibou-piccola-bookkeeping")}/aliases`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ alias: "トミオ" })
    }),
    env
  );
  assert.equal(deleted.status, 200);
  const deletedBody = await deleted.json();
  assert.equal(deletedBody.repository.aliases.includes("トミオ"), false);
  assert.equal(deletedBody.repository.aliases.includes("hibou bookkeeping"), true);

  const renamed = await worker.fetch(
    new Request(`https://example.com/api/repositories/${encodeURIComponent("repo-marushu-hibou-piccola-bookkeeping")}/nickname`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nickname: "TOMIO bookkeeping" })
    }),
    env
  );
  assert.equal(renamed.status, 200);
  const renamedBody = await renamed.json();
  assert.equal(renamedBody.repository.nickname, "TOMIO bookkeeping");
  assert.equal(renamedBody.repository.aliases.includes("TOMIO"), true);
});

test("repository registry pins repositories before unpinned entries in pin order", async () => {
  const env = { VTDD_V3_MODE: "test", EXECUTION_STORE: createMemoryStore() };
  await worker.fetch(
    new Request("https://example.com/api/repositories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "TOMIO", repository: "marushu/hibou-piccola-bookkeeping" })
    }),
    env
  );

  const pinned = await worker.fetch(
    new Request(`https://example.com/api/repositories/${encodeURIComponent("repo-marushu-hibou-piccola-bookkeeping")}/pin`, {
      method: "POST"
    }),
    env
  );
  assert.equal(pinned.status, 200);
  const pinnedBody = await pinned.json();
  assert.equal(Boolean(pinnedBody.repository.pinnedAt), true);
  assert.equal(pinnedBody.repositories[0].repository, "marushu/vtdd-v3");
  assert.equal(pinnedBody.repositories[1].repository, "marushu/hibou-piccola-bookkeeping");
  assert.equal(pinnedBody.repositories[2].pinnedAt, null);

  const unpinned = await worker.fetch(
    new Request(`https://example.com/api/repositories/${encodeURIComponent("repo-marushu-hibou-piccola-bookkeeping")}/pin`, {
      method: "DELETE"
    }),
    env
  );
  assert.equal(unpinned.status, 200);
  const unpinnedBody = await unpinned.json();
  assert.equal(unpinnedBody.repository.pinnedAt, null);
});

test("Butler repository alias intent can add and delete nicknames", async () => {
  const env = { VTDD_V3_MODE: "test", EXECUTION_STORE: createMemoryStore() };
  await worker.fetch(
    new Request("https://example.com/api/repositories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "TOMIO", repository: "marushu/hibou-piccola-bookkeeping" })
    }),
    env
  );

  const added = await worker.fetch(
    new Request("https://example.com/api/butler/repository-alias", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repository: "TOMIO",
        message: "TOMIO に「トミオ」をニックネーム追加"
      })
    }),
    env
  );
  assert.equal(added.status, 201);
  const addedBody = await added.json();
  assert.equal(addedBody.intent.source, "butler_conversation");
  assert.equal(addedBody.repository.aliases.includes("トミオ"), true);

  const removed = await worker.fetch(
    new Request("https://example.com/api/butler/repository-alias", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repository: "TOMIO",
        action: "delete",
        alias: "トミオ"
      })
    }),
    env
  );
  assert.equal(removed.status, 200);
  const removedBody = await removed.json();
  assert.equal(removedBody.repository.aliases.includes("トミオ"), false);
});

test("repository readiness check marks readable repository as observed", async () => {
  const env = {
    VTDD_V3_MODE: "test",
    EXECUTION_STORE: createMemoryStore(),
    GITHUB_REPOSITORY_READINESS_FIXTURE: JSON.stringify({
      "marushu/hibou-piccola-bookkeeping": {
        visibility: "private",
        default_branch: "main",
        html_url: "https://github.com/marushu/hibou-piccola-bookkeeping"
      }
    })
  };
  await worker.fetch(
    new Request("https://example.com/api/repositories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "TOMIO", repository: "marushu/hibou-piccola-bookkeeping" })
    }),
    env
  );

  const checked = await worker.fetch(
    new Request(`https://example.com/api/repositories/${encodeURIComponent("repo-marushu-hibou-piccola-bookkeeping")}/readiness-check`, {
      method: "POST"
    }),
    env
  );
  assert.equal(checked.status, 200);
  const body = await checked.json();
  assert.equal(body.repository.readiness, "setup_required");
  assert.equal(body.repository.repoRead, "OK");
  assert.equal(body.repository.githubApp, "不足");
  assert.equal(body.repository.v2Parity.butlerComplete, false);
  assert.equal(body.repository.v2Parity.checks.find((check) => check.key === "repositoryRead").status, "ok");
  assert.equal(body.repository.v2Parity.setupActions.some((action) => action.kind === "github_app_install"), true);
  assert.match(body.repository.notes, /v2 parity 未完了/);
});

test("repository chat pages are served by the React dashboard shell", async () => {
  const response = await worker.fetch(new Request("https://example.com/repositories/marushu/vtdd-v3/chats"), {
    VTDD_V3_MODE: "test"
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.equal(html.includes('<div id="root"></div>'), true);
  assert.equal(html.includes("VTDD v3"), true);

  const list = await worker.fetch(new Request("https://example.com/api/chats?repository=marushu%2Fvtdd-v3"), {
    VTDD_V3_MODE: "test"
  });
  const body = await list.json();
  assert.equal(body.chats[0].chatId, "chat-vtdd-v3-issue5-runner-pickup-20260519-001");
});

test("repository top pages are served by the React dashboard shell", async () => {
  const response = await worker.fetch(new Request("https://example.com/repositories/vtdd-v3"), {
    VTDD_V3_MODE: "test"
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.equal(html.includes('<div id="root"></div>'), true);
  assert.equal(html.includes("VTDD v3"), true);
});

test("chat detail route is served by the React dashboard shell", async () => {
  const response = await worker.fetch(
    new Request("https://example.com/chats/chat-vtdd-v3-issue5-runner-pickup-20260519-001"),
    { VTDD_V3_MODE: "test" }
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.equal(html.includes('<div id="root"></div>'), true);
  assert.equal(html.includes("VTDD v3"), true);

  const api = await worker.fetch(
    new Request("https://example.com/api/chats/chat-vtdd-v3-issue5-runner-pickup-20260519-001"),
    { VTDD_V3_MODE: "test" }
  );
  const body = await api.json();
  assert.equal(body.chat.title, "VPS runner pickup adapter");
  assert.equal(body.chat.repository, "marushu/vtdd-v3");
});

test("chat API creates safe repository-scoped chat records", async () => {
  const env = { VTDD_V3_MODE: "test", EXECUTION_STORE: createMemoryStore() };
  const response = await worker.fetch(
    new Request("https://example.com/api/chats", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repository: "marushu/vtdd-v3",
        issueNumber: 8,
        executionId: "remote-codex-chat-8",
        title: "リポジトリ別チャットを作る",
        status: "active",
        summary: "repo / Issue / execution に紐づく chat record を作る。",
        message: "このチャットは dashboard から戻れるようにする。",
        tags: ["chat", "dashboard"]
      })
    }),
    env
  );
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.chat.repository, "marushu/vtdd-v3");
  assert.equal(body.chat.issueNumber, 8);
  assert.equal(body.chat.messages.length, 1);
  assert.equal(body.chatUrl.startsWith("/chats/chat-marushu-vtdd-v3-issue8-"), true);

  const list = await worker.fetch(new Request("https://example.com/api/chats?repository=marushu%2Fvtdd-v3"), env);
  assert.equal(list.status, 200);
  const listBody = await list.json();
  assert.equal(listBody.chats.some((chat) => chat.chatId === body.chat.chatId), true);
});

test("chat API rejects unsafe transcript fields", async () => {
  const response = await worker.fetch(
    new Request("https://example.com/api/chats", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repository: "marushu/vtdd-v3",
        title: "危険な chat",
        rawTranscript: "do not store"
      })
    }),
    { VTDD_V3_MODE: "test", EXECUTION_STORE: createMemoryStore() }
  );
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error, "forbidden_chat_field");
});

test("chat message API appends messages and updates sort order", async () => {
  const env = { VTDD_V3_MODE: "test", EXECUTION_STORE: createMemoryStore() };
  const created = await worker.fetch(
    new Request("https://example.com/api/chats", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repository: "marushu/vtdd-v3",
        issueNumber: 9,
        executionId: "remote-codex-chat-reply",
        title: "VPS Codex CLI の返事",
        summary: "runner が該当チャットに返事する。",
        message: "まず runner に指示する。",
        tags: ["runner", "reply"]
      })
    }),
    env
  );
  const createdBody = await created.json();
  const response = await worker.fetch(
    new Request(`https://example.com/api/chats/${createdBody.chat.chatId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        role: "runner",
        text: "VPS runner が返事しました。"
      })
    }),
    env
  );
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.chat.messages.at(-1).role, "runner");
  assert.equal(body.chat.lastMessage, "VPS runner が返事しました。");

  const filtered = await worker.fetch(new Request("https://example.com/api/chats?executionId=remote-codex-chat-reply"), env);
  const filteredBody = await filtered.json();
  assert.equal(filteredBody.chats[0].chatId, createdBody.chat.chatId);

  const search = await worker.fetch(new Request("https://example.com/api/chats/search?q=返事"), env);
  const searchBody = await search.json();
  assert.equal(searchBody.results[0].chatId, createdBody.chat.chatId);
});

test("chat follow-up dispatch queues work on the same development chat", async () => {
  const env = { VTDD_V3_MODE: "test", EXECUTION_STORE: createMemoryStore() };
  const response = await worker.fetch(
    new Request("https://example.com/api/chats/chat-vtdd-v3-issue5-runner-pickup-20260519-001/dispatch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        role: "owner",
        taskType: "implementation",
        text: "このチャットの続きとして runner イベントをもっと細かく出して"
      })
    }),
    env
  );
  assert.equal(response.status, 202);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.chat.chatId, "chat-vtdd-v3-issue5-runner-pickup-20260519-001");
  assert.equal(body.chat.executionId, body.execution.executionId);
  assert.equal(body.execution.returnThreadUrl.endsWith("/chats/chat-vtdd-v3-issue5-runner-pickup-20260519-001"), true);
  assert.equal(body.chat.messages.at(-2).text, "このチャットの続きとして runner イベントをもっと細かく出して");
  assert.equal(body.chat.messages.at(-1).role, "butler");

  const queue = await worker.fetch(new Request("https://example.com/api/runner/queue?limit=1"), env);
  const queueBody = await queue.json();
  assert.equal(queueBody.queue[0].executionId, body.execution.executionId);
});

test("Butler conversation creates a chat before implementation dispatch", async () => {
  const env = { VTDD_V3_MODE: "test", EXECUTION_STORE: createMemoryStore() };
  const response = await worker.fetch(
    new Request("https://example.com/api/butler/converse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repository: "marushu/vtdd-v3",
        message: "会話しながら Issue 候補と RAG 候補を作りたい"
      })
    }),
    env
  );
  assert.equal(response.status, 202);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.conversation.mode, "conversation");
  assert.equal(body.chat.tags.includes("conversation"), true);
  assert.equal(body.execution.returnThreadUrl.endsWith(`/chats/${encodeURIComponent(body.chat.chatId)}`), true);
  assert.equal(body.chat.messages[0].text, "会話しながら Issue 候補と RAG 候補を作りたい");
});

test("existing chat conversation turn queues VPS Codex CLI reply work", async () => {
  const env = { VTDD_V3_MODE: "test", EXECUTION_STORE: createMemoryStore() };
  const response = await worker.fetch(
    new Request("https://example.com/api/chats/chat-vtdd-v3-issue5-runner-pickup-20260519-001/converse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "この違和感を Issue 化する前に Butler と相談したい"
      })
    }),
    env
  );
  assert.equal(response.status, 202);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.conversation.mode, "conversation");
  assert.equal(body.chat.chatId, "chat-vtdd-v3-issue5-runner-pickup-20260519-001");
  assert.equal(body.chat.messages.at(-2).text, "この違和感を Issue 化する前に Butler と相談したい");
  assert.equal(body.chat.messages.at(-1).text.includes("会話ターンを VPS Codex CLI に渡しました"), true);
});

test("chat message API rejects unsafe runner fields", async () => {
  const response = await worker.fetch(
    new Request("https://example.com/api/chats/chat-vtdd-v3-issue5-runner-pickup-20260519-001/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        role: "runner",
        text: "unsafe",
        rawLog: "secret terminal dump"
      })
    }),
    { VTDD_V3_MODE: "test", EXECUTION_STORE: createMemoryStore() }
  );
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error, "forbidden_chat_field");
});

test("event contract API exposes allowed phases and safety boundary", async () => {
  const response = await worker.fetch(new Request("https://example.com/api/event-contract"), {
    VTDD_V3_MODE: "test"
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.contract.allowedPhases.includes("editing_files"), true);
  assert.equal(body.contract.allowedPhases.includes("waiting_review"), true);
  assert.equal(body.contract.forbiddenEventFields.includes("chainOfThought"), true);
  assert.equal(body.contract.safeEventFields.includes("touchedFiles"), true);
});

test("execution event creates a dashboard-visible execution in store", async () => {
  const env = { VTDD_V3_MODE: "test", EXECUTION_STORE: createMemoryStore() };
  const response = await worker.fetch(
    new Request("https://example.com/api/execution-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        executionId: "remote-codex-v3-issue2",
        repository: "marushu/vtdd-v3",
        issueNumber: 2,
        title: "VPS Codex CLI execution event contract",
        branch: "codex/issue-2",
        phase: "editing_files",
        currentStep: "Adding safe runner event ingestion.",
        touchedFiles: ["src/worker.js", "test/worker.test.js"],
        timestamp: "2026-05-19T08:00:00.000Z"
      })
    }),
    env
  );
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.execution.repository, "marushu/vtdd-v3");
  assert.equal(body.execution.progress, 45);
  assert.equal(body.progressUrl, "https://example.com/progress/remote-codex-v3-issue2");

  const progress = await worker.fetch(
    new Request("https://example.com/progress/remote-codex-v3-issue2"),
    env
  );
  assert.equal(progress.status, 200);
  const html = await progress.text();
  assert.equal(html.includes("Adding safe runner event ingestion."), true);
  assert.equal(html.includes("src/worker.js"), true);
});

test("execution event rejects unsafe payloads and unsupported phases", async () => {
  const unsafe = await worker.fetch(
    new Request("https://example.com/api/execution-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        executionId: "remote-codex-unsafe",
        repository: "marushu/vtdd-v3",
        phase: "editing_files",
        chainOfThought: "do not store this"
      })
    }),
    { VTDD_V3_MODE: "test", EXECUTION_STORE: createMemoryStore() }
  );
  assert.equal(unsafe.status, 400);
  assert.equal((await unsafe.json()).error, "forbidden_event_field");

  const unsupported = await worker.fetch(
    new Request("https://example.com/api/execution-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        executionId: "remote-codex-weird",
        repository: "marushu/vtdd-v3",
        phase: "streaming_raw_terminal"
      })
    }),
    { VTDD_V3_MODE: "test", EXECUTION_STORE: createMemoryStore() }
  );
  assert.equal(unsupported.status, 400);
  assert.equal((await unsupported.json()).error, "unsupported_phase");
});

test("dashboard dispatch creates a queued execution without high-risk action", async () => {
  const env = { VTDD_V3_MODE: "test", EXECUTION_STORE: createMemoryStore() };
  const response = await worker.fetch(
    new Request("https://example.com/api/dispatch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repository: "marushu/vtdd-v3",
        issueNumber: 5,
        branch: "codex/issue-5",
        taskType: "implementation",
        task: "Wire dashboard dispatch to queue record"
      })
    }),
    env
  );
  assert.equal(response.status, 202);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.dispatch.status, "queued");
  assert.equal(body.dispatch.authority, "No high-risk action executed by dispatch.");
  assert.equal(body.execution.phase, "queued");
  assert.equal(body.progressUrl.startsWith("https://example.com/progress/remote-codex-marushu-vtdd-v3-5-"), true);

  const progress = await worker.fetch(new Request(body.progressUrl), env);
  assert.equal(progress.status, 200);
  const html = await progress.text();
  assert.equal(html.includes("Wire dashboard dispatch to queue record"), true);
  assert.equal(html.includes("queued"), true);
});

test("dashboard Butler queues owner instruction and returns progress/chat URLs", async () => {
  const env = { VTDD_V3_MODE: "test", EXECUTION_STORE: createMemoryStore() };
  const page = await worker.fetch(new Request("https://example.com/butler"), env);
  assert.equal(page.status, 200);
  const pageHtml = await page.text();
  assert.equal(pageHtml.includes("Butler に開発指示"), true);
  assert.equal(pageHtml.includes("執事長の声"), true);
  assert.equal(pageHtml.includes("device_speech_synthesis"), true);
  assert.equal(pageHtml.includes("speechSynthesis"), true);
  assert.equal(pageHtml.includes("呼称を確認して保存"), true);
  assert.equal(pageHtml.includes("外部 TTS"), false);
  assert.equal(pageHtml.includes("マイク入力"), true);
  assert.equal(pageHtml.includes("webkitSpeechRecognition"), true);
  assert.equal(pageHtml.includes("wakeLock"), true);
  assert.equal(pageHtml.includes("認識結果を確認してから queue"), true);

  const response = await worker.fetch(
    new Request("https://example.com/api/butler/dispatch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repository: "marushu/vtdd-v3",
        issueNumber: 14,
        message: "dashboard Butler から runner queue に開発指示を投げられるようにして"
      })
    }),
    env
  );
  assert.equal(response.status, 202);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.intent.intentType, "implementation");
  assert.equal(body.dispatch.status, "queued");
  assert.equal(body.progressUrl.includes("/progress/"), true);
  assert.equal(body.chatUrl.includes("/chats/"), true);
  assert.equal(body.chat.executionId, body.execution.executionId);

  const queue = await worker.fetch(new Request("https://example.com/api/runner/queue?limit=1"), env);
  const queueBody = await queue.json();
  assert.equal(queueBody.queue[0].executionId, body.execution.executionId);

  const chat = await worker.fetch(new Request(`https://example.com/api/chats/${encodeURIComponent(body.chat.chatId)}`), env);
  assert.equal(chat.status, 200);
  const chatBody = await chat.json();
  assert.equal(chatBody.chat.messages[0].text, "dashboard Butler から runner queue に開発指示を投げられるようにして");

  const chatPage = await worker.fetch(new Request(body.chatUrl), env);
  assert.equal(chatPage.status, 200);
  assert.equal((await chatPage.text()).includes('<div id="root"></div>'), true);
});

test("dashboard Butler refuses high-risk natural-language intent", async () => {
  const response = await worker.fetch(
    new Request("https://example.com/api/butler/dispatch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repository: "marushu/vtdd-v3",
        issueNumber: 14,
        message: "本番にデプロイして"
      })
    }),
    { VTDD_V3_MODE: "test", EXECUTION_STORE: createMemoryStore() }
  );
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error, "high_risk_intent_requires_decision_queue");
});

test("dashboard dispatch rejects high-risk task types", async () => {
  const response = await worker.fetch(
    new Request("https://example.com/api/dispatch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repository: "marushu/vtdd-v3",
        issueNumber: 5,
        taskType: "deploy",
        task: "Deploy production"
      })
    }),
    { VTDD_V3_MODE: "test", EXECUTION_STORE: createMemoryStore() }
  );
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error, "high_risk_dispatch_forbidden");
});

test("runner queue and claim expose queued work to VPS adapter", async () => {
  const env = { VTDD_V3_MODE: "test", EXECUTION_STORE: createMemoryStore() };
  const dispatch = await worker.fetch(
    new Request("https://example.com/api/dispatch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repository: "marushu/vtdd-v3",
        issueNumber: 5,
        branch: "codex/issue-5",
        taskType: "implementation",
        task: "Runner should pick this up"
      })
    }),
    env
  );
  const dispatchBody = await dispatch.json();

  const queue = await worker.fetch(new Request("https://example.com/api/runner/queue?limit=1"), env);
  assert.equal(queue.status, 200);
  const queueBody = await queue.json();
  assert.equal(queueBody.ok, true);
  assert.equal(queueBody.queue[0].executionId, dispatchBody.execution.executionId);
  assert.equal(queueBody.queue[0].progressUrl.includes("/progress/"), true);

  const claim = await worker.fetch(
    new Request("https://example.com/api/runner/claim", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        executionId: dispatchBody.execution.executionId,
        runnerId: "test-vps"
      })
    }),
    env
  );
  assert.equal(claim.status, 200);
  const claimBody = await claim.json();
  assert.equal(claimBody.ok, true);
  assert.equal(claimBody.execution.phase, "picked_up");
  assert.equal(claimBody.execution.status, "running");

  const secondClaim = await worker.fetch(
    new Request("https://example.com/api/runner/claim", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        executionId: dispatchBody.execution.executionId,
        runnerId: "other-vps"
      })
    }),
    env
  );
  assert.equal(secondClaim.status, 409);
});
