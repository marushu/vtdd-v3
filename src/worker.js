const EXECUTION_STORE_KEY = "vtdd:v3:executions";

const allowedPhases = [
  "queued",
  "picked_up",
  "codex_starting",
  "planning",
  "editing_files",
  "running_tests",
  "pushing_branch",
  "creating_pr",
  "waiting_review",
  "completed",
  "failed",
  "canceled",
  "stale"
];

const allowedStatuses = ["queued", "running", "waiting", "completed", "failed", "canceled", "stale"];

const safeEventFields = [
  "executionId",
  "repository",
  "issueNumber",
  "title",
  "branch",
  "status",
  "phase",
  "progress",
  "currentStep",
  "touchedFiles",
  "prUrl",
  "blocker",
  "timestamp",
  "nextHumanAction",
  "returnThreadUrl",
  "notifications"
];

const forbiddenEventFields = [
  "rawLog",
  "terminalStream",
  "chainOfThought",
  "secret",
  "token",
  "approvalGrant",
  "approvalGrantId",
  "password",
  "privateKey"
];

const sampleExecutions = [
  {
    executionId: "remote-codex-issue426-1f5bdj",
    repository: "marushu/vtdd-v2-p",
    issueNumber: 426,
    title: "Butler first-response latency",
    branch: "codex/issue-426",
    status: "running",
    phase: "editing_files",
    progress: 42,
    currentStep: "Updating Custom GPT setup instructions and docs tests.",
    prUrl: null,
    blocker: null,
    lastUpdatedAt: "2026-05-19T05:40:00.000Z",
    nextHumanAction: "wait",
    returnThreadUrl: null,
    notifications: ["Runner picked up the queue", "Docs tests are expected next"]
  },
  {
    executionId: "remote-codex-issue424-closed",
    repository: "marushu/vtdd-v2-p",
    issueNumber: 424,
    title: "Deploy operator repositoryInput guard",
    branch: "codex/fix-deploy-operator-repo-required",
    status: "completed",
    phase: "completed",
    progress: 100,
    currentStep: "Merged and deployed. Runtime guard is live.",
    prUrl: "https://github.com/marushu/vtdd-v2-p/pull/425",
    blocker: null,
    lastUpdatedAt: "2026-05-19T04:54:49.000Z",
    nextHumanAction: "issue_close_review",
    returnThreadUrl: null,
    notifications: ["PR merged", "Cloudflare deploy succeeded", "Issue close is ready"]
  },
  {
    executionId: "remote-codex-v3-dashboard-mvp",
    repository: "marushu/vtdd-v3",
    issueNumber: 1,
    title: "Cloudflare Orchestrator Dashboard MVP",
    branch: "main",
    status: "running",
    phase: "running_tests",
    progress: 76,
    currentStep: "Publishing the first dashboard Worker URL.",
    prUrl: "https://github.com/marushu/vtdd-v3",
    blocker: null,
    lastUpdatedAt: "2026-05-19T06:10:00.000Z",
    nextHumanAction: "review_dashboard",
    returnThreadUrl: null,
    notifications: ["Repository created", "Initial issues created", "Dashboard deploy in progress"]
  }
];

