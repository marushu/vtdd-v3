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

test("normalizeConfig marks API key billing mode when OPENAI_API_KEY exists", () => {
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "sk-test";
  try {
    const config = normalizeConfig({ orchestratorUrl: "https://worker.example" });
    assert.equal(config.runnerAuthMode, "api_key");
    assert.equal(config.costMode, "api_key_billing");
    assert.equal(config.allowOpenAiApiKeyBilling, false);
  } finally {
    if (previous === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = previous;
    }
  }
});

test("runOnce blocks execute mode when API key billing is not explicitly allowed", async () => {
  const fetchImpl = async (url) => {
    if (url.endsWith("/api/runner/queue?limit=1")) {
      return jsonResponse({
        ok: true,
        queue: [{
          executionId: "remote-codex-v3-15",
          repository: "marushu/vtdd-v3",
          issueNumber: 15,
          title: "Runner cost guard",
          branch: "codex/issue-15"
        }]
      });
    }
    if (url.endsWith("/api/runner/claim")) {
      return jsonResponse({
        ok: true,
        execution: {
          executionId: "remote-codex-v3-15",
          repository: "marushu/vtdd-v3",
          issueNumber: 15,
          title: "Runner cost guard",
          branch: "codex/issue-15"
        }
      });
    }
    if (url.endsWith("/api/execution-events")) {
      return jsonResponse({ ok: true });
    }
    if (url.endsWith("/api/chats?executionId=remote-codex-v3-15")) {
      return jsonResponse({ ok: true, chats: [] });
    }
    return jsonResponse({ ok: true, chats: [] });
  };

  await assert.rejects(
    () => runOnce({
      orchestratorUrl: "https://worker.example",
      execute: true,
      runnerAuthMode: "api_key",
      costMode: "api_key_billing",
      fetchImpl
    }),
    /API key billing mode is blocked/
  );
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
    if (url.endsWith("/api/chats?executionId=remote-codex-v3-5")) {
      return jsonResponse({
        ok: true,
        chats: [{ chatId: "chat-vtdd-v3-issue5" }]
      });
    }
    if (url.endsWith("/api/chats/chat-vtdd-v3-issue5/messages")) {
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

  const chatMessages = calls
    .filter((call) => call.url.endsWith("/api/chats/chat-vtdd-v3-issue5/messages"))
    .map((call) => JSON.parse(call.init.body));
  assert.deepEqual(chatMessages.map((body) => body.role), ["runner", "runner"]);
  assert.equal(chatMessages.some((body) => Object.prototype.hasOwnProperty.call(body, "rawLog")), false);
});

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}
