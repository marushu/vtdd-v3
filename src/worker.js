const EXECUTION_STORE_KEY = "vtdd:v3:executions";
const CHAT_STORE_KEY = "vtdd:v3:chats";

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

const allowedDispatchTaskTypes = ["implementation", "investigation", "docs", "tests", "review"];
const forbiddenDispatchTaskTypes = ["merge", "deploy", "close_issue", "credential", "dns", "delete"];
const allowedChatStatuses = ["active", "pinned", "archived", "cold"];
const forbiddenChatFields = ["rawTranscript", "rawLog", "terminalStream", "chainOfThought", "secret", "token", "approvalGrant", "approvalGrantId", "password", "privateKey"];

const sampleExecutions = [
  {
    executionId: "remote-codex-issue426-1f5bdj",
    repository: "marushu/vtdd-v2-p",
    issueNumber: 426,
    title: "Butler 初動応答の高速化",
    branch: "codex/issue-426",
    status: "running",
    phase: "editing_files",
    progress: 42,
    currentStep: "Custom GPT setup instructions と docs test を更新中。",
    prUrl: null,
    blocker: null,
    lastUpdatedAt: "2026-05-19T05:40:00.000Z",
    nextHumanAction: "wait",
    returnThreadUrl: null,
    notifications: ["Runner が queue を取得しました", "次に docs test を実行予定です"]
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
    currentStep: "merge / deploy 済み。runtime guard は反映済み。",
    prUrl: "https://github.com/marushu/vtdd-v2-p/pull/425",
    blocker: null,
    lastUpdatedAt: "2026-05-19T04:54:49.000Z",
    nextHumanAction: "issue_close_review",
    returnThreadUrl: null,
    notifications: ["PR は merge 済み", "Cloudflare deploy 成功", "Issue close 判断待ちです"]
  },
  {
    executionId: "remote-codex-v3-dashboard-mvp",
    repository: "marushu/vtdd-v3",
    issueNumber: 1,
    title: "Cloudflare オーケストレーターダッシュボード MVP",
    branch: "main",
    status: "running",
    phase: "running_tests",
    progress: 76,
    currentStep: "最初の dashboard Worker URL を公開中。",
    prUrl: "https://github.com/marushu/vtdd-v3",
    blocker: null,
    lastUpdatedAt: "2026-05-19T06:10:00.000Z",
    nextHumanAction: "review_dashboard",
    returnThreadUrl: null,
    notifications: ["Repository 作成済み", "初期 Issue 作成済み", "Dashboard deploy 進行中"]
  }
];

const sampleChats = [
  {
    chatId: "chat-vtdd-v3-issue5-runner-pickup-20260519-001",
    repository: "marushu/vtdd-v3",
    issueNumber: 5,
    prNumber: null,
    executionId: "remote-codex-marushu-vtdd-v3-5-mpc98fda",
    title: "VPS runner pickup adapter",
    status: "active",
    summary: "Dashboard dispatch から VPS runner が queue を拾えるようにする作業。dry-run runner は live 確認済み。",
    lastMessage: "次は VPS 常駐化と runner token gate を別スライスで扱う。",
    tags: ["runner", "dashboard", "queue"],
    createdAt: "2026-05-19T06:45:00.000Z",
    updatedAt: "2026-05-19T06:55:00.000Z",
    messages: [
      { role: "owner", text: "VPS Codex CLI が dashboard queue を拾えるようにしたい。", createdAt: "2026-05-19T06:45:00.000Z" },
      { role: "butler", text: "dry-run runner で queue claim と progress 更新を確認済み。", createdAt: "2026-05-19T06:55:00.000Z" }
    ]
  },
  {
    chatId: "chat-vtdd-v2-p-issue424-deploy-guard-20260519-001",
    repository: "marushu/vtdd-v2-p",
    issueNumber: 424,
    prNumber: 425,
    executionId: "remote-codex-issue424-closed",
    title: "deploy operator repositoryInput guard",
    status: "archived",
    summary: "deploy operator が repositoryInput なしで進めてしまう問題を修正し、PR #425 merge / deploy まで完了した。",
    lastMessage: "残る確認は実機 Butler で repo が入ることと空 repo で進まないこと。",
    tags: ["deploy", "guard", "closed"],
    createdAt: "2026-05-19T04:20:00.000Z",
    updatedAt: "2026-05-19T04:58:00.000Z",
    messages: [
      { role: "owner", text: "Issue 番号や PR 番号なしでも deploy できないの？", createdAt: "2026-05-19T04:20:00.000Z" },
      { role: "butler", text: "repositoryInput guard を修正し、runtime 反映まで完了。", createdAt: "2026-05-19T04:58:00.000Z" }
    ]
  }
];