const issueCatalog = [
  { number: 1, title: "Epic: VTDD v3 Cloudflare Orchestrator Dashboard", status: "open" },
  { number: 2, title: "VPS Codex CLI execution event contract", status: "open" },
  { number: 3, title: "Human decision queue", status: "open" },
  { number: 4, title: "Owner notifications", status: "open" },
  { number: 5, title: "Dashboard dispatch to VPS Codex CLI", status: "open" },
  { number: 6, title: "Evaluate vtdd.hibou-web.com migration to Cloudflare", status: "open" },
  { number: 7, title: "GitHub App roles and runner credentials for v3", status: "planned" }
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const executions = await listExecutions(env);

    if (url.pathname === "/" || url.pathname === "/orchestrator") {
      return html(renderDashboard({ executions, env, url }));
    }

    if (url.pathname === "/decisions") {
      return html(renderDecisions({ executions }));
    }

    if (url.pathname === "/notifications") {
      return html(renderNotifications({ executions }));
    }

    if (url.pathname === "/dispatch") {
      return html(renderDispatch({ url }));
    }

    if (url.pathname.startsWith("/progress/")) {
      const executionId = decodeURIComponent(url.pathname.slice("/progress/".length));
      const execution = executions.find((item) => item.executionId === executionId);
      if (!execution) {
        return json({ ok: false, error: "execution_not_found", executionId }, 404);
      }
      return html(renderProgress({ execution }));
    }

    if (url.pathname === "/api/executions") {
      return json({ ok: true, executions });
    }

    if (url.pathname.startsWith("/api/executions/")) {
      const executionId = decodeURIComponent(url.pathname.slice("/api/executions/".length));
      const execution = executions.find((item) => item.executionId === executionId);
      if (!execution) {
        return json({ ok: false, error: "execution_not_found", executionId }, 404);
      }
      return json({ ok: true, execution });
    }

    if (url.pathname === "/api/decisions") {
      return json({ ok: true, decisions: buildDecisionItems(executions) });
    }

    if (url.pathname === "/api/notifications") {
      return json({ ok: true, notifications: buildNotifications(executions) });
    }

    if (url.pathname === "/api/event-contract") {
      return json({
        ok: true,
        contract: {
          allowedPhases,
          allowedStatuses,
          safeEventFields,
          forbiddenEventFields,
          persistence: env?.EXECUTION_STORE ? "kv" : "sample_fallback"
        }
      });
    }

    if (url.pathname === "/api/execution-events" && request.method === "POST") {
      const body = await request.json().catch(() => null);
      if (!body || typeof body !== "object") {
        return json({ ok: false, error: "invalid_json" }, 400);
      }

      const validation = validateExecutionEvent(body);
      if (!validation.ok) {
        return json(validation, 400);
      }

      const execution = applyExecutionEvent(executions, body, url.origin);
      await saveExecutions(env, executions);
      return json({
        ok: true,
        execution,
        progressUrl: `${url.origin}/progress/${encodeURIComponent(execution.executionId)}`
      }, execution.createdFromEvent ? 201 : 200);
    }

    if (url.pathname === "/api/dispatch/preview" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const preview = buildDispatchPreview({ body, origin: url.origin });
      return json({ ok: true, preview }, 202);
    }

    if (url.pathname === "/api/issues") {
      return json({ ok: true, issues: issueCatalog });
    }

    if (url.pathname === "/health") {
      return json({ ok: true, service: "vtdd-v3-orchestrator", mode: env?.VTDD_V3_MODE || "unknown" });
    }

    return json({ ok: false, error: "not_found" }, 404);
  }
};

async function listExecutions(env) {
  const store = env?.EXECUTION_STORE;
  if (!store?.get) {
    return sampleExecutions.map((execution) => ({ ...execution }));
  }

  const raw = await store.get(EXECUTION_STORE_KEY);
  if (!raw) {
    return sampleExecutions.map((execution) => ({ ...execution }));
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((execution) => normalizeStoredExecution(execution));
    }
  } catch {
    return sampleExecutions.map((execution) => ({ ...execution }));
  }

  return sampleExecutions.map((execution) => ({ ...execution }));
}

async function saveExecutions(env, executions) {
  const store = env?.EXECUTION_STORE;
  if (!store?.put) return false;
  await store.put(EXECUTION_STORE_KEY, JSON.stringify(executions.map(stripRuntimeOnlyFields)));
  return true;
}

