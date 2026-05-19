import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/worker.js";

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