const issueCatalog = [
  { number: 1, title: "Epic: VTDD v3 Cloudflare オーケストレーターダッシュボード", status: "open" },
  { number: 2, title: "VPS Codex CLI 進捗イベント契約", status: "open" },
  { number: 3, title: "人間の判断キュー", status: "open" },
  { number: 4, title: "オーナー通知", status: "open" },
  { number: 5, title: "Dashboard から VPS Codex CLI へ開発を投げる", status: "open" },
  { number: 6, title: "vtdd.hibou-web.com の Cloudflare 移行検討", status: "open" },
  { number: 7, title: "v3 GitHub App 権限と runner 認証情報", status: "planned" },
  { number: 8, title: "リポジトリ別の開発チャット", status: "open" },
  { number: 9, title: "VPS Codex CLI の返事を開発チャットへ返す", status: "open" },
  { number: 10, title: "Dashboard を対象 GitHub アカウントだけに制限する", status: "planned" },
  { number: 11, title: "既存 RAG に開発チャットを保存・検索できるようにする", status: "planned" },
  { number: 12, title: "開発チャットの rollover / continuation", status: "planned" },
  { number: 13, title: "Voice/Text Driven Development のマイク入力", status: "planned" },
  { number: 14, title: "Butler intent router for dashboard chat", status: "planned" },
  { number: 15, title: "VPS 常駐 runner と token gate", status: "planned" },
  { number: 16, title: "chat / execution の realtime 更新", status: "planned" },
  { number: 17, title: "同一 repository 並行開発の conflict-aware scheduler", status: "planned" },
  { number: 18, title: "Codex Security を reviewer signal として取り込む", status: "planned" }
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const executions = await listExecutions(env);
    const chats = await listChats(env);

    if (url.pathname === "/" || url.pathname === "/orchestrator") {
      return html(renderDashboard({ executions, chats, env, url }));
    }

    const repositoryChatsMatch = url.pathname.match(/^\/repositories\/([^/]+)\/([^/]+)\/chats$/);
    if (repositoryChatsMatch) {
      const repository = `${decodeURIComponent(repositoryChatsMatch[1])}/${decodeURIComponent(repositoryChatsMatch[2])}`;
      return html(renderRepositoryChats({ repository, chats, executions }));
    }

    if (url.pathname.startsWith("/chats/")) {
      const chatId = decodeURIComponent(url.pathname.slice("/chats/".length));
      const chat = chats.find((item) => item.chatId === chatId);
      if (!chat) {
        return json({ ok: false, error: "chat_not_found", chatId }, 404);
      }
      return html(renderChatDetail({ chat, executions }));
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

    if (url.pathname === "/api/chats" && request.method === "GET") {
      return json({ ok: true, chats: filterChats(chats, url.searchParams) });
    }

    if (url.pathname === "/api/chats/search" && request.method === "GET") {
      const results = searchChats(chats, url.searchParams);
      return json({ ok: true, results });
    }

    if (url.pathname === "/api/chats" && request.method === "POST") {
      const body = await readBody(request);
      const validation = validateChatInput(body);
      if (!validation.ok) {
        return json(validation, 400);
      }
      const chat = buildChatRecord(body);
      chats.unshift(chat);
      await saveChats(env, chats);
      return json({ ok: true, chat, chatUrl: `/chats/${encodeURIComponent(chat.chatId)}` }, 201);
    }

    const chatMessageMatch = url.pathname.match(/^\/api\/chats\/([^/]+)\/messages$/);
    if (chatMessageMatch && request.method === "POST") {
      const chatId = decodeURIComponent(chatMessageMatch[1]);
      const body = await readBody(request);
      const result = appendChatMessage(chats, chatId, body);
      if (!result.ok) {
        return json(result, result.statusCode || 400);
      }
      await saveChats(env, chats);
      return json({ ok: true, chat: result.chat, message: result.message }, 201);
    }

    if (url.pathname.startsWith("/api/chats/")) {
      const chatId = decodeURIComponent(url.pathname.slice("/api/chats/".length));
      const chat = chats.find((item) => item.chatId === chatId);
      if (!chat) {
        return json({ ok: false, error: "chat_not_found", chatId }, 404);
      }
      return json({ ok: true, chat });
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
      const body = await readBody(request);
      const preview = buildDispatchPreview({ body, origin: url.origin });
      return json({ ok: true, preview }, 202);
    }

    if (url.pathname === "/api/dispatch" && request.method === "POST") {
      const body = await readBody(request);
      const validation = validateDispatch(body);
      if (!validation.ok) {
        return json(validation, 400);
      }
      const dispatch = buildDispatchRecord({ body, origin: url.origin });
      executions.unshift(dispatch.execution);
      await saveExecutions(env, executions);
      return json({
        ok: true,
        dispatch: dispatch.queue,
        execution: dispatch.execution,
        progressUrl: dispatch.progressUrl
      }, 202);
    }

    if (url.pathname === "/api/runner/queue" && request.method === "GET") {
      const limit = Math.max(1, Math.min(10, Number(url.searchParams.get("limit") || 5)));
      const queue = executions
        .filter((execution) => execution.status === "queued" && execution.phase === "queued")
        .slice(0, limit)
        .map((execution) => ({
          executionId: execution.executionId,
          repository: execution.repository,
          issueNumber: execution.issueNumber,
          title: execution.title,
          branch: execution.branch,
          currentStep: execution.currentStep,
          progressUrl: `${url.origin}/progress/${encodeURIComponent(execution.executionId)}`
        }));
      return json({ ok: true, queue });
    }

    if (url.pathname === "/api/runner/claim" && request.method === "POST") {
      const body = await readBody(request);
      const result = claimExecution({ executions, body, origin: url.origin });
      if (!result.ok) {
        return json(result, result.statusCode || 400);
      }
      await saveExecutions(env, executions);
      return json(result, 200);
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

async function listChats(env) {
  const store = env?.EXECUTION_STORE;
  if (!store?.get) {
    return sampleChats.map((chat) => normalizeChat(chat));
  }

  const raw = await store.get(CHAT_STORE_KEY);
  if (!raw) {
    return sampleChats.map((chat) => normalizeChat(chat));
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((chat) => normalizeChat(chat));
    }
  } catch {
    return sampleChats.map((chat) => normalizeChat(chat));
  }

  return sampleChats.map((chat) => normalizeChat(chat));
}

async function saveChats(env, chats) {
  const store = env?.EXECUTION_STORE;
  if (!store?.put) return false;
  await store.put(CHAT_STORE_KEY, JSON.stringify(chats.map(normalizeChat)));
  return true;
}

async function readBody(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return request.json().catch(() => ({}));
  }
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    return Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)]));
  }
  return {};
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