function validateExecutionEvent(event) {
  const forbiddenField = forbiddenEventFields.find((field) => Object.prototype.hasOwnProperty.call(event, field));
  if (forbiddenField) {
    return { ok: false, error: "forbidden_event_field", field: forbiddenField };
  }

  if (!normalizeText(event.executionId)) {
    return { ok: false, error: "executionId_required" };
  }

  if (!normalizeText(event.repository)) {
    return { ok: false, error: "repository_required" };
  }

  if (!allowedPhases.includes(normalizeText(event.phase))) {
    return { ok: false, error: "unsupported_phase", allowedPhases };
  }

  const status = normalizeText(event.status);
  if (status && !allowedStatuses.includes(status)) {
    return { ok: false, error: "unsupported_status", allowedStatuses };
  }

  return { ok: true };
}

function applyExecutionEvent(executions, event, origin) {
  const executionId = normalizeText(event.executionId);
  const index = executions.findIndex((item) => item.executionId === executionId);
  const now = normalizeTimestamp(event.timestamp);
  const existing = index >= 0 ? executions[index] : null;
  const next = {
    executionId,
    repository: normalizeText(event.repository),
    issueNumber: normalizeIssueNumber(event.issueNumber ?? existing?.issueNumber),
    title: normalizeText(event.title) || existing?.title || "Untitled VTDD execution",
    branch: normalizeText(event.branch) || existing?.branch || "unknown",
    status: normalizeText(event.status) || statusForPhase(event.phase),
    phase: normalizeText(event.phase),
    progress: normalizeProgress(event.progress ?? existing?.progress ?? progressForPhase(event.phase)),
    currentStep: normalizeText(event.currentStep) || existing?.currentStep || phaseLabel(event.phase),
    touchedFiles: normalizeStringList(event.touchedFiles ?? existing?.touchedFiles),
    prUrl: normalizeUrl(event.prUrl, origin) || existing?.prUrl || null,
    blocker: normalizeText(event.blocker) || null,
    lastUpdatedAt: now,
    nextHumanAction: normalizeText(event.nextHumanAction) || existing?.nextHumanAction || nextHumanActionForPhase(event.phase),
    returnThreadUrl: normalizeUrl(event.returnThreadUrl, origin) || existing?.returnThreadUrl || null,
    notifications: mergeNotifications(existing?.notifications, event.notifications, event.currentStep),
    createdFromEvent: index < 0
  };

  if (index >= 0) {
    executions[index] = next;
  } else {
    executions.unshift(next);
  }

  return next;
}

function normalizeStoredExecution(execution) {
  return {
    executionId: normalizeText(execution.executionId),
    repository: normalizeText(execution.repository),
    issueNumber: normalizeIssueNumber(execution.issueNumber),
    title: normalizeText(execution.title) || "Untitled VTDD execution",
    branch: normalizeText(execution.branch) || "unknown",
    status: allowedStatuses.includes(execution.status) ? execution.status : "running",
    phase: allowedPhases.includes(execution.phase) ? execution.phase : "queued",
    progress: normalizeProgress(execution.progress),
    currentStep: normalizeText(execution.currentStep),
    touchedFiles: normalizeStringList(execution.touchedFiles),
    prUrl: normalizeText(execution.prUrl) || null,
    blocker: normalizeText(execution.blocker) || null,
    lastUpdatedAt: normalizeTimestamp(execution.lastUpdatedAt),
    nextHumanAction: normalizeText(execution.nextHumanAction) || "wait",
    returnThreadUrl: normalizeText(execution.returnThreadUrl) || null,
    notifications: normalizeStringList(execution.notifications)
  };
}

function stripRuntimeOnlyFields(execution) {
  const { createdFromEvent, ...safeExecution } = execution;
  return safeExecution;
}

