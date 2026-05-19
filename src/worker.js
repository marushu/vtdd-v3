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
    nextHumanAction: "wait"
  },
  {
    executionId: "remote-codex-issue424-closed",
    repository: "marushu/vtdd-v2-p",
    issueNumber: 424,
    title: "Deploy operator repositoryInput guard",
    branch: "codex/fix-deploy-operator-repo-required",
    status: "completed",
    phase: "pr_ready",
    progress: 100,
    currentStep: "Merged and deployed. Runtime guard is live.",
    prUrl: "https://github.com/marushu/vtdd-v2-p/pull/425",
    blocker: null,
    lastUpdatedAt: "2026-05-19T04:54:49.000Z",
    nextHumanAction: "issue_close_review"
  }
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/orchestrator") {
      return html(renderDashboard({ executions: sampleExecutions, env }));
    }

    if (url.pathname.startsWith("/progress/")) {
      const executionId = decodeURIComponent(url.pathname.slice("/progress/".length));
      const execution = sampleExecutions.find((item) => item.executionId === executionId);
      if (!execution) {
        return json({ ok: false, error: "execution_not_found", executionId }, 404);
      }
      return html(renderProgress({ execution }));
    }

    if (url.pathname === "/api/executions") {
      return json({ ok: true, executions: sampleExecutions });
    }

    if (url.pathname.startsWith("/api/executions/")) {
      const executionId = decodeURIComponent(url.pathname.slice("/api/executions/".length));
      const execution = sampleExecutions.find((item) => item.executionId === executionId);
      if (!execution) {
        return json({ ok: false, error: "execution_not_found", executionId }, 404);
      }
      return json({ ok: true, execution });
    }

    if (url.pathname === "/health") {
      return json({ ok: true, service: "vtdd-v3-orchestrator", mode: env?.VTDD_V3_MODE || "unknown" });
    }

    return json({ ok: false, error: "not_found" }, 404);
  }
};

function renderDashboard({ executions, env }) {
  const cards = executions.map(renderExecutionCard).join("");
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
        </div>
      </section>
      <section>
        <div class="section-title">
          <h2>Work Inbox</h2>
          <span>Needs you / running / completed</span>
        </div>
        <div class="grid">${cards}</div>
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
      </section>
      ${renderExecutionCard(execution, { expanded: true })}
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
      ${blocker}
      <div class="actions">
        <a class="button" href="${escapeAttribute(href)}">Progress</a>
        ${pr}
      </div>
      ${options.expanded ? `<pre>${escapeHtml(JSON.stringify(execution, null, 2))}</pre>` : ""}
    </article>
  `;
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
    .meta span { border:1px solid #cbd5cc; border-radius:999px; padding:6px 10px; color:#52635b; font-size:13px; }
    .section-title { justify-content:space-between; margin-bottom:12px; }
    .section-title span, .muted { color:#64736c; font-size:14px; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px; }
    .card { background:#fff; border:1px solid #dce3dc; border-radius:8px; padding:16px; box-shadow:0 8px 22px rgba(30, 44, 36, .06); }
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
    .blocker { color:#8a2f21; }
    pre { overflow:auto; background:#f4f6f3; border:1px solid #d9e0d8; border-radius:6px; padding:12px; }
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