function renderDashboard({ executions, chats, env, url }) {
  const cards = executions.map(renderExecutionCard).join("");
  const decisions = buildDecisionItems(executions).length;
  const notifications = buildNotifications(executions).length;
  const repositorySummaries = buildRepositorySummaries(executions, chats);
  return page({
    title: "VTDD v3 オーケストレーター",
    body: `
      <section class="hero">
        <p class="eyebrow">Cloudflare control plane</p>
        <h1>VTDD v3 オーケストレーター</h1>
        <p>複数リポジトリの VPS Codex CLI 実行、PR、blocker、人間の判断待ちをひとつの画面で見るための dashboard です。</p>
        <div class="meta">
          <span>モード: ${escapeHtml(env?.VTDD_V3_MODE || "unknown")}</span>
          <span>${executions.length} 件の実行</span>
          <span>${chats.length} 件のチャット</span>
          <span>${decisions} 件の判断待ち</span>
          <span>${notifications} 件の通知</span>
        </div>
        <div class="actions hero-actions">
          <a class="button primary" href="/dispatch">開発を投げる</a>
          <a class="button" href="/decisions">判断待ち</a>
          <a class="button" href="/notifications">通知</a>
          <a class="button" href="/api/executions">JSON</a>
        </div>
      </section>
      <section>
        <div class="section-title">
          <h2>リポジトリ別の進捗</h2>
          <span>repo ごとの実行数 / 平均進捗 / 次の判断</span>
        </div>
        <div class="repo-grid">${repositorySummaries.map(renderRepositorySummary).join("")}</div>
      </section>
      <section>
        <div class="section-title">
          <h2>進行中の開発</h2>
          <span>判断待ち / 実行中 / 完了</span>
        </div>
        <div class="grid">${cards}</div>
      </section>
      <section>
        <div class="section-title">
          <h2>v3 Issues</h2>
          <span>GitHub を source of truth にした計画</span>
        </div>
        <div class="issue-list">${issueCatalog.map(renderIssueRow).join("")}</div>
      </section>
      <section class="notice">
        <h2>ドメインメモ</h2>
        <p><code>vtdd.hibou-web.com</code> はまだ Sakura を向いています。今はこの Worker URL を使います: <code>${escapeHtml(url.origin)}</code></p>
      </section>
    `
  });
}

function renderProgress({ execution }) {
  const repoUrl = repositoryUrl(execution.repository);
  const issueUrl = issueUrlFor(execution);
  return page({
    title: `${execution.executionId} - VTDD progress`,
    body: `
      <section class="hero">
        <p class="eyebrow">${escapeHtml(execution.repository)} #${escapeHtml(execution.issueNumber)}</p>
        <h1>${escapeHtml(execution.title)}</h1>
        <p>${escapeHtml(execution.currentStep)}</p>
        <div class="actions hero-actions">
          <a class="button" href="/orchestrator">Dashboard</a>
          <a class="button" href="/decisions">判断待ち</a>
          <a class="button" href="${escapeAttribute(repoUrl)}">Repository</a>
          ${issueUrl ? `<a class="button" href="${escapeAttribute(issueUrl)}">Issue</a>` : ""}
          ${execution.prUrl ? `<a class="button" href="${escapeAttribute(execution.prUrl)}">${escapeHtml(linkLabelForPrUrl(execution.prUrl))}</a>` : ""}
        </div>
      </section>
      ${renderExecutionCard(execution, { expanded: true })}
    `
  });
}

function renderRepositoryChats({ repository, chats, executions }) {
  const repoChats = chats
    .filter((chat) => chat.repository === repository)
    .sort((a, b) => Date.parse(b.updatedAt || 0) - Date.parse(a.updatedAt || 0));
  const repoExecutions = executions.filter((execution) => execution.repository === repository);
  return page({
    title: `${repository} - 開発チャット`,
    body: `
      <section class="hero">
        <p class="eyebrow">Repository chats</p>
        <h1>${escapeHtml(repository)} の開発チャット</h1>
        <p>Issue / PR / execution に紐づいた会話を、ChatGPT thread 一覧ではなく VTDD dashboard 側で探せるようにします。</p>
        <div class="meta">
          <span>${repoChats.length} 件のチャット</span>
          <span>${repoExecutions.length} 件の execution</span>
        </div>
        <div class="actions hero-actions">
          <a class="button" href="/orchestrator">Dashboard</a>
          <a class="button" href="${escapeAttribute(repositoryUrl(repository))}">Repository</a>
          <a class="button" href="/api/chats?repository=${encodeURIComponent(repository)}">JSON</a>
          <a class="button" href="/api/chats/search?q=${encodeURIComponent(repository)}">検索 JSON</a>
        </div>
      </section>
      <section>
        <div class="section-title">
          <h2>Active / pinned</h2>
          <span>今見るべきチャット</span>
        </div>
        <div class="grid">${repoChats.filter((chat) => ["active", "pinned"].includes(chat.status)).map(renderChatCard).join("") || `<p class="muted">active chat はありません。</p>`}</div>
      </section>
      <section>
        <div class="section-title">
          <h2>Archived</h2>
          <span>summary-first で残す履歴</span>
        </div>
        <div class="grid">${repoChats.filter((chat) => ["archived", "cold"].includes(chat.status)).map(renderChatCard).join("") || `<p class="muted">archived chat はありません。</p>`}</div>
      </section>
    `
  });
}

