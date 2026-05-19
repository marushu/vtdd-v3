#!/usr/bin/env node
import { spawn } from "node:child_process";
import { hostname } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const defaultRunnerId = `vps-codex-${hostname()}`;

export function buildCodexPrompt(execution) {
  return [
    `You are VPS Codex CLI running a bounded VTDD v3 execution.`,
    `Repository: ${execution.repository}`,
    `Issue: ${execution.issueNumber ?? "none"}`,
    `Branch: ${execution.branch || "codex/dashboard-dispatch"}`,
    `Task: ${execution.title}`,
    ``,
    `Rules:`,
    `- Stay inside the requested Issue/task scope.`,
    `- Do not merge, deploy, close issues, mutate credentials, or change DNS.`,
    `- Push a branch and create or update a PR when implementation is ready.`,
    `- Report concise progress; do not expose raw terminal logs or chain-of-thought.`
  ].join("\n");
}

export async function runOnce(config = {}) {
  const options = normalizeConfig(config);
  const queued = await getQueue(options);
  if (queued.length === 0) {
    return { ok: true, status: "idle", message: "No queued executions." };
  }

  const target = queued[0];
  const claimed = await claimExecution(options, target.executionId);
  const execution = claimed.execution;

  await postEvent(options, {
    ...baseEvent(execution),
    phase: "codex_starting",
    currentStep: options.execute ? "Starting Codex CLI." : "Dry-run runner verified queue claim.",
    progress: 14
  });

  if (!options.execute) {
    await postEvent(options, {
      ...baseEvent(execution),
      phase: "completed",
      status: "completed",
      currentStep: "Dry-run runner completed without starting Codex CLI.",
      progress: 100,
      notifications: ["VPS runner dry-run path is wired."]
    });
    return { ok: true, status: "dry_run_completed", executionId: execution.executionId };
  }

  await postEvent(options, {
    ...baseEvent(execution),
    phase: "planning",
    currentStep: "Codex CLI is running the bounded task.",
    progress: 24
  });

  const result = await runCodex(options, execution);
  if (result.ok) {
    await postEvent(options, {
      ...baseEvent(execution),
      phase: "waiting_review",
      status: "waiting",
      currentStep: "Codex CLI finished. Review PR output and decide next action.",
      progress: 92,
      nextHumanAction: "merge_review",
      notifications: ["Codex CLI execution finished; human review is required."]
    });
    return { ok: true, status: "waiting_review", executionId: execution.executionId };
  }

  await postEvent(options, {
    ...baseEvent(execution),
    phase: "failed",
    status: "failed",
    currentStep: "Codex CLI exited unsuccessfully. Raw logs were not sent to the dashboard.",
    blocker: `Codex CLI exit code ${result.exitCode}`,
    progress: 100,
    nextHumanAction: "investigate",
    notifications: ["Codex CLI execution failed; investigation is required."]
  });
  return { ok: false, status: "failed", executionId: execution.executionId, exitCode: result.exitCode };
}

export function normalizeConfig(config = {}) {
  const orchestratorUrl = stripTrailingSlash(config.orchestratorUrl || process.env.VTDD_ORCHESTRATOR_URL);
  if (!orchestratorUrl) {
    throw new Error("VTDD_ORCHESTRATOR_URL is required");
  }
  return {
    orchestratorUrl,
    runnerId: config.runnerId || process.env.VTDD_RUNNER_ID || defaultRunnerId,
    token: config.token || process.env.VTDD_RUNNER_TOKEN || "",
    execute: Boolean(config.execute ?? process.env.VTDD_RUNNER_EXECUTE === "1"),
    codexCommand: config.codexCommand || process.env.VTDD_CODEX_COMMAND || "codex",
    workspaceRoot: config.workspaceRoot || process.env.VTDD_WORKSPACE_ROOT || process.cwd(),
    fetchImpl: config.fetchImpl || fetch,
    spawnImpl: config.spawnImpl || spawn
  };
}

async function getQueue(options) {
  const response = await requestJson(options, "/api/runner/queue?limit=1");
  return response.queue || [];
}

async function claimExecution(options, executionId) {
  return requestJson(options, "/api/runner/claim", {
    method: "POST",
    body: { executionId, runnerId: options.runnerId }
  });
}

async function postEvent(options, event) {
  return requestJson(options, "/api/execution-events", {
    method: "POST",
    body: event
  });
}

async function requestJson(options, path, init = {}) {
  const headers = { accept: "application/json" };
  if (init.body) headers["content-type"] = "application/json";
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  const response = await options.fetchImpl(`${options.orchestratorUrl}${path}`, {
    method: init.method || "GET",
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ok === false) {
    throw new Error(body.error || `request_failed_${response.status}`);
  }
  return body;
}

function baseEvent(execution) {
  return {
    executionId: execution.executionId,
    repository: execution.repository,
    issueNumber: execution.issueNumber,
    title: execution.title,
    branch: execution.branch
  };
}

async function runCodex(options, execution) {
  const repoName = execution.repository.split("/").pop();
  const cwd = repoName ? join(options.workspaceRoot, repoName) : options.workspaceRoot;
  const prompt = buildCodexPrompt(execution);
  return new Promise((resolve) => {
    const child = options.spawnImpl(options.codexCommand, ["exec", prompt], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"]
    });
    child.stdout?.resume();
    child.stderr?.resume();
    child.on("error", () => resolve({ ok: false, exitCode: -1 }));
    child.on("close", (exitCode) => resolve({ ok: exitCode === 0, exitCode }));
  });
}

function stripTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

async function main() {
  const result = await runOnce();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.ok ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
