import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/worker.js";

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

test("orchestrator dashboard renders execution cards", async () => {
  const response = await worker.fetch(new Request("https://example.com/orchestrator"), {
    VTDD_V3_MODE: "test"
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  const html = await response.text();
  assert.equal(html.includes("VTDD v3 オーケストレーター"), true);
  assert.equal(html.includes("remote-codex-issue426-1f5bdj"), true);
  assert.equal(html.includes("PR を開く"), true);
  assert.equal(html.includes("進行中の開発"), true);
  assert.equal(html.includes("リポジトリ別の進捗"), true);
  assert.equal(html.includes("チャット"), true);
  assert.equal(html.includes("/repositories/marushu/vtdd-v3/chats"), true);
  assert.equal(html.includes("https://github.com/marushu/vtdd-v2-p"), true);
  assert.equal(html.includes("https://github.com/marushu/vtdd-v2-p/issues/426"), true);
  assert.equal(html.includes("https://github.com/marushu/vtdd-v2-p/pull/425"), true);
  assert.equal(html.includes("判断待ち"), true);
  assert.equal(html.includes("通知"), true);
  assert.equal(html.includes("v3 Issues"), true);
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
  assert.equal(html.includes("判断待ちキュー"), true);
  assert.equal(html.includes("GO + real passkey"), true);

  const response = await worker.fetch(new Request("https://example.com/api/decisions"), {
    VTDD_V3_MODE: "test"
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.decisions.some((item) => item.authority === "GO + real passkey"), true);
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

test("repository chat pages list active and archived chats", async () => {
  const response = await worker.fetch(new Request("https://example.com/repositories/marushu/vtdd-v3/chats"), {
    VTDD_V3_MODE: "test"
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.equal(html.includes("marushu/vtdd-v3 の開発チャット"), true);
  assert.equal(html.includes("VPS runner pickup adapter"), true);
  assert.equal(html.includes("chat-vtdd-v3-issue5-runner-pickup-20260519-001"), true);
  assert.equal(html.includes("Summary first"), false);
});

test("chat detail is summary-first and links to GitHub truth", async () => {
  const response = await worker.fetch(
    new Request("https://example.com/chats/chat-vtdd-v3-issue5-runner-pickup-20260519-001"),
    { VTDD_V3_MODE: "test" }
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.equal(html.includes("Summary first"), true);
  assert.equal(html.includes("VPS runner pickup adapter"), true);
  assert.equal(html.includes("https://github.com/marushu/vtdd-v3/issues/5"), true);
  assert.equal(html.includes("必要時だけ開く transcript"), true);
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
  assert.equal((await page.text()).includes("Butler に開発指示"), true);

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

  const chat = await worker.fetch(new Request(body.chatUrl), env);
  assert.equal(chat.status, 200);
  assert.equal((await chat.text()).includes("dashboard Butler から runner queue"), true);
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