function renderChatDetail({ chat, executions }) {
  const execution = executions.find((item) => item.executionId === chat.executionId);
  return page({
    title: `${chat.chatId} - VTDD chat`,
    body: `
      <section class="hero">
        <p class="eyebrow">${escapeHtml(chat.repository)} / ${escapeHtml(displayChatStatus(chat.status))}</p>
        <h1>${escapeHtml(chat.title)}</h1>
        <p>${escapeHtml(chat.summary)}</p>
        <div class="actions hero-actions">
          <a class="button" href="/repositories/${encodeURIComponent(chat.repository.split("/")[0])}/${encodeURIComponent(chat.repository.split("/")[1])}/chats">Repo chats</a>
          <a class="button" href="${escapeAttribute(repositoryUrl(chat.repository))}">Repository</a>
          ${chat.issueNumber ? `<a class="button" href="${escapeAttribute(repositoryUrl(chat.repository))}/issues/${escapeAttribute(chat.issueNumber)}">Issue</a>` : ""}
          ${chat.prNumber ? `<a class="button" href="${escapeAttribute(repositoryUrl(chat.repository))}/pull/${escapeAttribute(chat.prNumber)}">PR</a>` : ""}
          ${execution ? `<a class="button" href="/progress/${encodeURIComponent(execution.executionId)}">進捗</a>` : ""}
          <a class="button" href="/api/chats/${encodeURIComponent(chat.chatId)}">JSON</a>
        </div>
      </section>
      <section class="card wide">
        <h2>Summary first</h2>
        <p>${escapeHtml(chat.summary)}</p>
        <dl>
          <div><dt>chatId</dt><dd>${escapeHtml(chat.chatId)}</dd></div>
          <div><dt>status</dt><dd>${escapeHtml(displayChatStatus(chat.status))}</dd></div>
          <div><dt>Issue</dt><dd>${escapeHtml(chat.issueNumber || "なし")}</dd></div>
          <div><dt>PR</dt><dd>${escapeHtml(chat.prNumber || "なし")}</dd></div>
          <div><dt>executionId</dt><dd>${escapeHtml(chat.executionId || "なし")}</dd></div>
          <div><dt>更新</dt><dd>${escapeHtml(formatDate(chat.updatedAt))}</dd></div>
        </dl>
        <div class="meta compact">${chat.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
      </section>
      <section>
        <div class="section-title">
          <h2>必要時だけ開く transcript</h2>
          <span>raw log / CoT / secret は保存しない</span>
        </div>
        <div class="stack">${chat.messages.map(renderChatMessage).join("")}</div>
      </section>
      <section class="card wide">
        <h2>message を追加</h2>
        <form method="post" action="/api/chats/${encodeURIComponent(chat.chatId)}/messages" class="form-grid">
          <label>role
            <select name="role">
              <option value="owner">オーナー</option>
              <option value="butler">Butler</option>
              <option value="runner">Runner</option>
              <option value="system">System</option>
            </select>
          </label>
          <label>message <textarea name="text" rows="4" placeholder="この開発チャットに残すメッセージ"></textarea></label>
          <button class="button primary" type="submit">message JSON を追加</button>
        </form>
      </section>
    `
  });
}

function renderDecisions({ executions }) {
  const items = buildDecisionItems(executions);
  return page({
    title: "VTDD 判断待ち",
    body: `
      <section class="hero">
        <p class="eyebrow">Human gate</p>
        <h1>判断待ちキュー</h1>
        <p>merge、deploy、Issue close、retry、調査判断をオーナーが見える場所に集めます。</p>
        <div class="actions hero-actions"><a class="button" href="/orchestrator">Dashboard</a><a class="button" href="/api/decisions">JSON</a></div>
      </section>
      <div class="stack">${items.map(renderDecisionItem).join("") || `<p class="muted">判断待ちはありません。</p>`}</div>
    `
  });
}

function renderNotifications({ executions }) {
  const notifications = buildNotifications(executions);
  return page({
    title: "VTDD 通知",
    body: `
      <section class="hero">
        <p class="eyebrow">Owner signal</p>
        <h1>通知</h1>
        <p>ChatGPT スレッドを探し回らずに、開発の変化だけを追える通知一覧です。</p>
        <div class="actions hero-actions"><a class="button" href="/orchestrator">Dashboard</a><a class="button" href="/api/notifications">JSON</a></div>
      </section>
      <div class="stack">${notifications.map(renderNotification).join("")}</div>
    `
  });
}

function renderDispatch({ url }) {
  return page({
    title: "VTDD 開発 dispatch",
    body: `
      <section class="hero">
        <p class="eyebrow">VPS Codex CLI</p>
        <h1>開発を投げる</h1>
        <p>Cloudflare Worker から OpenAI API credit を消費せず、VPS Codex CLI に渡す queue record と progress URL を作ります。</p>
        <div class="actions hero-actions"><a class="button" href="/orchestrator">Dashboard</a></div>
      </section>
      <section class="card wide">
        <h2>作業を作成</h2>
        <form method="post" action="/api/dispatch/preview" class="form-grid">
          <label>Repository <input name="repository" value="marushu/vtdd-v3"></label>
          <label>Issue <input name="issueNumber" value="1"></label>
          <label>Branch <input name="branch" value="codex/issue-1"></label>
          <label>作業種別
            <select name="taskType">
              <option value="implementation">実装</option>
              <option value="investigation">調査</option>
              <option value="docs">ドキュメント</option>
              <option value="tests">テスト</option>
              <option value="review">レビュー</option>
            </select>
          </label>
          <label>作業内容 <input name="task" value="Build orchestrator dashboard MVP"></label>
          <button class="button primary" type="submit">dispatch JSON を preview</button>
        </form>
        <form method="post" action="/api/dispatch" class="form-grid dispatch-form">
          <input type="hidden" name="repository" value="marushu/vtdd-v3">
          <input type="hidden" name="issueNumber" value="5">
          <input type="hidden" name="branch" value="codex/issue-5">
          <input type="hidden" name="taskType" value="implementation">
          <input type="hidden" name="task" value="Create dashboard dispatch queue record">
          <button class="button" type="submit">queued execution を作成</button>
        </form>
        <p class="muted">Worker origin: ${escapeHtml(url.origin)}</p>
      </section>
    `
  });
}