function renderDashboard({ executions, env, url }) {
  const cards = executions.map(renderExecutionCard).join("");
  const decisions = buildDecisionItems(executions).length;
  const notifications = buildNotifications(executions).length;
  return page({
    title: "VTDD v3 Orchestrator",
    body: `
      <section class="hero">
        <p class="eyebrow">Cloudflare control plane</p>
        <h1>VTDD v3 Orchestrator</h1>
        <p>Multi-repo VPS Codex CLI executions, PRs, blockers, and human decisions in one owner-facing dashboard.</p>
        <div class="meta">
          <span>Mode: ${escapeHtml(env?.VTDD_V3_MODE || "unknown")}</span>
          <span>${executions.length} executions</span>
          <span>${decisions} decisions</span>
          <span>${notifications} notifications</span>
        </div>
        <div class="actions hero-actions">
          <a class="button primary" href="/dispatch">Dispatch</a>
          <a class="button" href="/decisions">Human decisions</a>
          <a class="button" href="/notifications">Notifications</a>
          <a class="button" href="/api/executions">JSON</a>
        </div>
      </section>
      <section>
        <div class="section-title">
          <h2>Work Inbox</h2>
          <span>Needs you / running / completed</span>
        </div>
        <div class="grid">${cards}</div>
      </section>
      <section>
        <div class="section-title">
          <h2>v3 Issues</h2>
          <span>GitHub-backed planning seeds</span>
        </div>
        <div class="issue-list">${issueCatalog.map(renderIssueRow).join("")}</div>
      </section>
      <section class="notice">
        <h2>Domain note</h2>
        <p><code>vtdd.hibou-web.com</code> still points at Sakura. Use this Worker URL for now: <code>${escapeHtml(url.origin)}</code>.</p>
      </section>
    `
  });
}

function renderProgress({ execution }) {
  return page({
    title: `${execution.executionId} - VTDD progress`,
    body: `
      <section class="hero">
        <p class="eyebrow">${escapeHtml(execution.repository)} #${escapeHtml(execution.issueNumber)}</p>
        <h1>${escapeHtml(execution.title)}</h1>
        <p>${escapeHtml(execution.currentStep)}</p>
        <div class="actions hero-actions"><a class="button" href="/orchestrator">Dashboard</a><a class="button" href="/decisions">Decisions</a></div>
      </section>
      ${renderExecutionCard(execution, { expanded: true })}
    `
  });
}

function renderDecisions({ executions }) {
  const items = buildDecisionItems(executions);
  return page({
    title: "VTDD human decisions",
    body: `
      <section class="hero">
        <p class="eyebrow">Human gate</p>
        <h1>Decision Queue</h1>
        <p>Merge, deploy, close, retry, and investigation decisions stay owner-visible and governed.</p>
        <div class="actions hero-actions"><a class="button" href="/orchestrator">Dashboard</a><a class="button" href="/api/decisions">JSON</a></div>
      </section>
      <div class="stack">${items.map(renderDecisionItem).join("") || `<p class="muted">No decisions waiting.</p>`}</div>
    `
  });
}

function renderNotifications({ executions }) {
  const notifications = buildNotifications(executions);
  return page({
    title: "VTDD notifications",
    body: `
      <section class="hero">
        <p class="eyebrow">Owner signal</p>
        <h1>Notifications</h1>
        <p>Unread-style events without needing to hunt through ChatGPT threads.</p>
        <div class="actions hero-actions"><a class="button" href="/orchestrator">Dashboard</a><a class="button" href="/api/notifications">JSON</a></div>
      </section>
      <div class="stack">${notifications.map(renderNotification).join("")}</div>
    `
  });
}

