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
  assert.equal(html.includes("VTDD v3 Orchestrator"), true);
  assert.equal(html.includes("remote-codex-issue426-1f5bdj"), true);
  assert.equal(html.includes("Open PR"), true);
  assert.equal(html.includes("Work Inbox"), true);
  assert.equal(html.includes("Human decisions"), true);
  assert.equal(html.includes("Notifications"), true);
  assert.equal(html.includes("v3 Issues"), true);
});

test("progress page is addressable by executionId", async () => {
  const response = await worker.fetch(
    new Request("https://example.com/progress/remote-codex-issue426-1f5bdj"),
    { VTDD_V3_MODE: "test" }
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.equal(html.includes("Butler first-response latency"), true);
  assert.equal(html.includes("editing_files"), true);
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
  assert.equal(html.includes("Decision Queue"), true);
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
  assert.equal(html.includes("Notifications"), true);
  assert.equal(html.includes("PR merged"), true);

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