function renderExecutionCard(execution, options = {}) {
  const progress = Math.max(0, Math.min(100, Number(execution.progress || 0)));
  const repoUrl = repositoryUrl(execution.repository);
  const issueUrl = issueUrlFor(execution);
  const pr = execution.prUrl
    ? `<a class="button" href="${escapeAttribute(execution.prUrl)}">${escapeHtml(linkLabelForPrUrl(execution.prUrl))}</a>`
    : `<span class="muted">PR はまだありません</span>`;
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
        <span class="pill ${escapeAttribute(execution.status)}">${escapeHtml(displayStatus(execution.status))}</span>
      </div>
      <div class="bar"><span style="width:${progress}%"></span></div>
      <dl>
        <div><dt>Phase</dt><dd>${escapeHtml(displayPhase(execution.phase))}</dd></div>
        <div><dt>Branch</dt><dd>${escapeHtml(execution.branch)}</dd></div>
        <div><dt>更新</dt><dd>${escapeHtml(formatDate(execution.lastUpdatedAt))}</dd></div>
        <div><dt>次</dt><dd>${escapeHtml(displayNextAction(execution.nextHumanAction))}</dd></div>
      </dl>
      <p>${escapeHtml(execution.currentStep)}</p>
      ${(execution.touchedFiles || []).length ? `<p class="muted">Files: ${escapeHtml(execution.touchedFiles.join(", "))}</p>` : ""}
      ${blocker}
      <div class="actions">
        <a class="button" href="${escapeAttribute(href)}">進捗</a>
        <a class="button" href="${escapeAttribute(repoUrl)}">Repository</a>
        ${issueUrl ? `<a class="button" href="${escapeAttribute(issueUrl)}">Issue</a>` : ""}
        ${pr}
      </div>
      ${options.expanded ? `<pre>${escapeHtml(JSON.stringify(execution, null, 2))}</pre>` : ""}
    </article>
  `;
}

function renderIssueRow(issue) {
  return `<a class="row-link" href="https://github.com/marushu/vtdd-v3/issues/${escapeAttribute(issue.number)}"><strong>#${escapeHtml(issue.number)}</strong><span>${escapeHtml(issue.title)}</span><em>${escapeHtml(issue.status)}</em></a>`;
}

function renderRepositorySummary(summary) {
  const statusItems = Object.entries(summary.statusCounts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => `<span>${escapeHtml(displayStatus(status))}: ${escapeHtml(count)}</span>`)
    .join("");
  const latest = summary.latestExecution;
  return `
    <article class="card repo-card">
      <div class="card-head">
        <div>
          <h3>${escapeHtml(summary.repository)}</h3>
          <p>${escapeHtml(summary.executions.length)} 件の execution</p>
        </div>
        <span class="pill">${escapeHtml(summary.averageProgress)}%</span>
      </div>
      <div class="bar"><span style="width:${summary.averageProgress}%"></span></div>
      <div class="meta compact">${statusItems}</div>
      <p>${escapeHtml(latest.currentStep || "進捗なし")}</p>
      <div class="actions">
        <a class="button" href="${escapeAttribute(summary.repositoryUrl)}">Repository</a>
        <a class="button" href="${escapeAttribute(summary.chatUrl)}">チャット</a>
        ${latest ? `<a class="button" href="/progress/${encodeURIComponent(latest.executionId)}">最新の進捗</a>` : ""}
        ${summary.openPrUrl ? `<a class="button" href="${escapeAttribute(summary.openPrUrl)}">PR</a>` : ""}
      </div>
    </article>
  `;
}