function renderDispatch({ url }) {
  return page({
    title: "VTDD dispatch",
    body: `
      <section class="hero">
        <p class="eyebrow">VPS Codex CLI</p>
        <h1>Dispatch Preview</h1>
        <p>This MVP does not execute yet. It prepares the queue shape and progress URL without spending OpenAI API credits from Cloudflare.</p>
        <div class="actions hero-actions"><a class="button" href="/orchestrator">Dashboard</a></div>
      </section>
      <section class="card wide">
        <h2>Start work</h2>
        <form method="post" action="/api/dispatch/preview" class="form-grid">
          <label>Repository <input name="repository" value="marushu/vtdd-v3"></label>
          <label>Issue <input name="issueNumber" value="1"></label>
          <label>Branch <input name="branch" value="codex/issue-1"></label>
          <label>Task <input name="task" value="Build orchestrator dashboard MVP"></label>
          <button class="button primary" type="submit">Preview dispatch JSON</button>
        </form>
        <p class="muted">Worker origin: ${escapeHtml(url.origin)}</p>
      </section>
    `
  });
}

function renderExecutionCard(execution, options = {}) {
  const progress = Math.max(0, Math.min(100, Number(execution.progress || 0)));
  const pr = execution.prUrl
    ? `<a class="button" href="${escapeAttribute(execution.prUrl)}">Open PR</a>`
    : `<span class="muted">PR not created yet</span>`;
  const blocker = execution.blocker
    ? `<p class="blocker">Blocker: ${escapeHtml(execution.blocker)}</p>`
    : "";
  const href = `/progress/${encodeURIComponent(execution.executionId)}`;
  return `
    <article class="card">
      <div class="card-head">
        <div>
          <h3>${escapeHtml(execution.repository)} #${escapeHtml(execution.issueNumber)}</h3>
          <p>${escapeHtml(execution.title)}</p>
        </div>
        <span class="pill ${escapeAttribute(execution.status)}">${escapeHtml(execution.status)}</span>
      </div>
      <div class="bar"><span style="width:${progress}%"></span></div>
      <dl>
        <div><dt>Phase</dt><dd>${escapeHtml(execution.phase)}</dd></div>
        <div><dt>Branch</dt><dd>${escapeHtml(execution.branch)}</dd></div>
        <div><dt>Updated</dt><dd>${escapeHtml(formatDate(execution.lastUpdatedAt))}</dd></div>
        <div><dt>Next</dt><dd>${escapeHtml(execution.nextHumanAction)}</dd></div>
      </dl>
      <p>${escapeHtml(execution.currentStep)}</p>
      ${(execution.touchedFiles || []).length ? `<p class="muted">Files: ${escapeHtml(execution.touchedFiles.join(", "))}</p>` : ""}
      ${blocker}
      <div class="actions">
        <a class="button" href="${escapeAttribute(href)}">Progress</a>
        ${pr}
      </div>
      ${options.expanded ? `<pre>${escapeHtml(JSON.stringify(execution, null, 2))}</pre>` : ""}
    </article>
  `;
}

function renderIssueRow(issue) {
  return `<a class="row-link" href="https://github.com/marushu/vtdd-v3/issues/${escapeAttribute(issue.number)}"><strong>#${escapeHtml(issue.number)}</strong><span>${escapeHtml(issue.title)}</span><em>${escapeHtml(issue.status)}</em></a>`;
}

function renderDecisionItem(item) {
  return `<article class="card wide"><h3>${escapeHtml(item.label)}</h3><p>${escapeHtml(item.reason)}</p><div class="actions"><a class="button" href="${escapeAttribute(item.progressUrl)}">Progress</a>${item.prUrl ? `<a class="button" href="${escapeAttribute(item.prUrl)}">PR</a>` : ""}</div><p class="muted">Authority: ${escapeHtml(item.authority)}</p></article>`;
}

function renderNotification(item) {
  return `<article class="card wide"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.message)}</p><p class="muted">${escapeHtml(formatDate(item.createdAt))} / ${escapeHtml(item.executionId)}</p><a class="button" href="${escapeAttribute(item.progressUrl)}">Open progress</a></article>`;
}

