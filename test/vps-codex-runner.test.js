import test from "node:test";
import assert from "node:assert/strict";
import { buildCodexPrompt, normalizeConfig, runOnce } from "../scripts/vps-codex-runner.mjs";

test("buildCodexPrompt keeps high-risk actions out of runner prompt", () => {
  const prompt = buildCodexPrompt({
    repository: "marushu/vtdd-v3",
    issueNumber: 5,
    branch: "codex/issue-5",
    title: "Wire dashboard dispatch to VPS runner"
  });
  assert.match(prompt, /Repository: marushu\/vtdd-v3/);
  assert.match(prompt, /Do not merge, deploy, close issues/);
});

test("normalizeConfig requires orchestrator URL", () => {
  assert.throws(() => normalizeConfig({ orchestratorUrl: "" }), /VTDD_ORCHESTRATOR_URL/);
});

test("runOnce claims queue and posts dry-run progress events", async () => {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, init });
    if (url.endsWith("/api/runner/queue?limit=1")) {
      return jsonResponse({
        ok: true,
        queue: [{
          executionId: "remote-codex-v3-5",
          repository: "marushu/vtdd-v3",
          issueNumber: 5,
          title: "Wire dashboard dispatch to VPS runner",
          branch: "codex/issue-5"
        }]
      });
    }
    if (url.endsWith("/api/runner/claim")) {
      return jsonResponse({
        ok: true,
        execution: {
          executionId: "remote-codex-v3-5",
          repository: "marushu/vtdd-v3",
          issueNumber: 5,
          title: "Wire dashboard dispatch to VPS runner",
          branch: "codex/issue-5"
        }
      });
    }
    if (url.endsWith("/api/execution-events")) {
      return jsonResponse({ ok: true });
    }
    return jsonResponse({ ok: false, error: "unexpected" }, 404);
  };

  const result = await runOnce({
    orchestratorUrl: "https://worker.example",
    runnerId: "test-runner",
    fetchImpl
  });
  assert.equal(result.ok, true);
  assert.equal(result.status, "dry_run_completed");

  const eventBodies = calls
    .filter((call) => call.url.endsWith("/api/execution-events"))
    .map((call) => JSON.parse(call.init.body));
  assert.deepEqual(eventBodies.map((body) => body.phase), ["codex_starting", "completed"]);
  assert.equal(eventBodies.some((body) => Object.prototype.hasOwnProperty.call(body, "rawLog")), false);
});

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}