function renderChatCard(chat) {
  return `
    <article class="card chat-card">
      <div class="card-head">
        <div>
          <h3>${escapeHtml(chat.title)}</h3>
          <p>${escapeHtml(chat.repository)}${chat.issueNumber ? ` #${escapeHtml(chat.issueNumber)}` : ""}</p>
        </div>
        <span class="pill ${escapeAttribute(chat.status)}">${escapeHtml(displayChatStatus(chat.status))}</span>
      </div>
      <p>${escapeHtml(chat.summary)}</p>
      <p class="muted">${escapeHtml(chat.lastMessage)}</p>
      <div class="meta compact">${chat.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
      <div class="actions">
        <a class="button" href="/chats/${encodeURIComponent(chat.chatId)}">チャットを開く</a>
        ${chat.issueNumber ? `<a class="button" href="${escapeAttribute(repositoryUrl(chat.repository))}/issues/${escapeAttribute(chat.issueNumber)}">Issue</a>` : ""}
        ${chat.prNumber ? `<a class="button" href="${escapeAttribute(repositoryUrl(chat.repository))}/pull/${escapeAttribute(chat.prNumber)}">PR</a>` : ""}
      </div>
    </article>
  `;
}

function renderChatMessage(message) {
  return `<article class="card wide"><p class="eyebrow">${escapeHtml(displayMessageRole(message.role))} / ${escapeHtml(formatDate(message.createdAt))}</p><p>${escapeHtml(message.text)}</p></article>`;
}

function renderDecisionItem(item) {
  return `<article class="card wide"><h3>${escapeHtml(item.label)}</h3><p>${escapeHtml(item.reason)}</p><div class="actions"><a class="button" href="${escapeAttribute(item.progressUrl)}">進捗</a>${item.prUrl ? `<a class="button" href="${escapeAttribute(item.prUrl)}">PR</a>` : ""}</div><p class="muted">Authority: ${escapeHtml(item.authority)}</p></article>`;
}

function renderNotification(item) {
  return `<article class="card wide"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.message)}</p><p class="muted">${escapeHtml(formatDate(item.createdAt))} / ${escapeHtml(item.executionId)}</p><a class="button" href="${escapeAttribute(item.progressUrl)}">進捗を開く</a></article>`;
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

function buildRepositorySummaries(executions, chats = []) {
  const grouped = new Map();
  for (const execution of executions) {
    const repository = normalizeText(execution.repository) || "unknown";
    if (!grouped.has(repository)) grouped.set(repository, []);
    grouped.get(repository).push(execution);
  }

  return [...grouped.entries()]
    .map(([repository, repoExecutions]) => {
      const sorted = [...repoExecutions].sort((a, b) => Date.parse(b.lastUpdatedAt || 0) - Date.parse(a.lastUpdatedAt || 0));
      const averageProgress = Math.round(
        repoExecutions.reduce((sum, execution) => sum + normalizeProgress(execution.progress), 0) / repoExecutions.length
      );
      return {
        repository,
        repositoryUrl: repositoryUrl(repository),
        chatUrl: repositoryChatsUrl(repository),
        chatCount: chats.filter((chat) => chat.repository === repository).length,
        executions: repoExecutions,
        latestExecution: sorted[0],
        averageProgress,
        openPrUrl: sorted.find((execution) => isPullRequestUrl(execution.prUrl))?.prUrl || null,
        statusCounts: Object.fromEntries(allowedStatuses.map((status) => [
          status,
          repoExecutions.filter((execution) => execution.status === status).length
        ]))
      };
    })
    .sort((a, b) => Date.parse(b.latestExecution?.lastUpdatedAt || 0) - Date.parse(a.latestExecution?.lastUpdatedAt || 0));
}

function filterChats(chats, searchParams) {
  const repository = normalizeText(searchParams.get("repository"));
  const executionId = normalizeText(searchParams.get("executionId"));
  const issueNumber = normalizeIssueNumber(searchParams.get("issueNumber"));
  const q = normalizeText(searchParams.get("q")).toLowerCase();

  return chats
    .filter((chat) => !repository || chat.repository === repository)
    .filter((chat) => !executionId || chat.executionId === executionId)
    .filter((chat) => !issueNumber || chat.issueNumber === issueNumber)
    .filter((chat) => !q || chatSearchText(chat).includes(q))
    .sort(compareChatsByUpdatedAt);
}

function searchChats(chats, searchParams) {
  const q = normalizeText(searchParams.get("q")).toLowerCase();
  const filtered = filterChats(chats, searchParams);
  if (!q) return filtered.map(chatSearchResult);
  return filtered
    .map((chat) => ({ ...chatSearchResult(chat), score: chatSearchScore(chat, q) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || Date.parse(b.updatedAt || 0) - Date.parse(a.updatedAt || 0));
}

function chatSearchResult(chat) {
  return {
    chatId: chat.chatId,
    chatUrl: `/chats/${encodeURIComponent(chat.chatId)}`,
    repository: chat.repository,
    issueNumber: chat.issueNumber,
    prNumber: chat.prNumber,
    executionId: chat.executionId,
    title: chat.title,
    status: chat.status,
    summary: chat.summary,
    updatedAt: chat.updatedAt,
    tags: chat.tags
  };
}

function chatSearchText(chat) {
  return [
    chat.chatId,
    chat.repository,
    chat.issueNumber,
    chat.prNumber,
    chat.executionId,
    chat.title,
    chat.summary,
    chat.lastMessage,
    ...(chat.tags || []),
    ...(chat.messages || []).map((message) => message.text)
  ].join(" ").toLowerCase();
}

function chatSearchScore(chat, q) {
  const text = chatSearchText(chat);
  let score = 0;
  if (chat.title.toLowerCase().includes(q)) score += 8;
  if (chat.summary.toLowerCase().includes(q)) score += 5;
  if (chat.repository.toLowerCase().includes(q)) score += 4;
  if (String(chat.issueNumber || "").includes(q)) score += 3;
  if (String(chat.prNumber || "").includes(q)) score += 3;
  if ((chat.executionId || "").toLowerCase().includes(q)) score += 6;
  if ((chat.tags || []).some((tag) => tag.toLowerCase().includes(q))) score += 4;
  if (text.includes(q)) score += 1;
  return score;
}

function compareChatsByUpdatedAt(a, b) {
  return Date.parse(b.updatedAt || 0) - Date.parse(a.updatedAt || 0);
}

function validateChatInput(body) {
  const forbiddenField = forbiddenChatFields.find((field) => Object.prototype.hasOwnProperty.call(body, field));
  if (forbiddenField) {
    return { ok: false, error: "forbidden_chat_field", field: forbiddenField };
  }

  if (!/^[\w.-]+\/[\w.-]+$/.test(normalizeText(body.repository))) {
    return { ok: false, error: "repository_required" };
  }

  if (!normalizeText(body.title)) {
    return { ok: false, error: "title_required" };
  }

  const status = normalizeText(body.status) || "active";
  if (!allowedChatStatuses.includes(status)) {
    return { ok: false, error: "unsupported_chat_status", allowedChatStatuses };
  }

  return { ok: true };
}

function validateChatMessageInput(body) {
  const forbiddenField = forbiddenChatFields.find((field) => Object.prototype.hasOwnProperty.call(body, field));
  if (forbiddenField) {
    return { ok: false, error: "forbidden_chat_field", field: forbiddenField };
  }
  if (!normalizeText(body.text || body.message)) {
    return { ok: false, error: "message_required" };
  }
  return { ok: true };
}

function appendChatMessage(chats, chatId, body) {
  const validation = validateChatMessageInput(body);
  if (!validation.ok) {
    return { ...validation, statusCode: 400 };
  }
  const index = chats.findIndex((chat) => chat.chatId === chatId);
  if (index < 0) {
    return { ok: false, error: "chat_not_found", chatId, statusCode: 404 };
  }

  const now = new Date().toISOString();
  const message = normalizeChatMessage({
    role: normalizeText(body.role) || "owner",
    text: normalizeText(body.text || body.message).slice(0, 1200),
    createdAt: body.createdAt || now
  });
  const chat = normalizeChat({
    ...chats[index],
    lastMessage: message.text,
    updatedAt: now,
    messages: [...(chats[index].messages || []), message]
  });
  chats[index] = chat;
  return { ok: true, chat, message };
}

function buildChatRecord(body) {
  const now = new Date().toISOString();
  const repository = normalizeText(body.repository);
  const issueNumber = normalizeIssueNumber(body.issueNumber);
  const title = normalizeText(body.title).slice(0, 140);
  const chatId = normalizeText(body.chatId) || buildChatId({ repository, issueNumber, title, now });
  const summary = normalizeText(body.summary).slice(0, 800) || "summary はまだありません。";
  const firstMessage = normalizeText(body.message || body.lastMessage).slice(0, 1000);
  return normalizeChat({
    chatId,
    repository,
    issueNumber,
    prNumber: normalizeIssueNumber(body.prNumber),
    executionId: normalizeText(body.executionId).slice(0, 120) || null,
    title,
    status: normalizeText(body.status) || "active",
    summary,
    lastMessage: firstMessage || summary,
    tags: normalizeStringList(body.tags),
    createdAt: normalizeTimestamp(body.createdAt || now),
    updatedAt: normalizeTimestamp(body.updatedAt || now),
    messages: firstMessage ? [{ role: "owner", text: firstMessage, createdAt: now }] : []
  });
}

function normalizeChat(chat) {
  const messages = Array.isArray(chat.messages) ? chat.messages : [];
  return {
    chatId: normalizeText(chat.chatId).slice(0, 180),
    repository: normalizeText(chat.repository),
    issueNumber: normalizeIssueNumber(chat.issueNumber),
    prNumber: normalizeIssueNumber(chat.prNumber),
    executionId: normalizeText(chat.executionId).slice(0, 140) || null,
    title: normalizeText(chat.title).slice(0, 180) || "Untitled chat",
    status: allowedChatStatuses.includes(chat.status) ? chat.status : "active",
    summary: normalizeText(chat.summary).slice(0, 1200) || "summary はまだありません。",
    lastMessage: normalizeText(chat.lastMessage).slice(0, 1000),
    tags: normalizeStringList(chat.tags),
    createdAt: normalizeTimestamp(chat.createdAt),
    updatedAt: normalizeTimestamp(chat.updatedAt),
    messages: messages.slice(-30).map(normalizeChatMessage).filter((message) => message.text)
  };
}

function normalizeChatMessage(message) {
  return {
    role: ["owner", "butler", "runner", "system"].includes(message?.role) ? message.role : "system",
    text: normalizeText(message?.text).slice(0, 1200),
    createdAt: normalizeTimestamp(message?.createdAt)
  };
}

function buildChatId({ repository, issueNumber, title, now }) {
  const repoSlug = repository.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const titleSlug = title.replace(/[^a-z0-9]+/gi, "-").toLowerCase().replace(/^-|-$/g, "").slice(0, 32) || "chat";
  const date = new Date(now).toISOString().slice(0, 10).replace(/-/g, "");
  return `chat-${repoSlug}-${issueNumber ? `issue${issueNumber}-` : ""}${titleSlug}-${date}-${Date.now().toString(36)}`;
}

function buildDispatchPreview({ body, origin }) {
  const repository = normalizeText(body.repository) || "marushu/vtdd-v3";
  const issueNumber = Number(body.issueNumber || 0) || null;
  const branch = normalizeText(body.branch) || (issueNumber ? `codex/issue-${issueNumber}` : "codex/dashboard-dispatch");
  const taskType = normalizeText(body.taskType) || "implementation";
  const executionId = `remote-codex-${repository.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${issueNumber || "adhoc"}`;
  return {
    executionId,
    repository,
    issueNumber,
    branch,
    taskType,
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

function validateDispatch(body) {
  const taskType = normalizeText(body.taskType) || "implementation";
  if (forbiddenDispatchTaskTypes.includes(taskType)) {
    return { ok: false, error: "high_risk_dispatch_forbidden", taskType };
  }
  if (!allowedDispatchTaskTypes.includes(taskType)) {
    return { ok: false, error: "unsupported_task_type", allowedTaskTypes: allowedDispatchTaskTypes };
  }
  if (!normalizeText(body.repository)) {
    return { ok: false, error: "repository_required" };
  }
  if (!normalizeText(body.task)) {
    return { ok: false, error: "task_required" };
  }
  return { ok: true };
}

function buildDispatchRecord({ body, origin }) {
  const preview = buildDispatchPreview({ body, origin });
  const now = new Date().toISOString();
  const execution = {
    executionId: `${preview.executionId}-${Date.now().toString(36)}`,
    repository: preview.repository,
    issueNumber: preview.issueNumber,
    title: preview.task,
    branch: preview.branch,
    status: "queued",
    phase: "queued",
    progress: 2,
    currentStep: `Queued ${preview.taskType} task for VPS Codex CLI handoff.`,
    touchedFiles: [],
    prUrl: null,
    blocker: null,
    lastUpdatedAt: now,
    nextHumanAction: "wait",
    returnThreadUrl: null,
    notifications: ["Dashboard dispatch created a governed queue record."]
  };
  const progressUrl = `${origin}/progress/${encodeURIComponent(execution.executionId)}`;
  return {
    progressUrl,
    execution,
    queue: {
      executionId: execution.executionId,
      transport: "vps_runner",
      status: "queued",
      taskType: preview.taskType,
      progressUrl,
      authority: "No high-risk action executed by dispatch."
    }
  };
}

function claimExecution({ executions, body, origin }) {
  const executionId = normalizeText(body.executionId);
  const runnerId = normalizeText(body.runnerId).slice(0, 80) || "vps-codex-runner";
  if (!executionId) {
    return { ok: false, error: "executionId_required", statusCode: 400 };
  }

  const index = executions.findIndex((execution) => execution.executionId === executionId);
  if (index < 0) {
    return { ok: false, error: "execution_not_found", executionId, statusCode: 404 };
  }

  const execution = executions[index];
  if (execution.status !== "queued" || execution.phase !== "queued") {
    return {
      ok: false,
      error: "execution_not_claimable",
      executionId,
      status: execution.status,
      phase: execution.phase,
      statusCode: 409
    };
  }

  const claimed = {
    ...execution,
    status: "running",
    phase: "picked_up",
    progress: 8,
    currentStep: `Runner ${runnerId} picked up the queued execution.`,
    lastUpdatedAt: new Date().toISOString(),
    notifications: mergeNotifications(execution.notifications, [`Runner ${runnerId} claimed execution.`])
  };
  executions[index] = claimed;
  return {
    ok: true,
    execution: claimed,
    progressUrl: `${origin}/progress/${encodeURIComponent(executionId)}`
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

function repositoryUrl(repository) {
  const text = normalizeText(repository);
  if (!/^[\w.-]+\/[\w.-]+$/.test(text)) return "https://github.com";
  return `https://github.com/${text}`;
}