function buildDecisionItems(executions) {
  return executions
    .filter((execution) => ["issue_close_review", "merge_review", "deploy_review", "investigate"].includes(execution.nextHumanAction))
    .map((execution) => ({
      executionId: execution.executionId,
      label: `${execution.repository} #${execution.issueNumber}: ${execution.nextHumanAction}`,
      reason: execution.currentStep,
      authority: authorityForNextAction(execution.nextHumanAction),
      progressUrl: `/progress/${encodeURIComponent(execution.executionId)}`,
      prUrl: execution.prUrl
    }));
}

function buildNotifications(executions) {
  return executions.flatMap((execution) =>
    (execution.notifications || []).map((message, index) => ({
      executionId: execution.executionId,
      title: `${execution.repository} #${execution.issueNumber}`,
      message,
      progressUrl: `/progress/${encodeURIComponent(execution.executionId)}`,
      createdAt: new Date(Date.parse(execution.lastUpdatedAt || new Date()) + index).toISOString()
    }))
  );
}

function buildDispatchPreview({ body, origin }) {
  const repository = normalizeText(body.repository) || "marushu/vtdd-v3";
  const issueNumber = Number(body.issueNumber || 0) || null;
  const branch = normalizeText(body.branch) || (issueNumber ? `codex/issue-${issueNumber}` : "codex/dashboard-dispatch");
  const executionId = `remote-codex-${repository.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${issueNumber || "adhoc"}`;
  return {
    executionId,
    repository,
    issueNumber,
    branch,
    task: normalizeText(body.task) || "Build VTDD v3 dashboard work item",
    progressUrl: `${origin}/progress/${encodeURIComponent(executionId)}`,
    queue: {
      transport: "vps_runner",
      status: "preview_only",
      writesGitHubQueueComment: false
    },
    authority: "dispatch preview only; execution writes require governed queue integration"
  };
}

function statusForPhase(phase) {
  if (phase === "completed") return "completed";
  if (phase === "failed") return "failed";
  if (phase === "canceled") return "canceled";
  if (phase === "stale") return "stale";
  if (phase === "queued") return "queued";
  if (phase === "waiting_review") return "waiting";
  return "running";
}

function progressForPhase(phase) {
  const progressMap = {
    queued: 2,
    picked_up: 8,
    codex_starting: 14,
    planning: 24,
    editing_files: 45,
    running_tests: 68,
    pushing_branch: 78,
    creating_pr: 86,
    waiting_review: 92,
    completed: 100,
    failed: 100,
    canceled: 100,
    stale: 100
  };
  return progressMap[phase] ?? 0;
}

function phaseLabel(phase) {
  return {
    queued: "Queued for VPS Codex CLI.",
    picked_up: "Runner picked up the execution.",
    codex_starting: "Codex CLI is starting.",
    planning: "Codex is planning the bounded implementation.",
    editing_files: "Codex is editing files.",
    running_tests: "Codex is running validation.",
    pushing_branch: "Codex is pushing the branch.",
    creating_pr: "Codex is creating or updating the PR.",
    waiting_review: "Waiting for owner or reviewer decision.",
    completed: "Execution completed.",
    failed: "Execution failed and needs investigation.",
    canceled: "Execution was canceled.",
    stale: "Execution is stale."
  }[phase] || "Execution updated.";
}

function nextHumanActionForPhase(phase) {
  if (phase === "waiting_review" || phase === "completed") return "merge_review";
  if (phase === "failed" || phase === "stale") return "investigate";
  return "wait";
}

function normalizeIssueNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeProgress(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function normalizeTimestamp(value) {
  const parsed = value ? Date.parse(value) : NaN;
  return new Date(Number.isFinite(parsed) ? parsed : Date.now()).toISOString();
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeText(item).slice(0, 240)).filter(Boolean).slice(0, 20);
}

function mergeNotifications(existing = [], incoming, currentStep) {
  const next = [...normalizeStringList(existing), ...normalizeStringList(incoming)];
  const step = normalizeText(currentStep);
  if (step && next.length === 0) next.push(step);
  return [...new Set(next)].slice(-20);
}

