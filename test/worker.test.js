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