function repositoryChatsUrl(repository) {
  const [owner, repo] = normalizeText(repository).split("/");
  if (!owner || !repo) return "/orchestrator";
  return `/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/chats`;
}

function issueUrlFor(execution) {
  if (!execution.issueNumber) return null;
  return `${repositoryUrl(execution.repository)}/issues/${encodeURIComponent(execution.issueNumber)}`;
}

function isPullRequestUrl(value) {
  return /\/pull\/\d+\/?$/.test(normalizeText(value));
}

function linkLabelForPrUrl(value) {
  return isPullRequestUrl(value) ? "PR を開く" : "関連リンク";
}

function authorityForNextAction(action) {
  if (action === "issue_close_review" || action === "merge_review" || action === "deploy_review") {
    return "GO + real passkey";
  }
  return "GO if execution is requested";
}

function displayStatus(status) {
  return {
    queued: "待機中",
    running: "実行中",
    waiting: "判断待ち",
    completed: "完了",
    failed: "失敗",
    canceled: "キャンセル",
    stale: "停滞"
  }[status] || status;
}

function displayPhase(phase) {
  return {
    queued: "queue 待機",
    picked_up: "runner 取得済み",
    codex_starting: "Codex 起動中",
    planning: "計画中",
    editing_files: "ファイル編集中",
    running_tests: "テスト実行中",
    pushing_branch: "branch push 中",
    creating_pr: "PR 作成中",
    waiting_review: "レビュー待ち",
    completed: "完了",
    failed: "失敗",
    canceled: "キャンセル",
    stale: "停滞"
  }[phase] || phase;
}