function normalizeUrl(value, origin) {
  const text = normalizeText(value);
  if (!text) return null;
  try {
    const url = new URL(text, origin);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function authorityForNextAction(action) {
  if (action === "issue_close_review" || action === "merge_review" || action === "deploy_review") {
    return "GO + real passkey";
  }
  return "GO if execution is requested";
}

function page({ title, body }) {
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:#f7f8f5; color:#1c2326; }
    body { margin:0; }
    main { width:min(1120px, calc(100% - 32px)); margin:0 auto; padding:28px 0 48px; }
    .hero { padding:24px 0 22px; border-bottom:1px solid #d7ddd2; margin-bottom:24px; }
    .eyebrow { margin:0 0 8px; color:#52635b; font-size:13px; text-transform:uppercase; letter-spacing:.08em; }
    h1 { margin:0; font-size:34px; line-height:1.08; }
    h2, h3, p { margin-top:0; }
    .hero p:not(.eyebrow) { max-width:760px; color:#4c5b55; font-size:16px; line-height:1.6; margin:12px 0 0; }
    .meta, .actions, .card-head, .section-title { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
    .hero-actions { margin-top:18px; }
    .meta span { border:1px solid #cbd5cc; border-radius:999px; padding:6px 10px; color:#52635b; font-size:13px; }
    .section-title { justify-content:space-between; margin:28px 0 12px; }
    .section-title span, .muted { color:#64736c; font-size:14px; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px; }
    .stack { display:grid; gap:12px; }
    .card, .notice { background:#fff; border:1px solid #dce3dc; border-radius:8px; padding:16px; box-shadow:0 8px 22px rgba(30, 44, 36, .06); }
    .wide { max-width:780px; }
    .card-head { justify-content:space-between; align-items:flex-start; }
    .card h3 { margin:0 0 4px; font-size:17px; }
    .card p { color:#4d5b56; line-height:1.5; }
    .pill { border-radius:999px; padding:5px 9px; font-size:12px; background:#edf3ee; color:#285544; }
    .pill.completed { background:#e9f5ed; color:#1d6b3d; }
    .pill.running { background:#fff4d9; color:#70520a; }
    .bar { height:9px; background:#e5eae4; border-radius:999px; overflow:hidden; margin:14px 0; }
    .bar span { display:block; height:100%; background:#24775a; border-radius:inherit; }
    dl { display:grid; grid-template-columns:1fr 1fr; gap:8px 12px; margin:0 0 12px; }
    dt { color:#6b7973; font-size:12px; }
    dd { margin:2px 0 0; font-size:14px; overflow-wrap:anywhere; }
    .button { display:inline-flex; min-height:36px; align-items:center; justify-content:center; padding:0 12px; border-radius:6px; border:1px solid #bac8bf; color:#173f31; text-decoration:none; background:#f3f7f3; }
    .button.primary { background:#216b52; border-color:#216b52; color:#fff; }
    .blocker { color:#8a2f21; }
    pre { overflow:auto; background:#f4f6f3; border:1px solid #d9e0d8; border-radius:6px; padding:12px; }
    .issue-list { display:grid; gap:8px; }
    .row-link { display:grid; grid-template-columns:auto 1fr auto; gap:10px; align-items:center; padding:10px 12px; border:1px solid #dce3dc; border-radius:6px; background:#fff; color:#1c342b; text-decoration:none; }
    .row-link em { color:#64736c; font-style:normal; font-size:13px; }
    .form-grid { display:grid; gap:12px; }
    label { display:grid; gap:5px; color:#52635b; }
    input { min-height:38px; border:1px solid #cbd5cc; border-radius:6px; padding:0 10px; font:inherit; }
  </style>
</head>
<body><main>${body}</main></body>
</html>`;
}

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" }
  });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function formatDate(value) {
  if (!value) return "unknown";
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Tokyo"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