function displayNextAction(action) {
  return {
    wait: "待つ",
    issue_close_review: "Issue close 判断",
    merge_review: "merge 判断",
    deploy_review: "deploy 判断",
    investigate: "調査",
    review_dashboard: "dashboard 確認"
  }[action] || action;
}

function displayChatStatus(status) {
  return {
    active: "進行中",
    pinned: "固定",
    archived: "アーカイブ",
    cold: "保管"
  }[status] || status;
}

function displayMessageRole(role) {
  return {
    owner: "オーナー",
    butler: "Butler",
    runner: "Runner",
    system: "System"
  }[role] || role;
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
    .meta.compact { margin:10px 0 12px; }
    .hero-actions { margin-top:18px; }
    .meta span { border:1px solid #cbd5cc; border-radius:999px; padding:6px 10px; color:#52635b; font-size:13px; }
    .section-title { justify-content:space-between; margin:28px 0 12px; }
    .section-title span, .muted { color:#64736c; font-size:14px; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px; }
    .repo-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:14px; }
    .stack { display:grid; gap:12px; }
    .card, .notice { background:#fff; border:1px solid #dce3dc; border-radius:8px; padding:16px; box-shadow:0 8px 22px rgba(30, 44, 36, .06); }
    .wide { max-width:780px; }
    .repo-card { border-left:4px solid #2e7359; }
    .chat-card { border-left:4px solid #746c2d; }
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
    input, select, textarea { min-height:38px; border:1px solid #cbd5cc; border-radius:6px; padding:8px 10px; font:inherit; background:#fff; }
    textarea { resize:vertical; line-height:1.45; }
    .dispatch-form { margin-top:16px; padding-top:16px; border-top:1px solid #e1e6df; }
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
