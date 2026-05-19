import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const navItems = [
  { href: "/orchestrator", label: "ダッシュボード" },
  { href: "/repositories", label: "リポジトリ" },
  { href: "/chats", label: "チャット" },
  { href: "/deploys", label: "デプロイ" },
  { href: "/decisions", label: "判断待ち" },
  { href: "/notifications/settings", label: "通知設定" }
];

const passkeyUrl = "/approval/passkey/operator?repositoryInput=marushu%2Fvtdd-v3&phase=execution&actionType=deploy_production&highRiskKind=deploy_production&issueNumber=6";
const deployRunsApiUrl = "/api/github/deploy-runs?targetRepository=marushu%2Fvtdd-v3&workflowRepository=marushu%2Fvtdd-v3&workflow=deploy-production.yml";

function App() {
  const [executions, setExecutions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [repositoryRecords, setRepositoryRecords] = useState([]);
  const [chats, setChats] = useState([]);
  const [settings, setSettings] = useState(null);
  const [eventTypes, setEventTypes] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState(null);
  const path = window.location.pathname;

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {});
    }
  }, []);

  const load = useCallback(async ({ active = true } = {}) => {
    setLoading(true);
    try {
      const [executionsRes, notificationsRes, repositoriesRes, chatsRes, settingsRes, decisionsRes] = await Promise.all([
        fetch("/api/executions"),
        fetch("/api/notifications"),
        fetch("/api/repositories"),
        fetch("/api/chats"),
        fetch("/api/notifications/settings"),
        fetch("/api/decisions")
      ]);
      const [executionsBody, notificationsBody, repositoriesBody, chatsBody, settingsBody, decisionsBody] = await Promise.all([
        executionsRes.json(),
        notificationsRes.json(),
        repositoriesRes.json(),
        chatsRes.json(),
        settingsRes.json(),
        decisionsRes.json()
      ]);
      if (!active) return;
      setExecutions(executionsBody.executions || []);
      setNotifications(notificationsBody.notifications || []);
      setRepositoryRecords(repositoriesBody.repositories || []);
      setChats(chatsBody.chats || []);
      setSettings(settingsBody.settings || null);
      setEventTypes(settingsBody.eventTypes || []);
      setDecisions(decisionsBody.decisions || []);
      setRefreshedAt(new Date().toISOString());
      setError("");
    } catch {
      if (active) setError("データ取得に失敗しました。");
    } finally {
      if (active) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    load({ active });
    return () => {
      active = false;
    };
  }, [load]);

  const repositories = useMemo(
    () => repositoryRecords.length ? repositoryRecords : summarizeRepositories(executions),
    [executions, repositoryRecords]
  );
  const shellProps = { loading, onRefresh: () => load(), refreshedAt };

  if (path === "/notifications/settings") {
    return <Shell currentPath={path} {...shellProps}><NotificationSettings settings={settings} eventTypes={eventTypes} /></Shell>;
  }

  if (path === "/deploys") {
    return <Shell currentPath={path} {...shellProps}><DeployPanel /></Shell>;
  }

  if (path === "/repositories") {
    return <Shell currentPath={path} {...shellProps}><RepositoryList repositories={repositories} onRepositoriesChange={setRepositoryRecords} /></Shell>;
  }

  const repositoryTopRoute = parseRepositoryTopRoute(path, repositories);
  if (repositoryTopRoute) {
    return (
      <Shell currentPath="/repositories" {...shellProps}>
        <RepositoryHome
          repositoryRecord={repositoryTopRoute}
          chats={chats}
          executions={executions}
          onChatCreated={(chat, execution) => {
            setChats((current) => sortChatsByUpdatedAt([chat, ...current.filter((item) => item.chatId !== chat.chatId)]));
            if (execution) {
              setExecutions((current) => [execution, ...current.filter((item) => item.executionId !== execution.executionId)]);
            }
          }}
        />
      </Shell>
    );
  }

  if (path === "/chats") {
    return <Shell currentPath={path} {...shellProps}><ChatIndex chats={chats} executions={executions} repositories={repositories} /></Shell>;
  }

  const repositoryChatRoute = parseRepositoryChatRoute(path);
  if (repositoryChatRoute) {
    return (
      <Shell currentPath="/chats" {...shellProps}>
        <RepositoryChatWorkspace
          repository={repositoryChatRoute}
          chats={chats}
          executions={executions}
          onChatCreated={(chat, execution) => {
            setChats((current) => sortChatsByUpdatedAt([chat, ...current.filter((item) => item.chatId !== chat.chatId)]));
            if (execution) {
              setExecutions((current) => [execution, ...current.filter((item) => item.executionId !== execution.executionId)]);
            }
          }}
        />
      </Shell>
    );
  }

  const chatId = parseChatDetailRoute(path);
  if (chatId) {
    const chat = chats.find((item) => item.chatId === chatId);
    return (
      <Shell currentPath="/chats" {...shellProps}>
        <ChatDetail
          chat={chat}
          chatId={chatId}
          execution={chat ? executions.find((item) => item.executionId === chat.executionId) : null}
          onChatChange={(updatedChat) => {
            setChats((current) => sortChatsByUpdatedAt(current.map((item) => item.chatId === updatedChat.chatId ? updatedChat : item)));
          }}
          onExecutionCreated={(createdExecution) => {
            setExecutions((current) => [createdExecution, ...current.filter((item) => item.executionId !== createdExecution.executionId)]);
          }}
        />
      </Shell>
    );
  }

  if (path === "/decisions") {
    return <Shell currentPath={path} {...shellProps}><DecisionQueue decisions={decisions} /></Shell>;
  }

  return (
    <Shell currentPath={path} {...shellProps}>
      <section className="hero">
        <p className="eyebrow">Cloudflare dashboard</p>
        <h1>VTDD v3</h1>
        <p>iPhone から開発状況、チャット、deploy、判断待ちを確認する Butler ダッシュボードです。</p>
      </section>
      {error ? <p className="alert">{error}</p> : null}
      <Stats executions={executions} notifications={notifications} repositories={repositories} chats={chats} />
      <section className="panel">
        <div className="sectionTitle">
          <h2>進行中の開発</h2>
          <a href="/api/executions">API</a>
        </div>
        <div className="grid">
          {executions.map((execution) => <ExecutionCard key={execution.executionId} execution={execution} />)}
        </div>
      </section>
    </Shell>
  );
}

function Shell({ children, currentPath, loading, onRefresh, refreshedAt }) {
  return (
    <main>
      <header className="topbar">
        <a className="brand" href="/orchestrator">VTDD Butler</a>
        <nav aria-label="主要ナビゲーション">
          {navItems.map((item) => (
            <a
              aria-current={currentPath === item.href ? "page" : undefined}
              className={currentPath === item.href ? "active" : ""}
              key={item.href}
              href={item.href}
            >
              {item.label}
            </a>
          ))}
          <a href={passkeyUrl}>Passkey</a>
        </nav>
      </header>
      <div className="refreshBar">
        <span>GitHub Actions / VPS runner event で runtime truth を更新</span>
        <span>{refreshedAt ? `表示取得 ${formatDate(refreshedAt)}` : "未取得"}</span>
        <button disabled={loading} type="button" onClick={onRefresh}>{loading ? "取得中" : "最新状態を取得"}</button>
      </div>
      {children}
    </main>
  );
}

function Stats({ executions, notifications, repositories, chats }) {
  return (
    <section className="stats">
      <span>{repositories.length} リポジトリ</span>
      <span>{executions.length} 開発</span>
      <span>{chats.length} チャット</span>
      <span>{notifications.length} 通知</span>
      <span>{executions.filter((item) => item.status === "failed").length} 失敗</span>
    </section>
  );
}

function ExecutionCard({ execution }) {
  const progress = Math.max(0, Math.min(100, Number(execution.progress || 0)));
  return (
    <article className="card">
      <div className="cardHead">
        <div>
          <h3>{execution.repository}</h3>
          <p>{execution.title}</p>
        </div>
        <span className={`pill ${execution.status}`}>{displayStatus(execution.status)}</span>
      </div>
      <div className="bar"><span style={{ width: `${progress}%` }} /></div>
      <p>{execution.currentStep}</p>
      <div className="actions">
        <a href={`/progress/${encodeURIComponent(execution.executionId)}`}>進捗</a>
        <a href={`https://github.com/${execution.repository}`}>Repository</a>
        {execution.prUrl ? <a href={execution.prUrl}>PR</a> : null}
        {execution.runUrl ? <a href={execution.runUrl}>GitHub run</a> : null}
      </div>
    </article>
  );
}

function RepositoryList({ repositories, onRepositoriesChange }) {
  const [editing, setEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const selectedCount = selectedIds.length;

  function toggleSelected(repositoryId) {
    setSelectedIds((current) =>
      current.includes(repositoryId)
        ? current.filter((id) => id !== repositoryId)
        : [...current, repositoryId]
    );
  }

  async function deleteSelected() {
    for (const repositoryId of selectedIds) {
      await deleteRepository(repositoryId, onRepositoriesChange);
    }
    setSelectedIds([]);
    setEditing(false);
  }

  return (
    <>
      <section className="panel">
        <div className="sectionTitle">
          <div>
            <p className="eyebrow">Repository registry</p>
            <h1>リポジトリ</h1>
          </div>
          <a href="/api/repositories">API</a>
        </div>
        <p>TOMIO や SunabaEye のような開発対象をここに登録します。owner/repo 未確定でも、まず未解決として置けます。</p>
        <RepositoryForm onRepositoriesChange={onRepositoriesChange} />
      </section>
      <section className="panel">
        <div className="sectionTitle">
          <div>
            <h2>登録済み</h2>
            <span className="muted">{repositories.length} 件</span>
          </div>
          <div className="actions">
            <button className="secondaryButton" type="button" onClick={() => {
              setEditing(!editing);
              setSelectedIds([]);
            }}>
              {editing ? "編集を閉じる" : "編集"}
            </button>
            {editing ? (
              <button className="dangerButton" disabled={selectedCount === 0} type="button" onClick={deleteSelected}>
                選択した {selectedCount} 件を削除
              </button>
            ) : null}
          </div>
        </div>
        <div className="grid">
          {repositories.map((repo) => (
            <article className="card" key={repo.id || repo.repository || repo.nickname}>
              {editing ? (
                <label className="selectRow">
                  <input
                    checked={selectedIds.includes(repo.id)}
                    onChange={() => toggleSelected(repo.id)}
                    type="checkbox"
                  />
                  <span>削除対象にする</span>
                </label>
              ) : null}
              {editing ? <NicknameEditor repository={repo} onRepositoriesChange={onRepositoriesChange} /> : null}
              <div className="cardHead">
                <div>
                  <h3>{repo.nickname || repo.repository}</h3>
                  <p>{repo.repository || "owner/repo 未解決"}</p>
                </div>
                <span className={`pill ${repo.readiness || "unverified"}`}>{displayReadiness(repo.readiness)}</span>
              </div>
              <p>{repo.executionCount ?? repo.count ?? 0} 件の開発 / {repo.chatCount ?? 0} チャット / 平均 {repo.averageProgress || 0}%</p>
              <div className="bar"><span style={{ width: `${repo.averageProgress || 0}%` }} /></div>
              <dl className="compact">
                <div><dt>Repo read</dt><dd>{repo.repoRead || "未確認"}</dd></div>
                <div><dt>GitHub App</dt><dd>{repo.githubApp || "未確認"}</dd></div>
                <div><dt>Runner clone</dt><dd>{repo.runnerClone || "未確認"}</dd></div>
              </dl>
              <RepositoryParityGate repository={repo} />
              <AliasList editing={editing} onRepositoriesChange={onRepositoriesChange} repository={repo} />
              {repo.notes ? <p>{repo.notes}</p> : null}
              <div className="actions">
                {editing ? (
                  <button className="secondaryButton" type="button" onClick={() => togglePinned(repo.id, Boolean(repo.pinnedAt), onRepositoriesChange)}>
                    {repo.pinnedAt ? "ピン解除" : "ピン留め"}
                  </button>
                ) : null}
                {repo.repository ? <a href={repositoryTopUrl(repo)}>開く</a> : null}
                {repo.repositoryUrl ? <a href={repo.repositoryUrl}>GitHub</a> : null}
                {repo.chatUrl ? <a href={repo.chatUrl}>チャット</a> : null}
                {repo.repository && !["observed", "ready"].includes(repo.readiness) ? (
                  <button className="secondaryButton" type="button" onClick={() => checkReadiness(repo.id, onRepositoriesChange)}>
                    確認
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function RepositoryParityGate({ repository }) {
  const parity = repository.v2Parity;
  if (!repository.repository || !parity) return null;
  const missingChecks = (parity.checks || []).filter((check) => check.status !== "ok");
  return (
    <div className={`parityGate ${parity.butlerComplete ? "ready" : "blocked"}`}>
      <div className="parityHead">
        <strong>v2 parity</strong>
        <span>{parity.butlerComplete ? "完了" : `${missingChecks.length} 件不足`}</span>
      </div>
      <p>{parity.summary}</p>
      {missingChecks.length ? (
        <ul className="parityList">
          {missingChecks.slice(0, 5).map((check) => (
            <li key={check.key}>
              <span>{check.label}</span>
              <em>{displayParityStatus(check.status)}</em>
            </li>
          ))}
        </ul>
      ) : null}
      {(parity.setupActions || []).length ? (
        <div className="actions">
          {parity.setupActions.map((action) => (
            <a href={action.url} key={action.kind}>{action.label}</a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RepositoryHome({ repositoryRecord, chats, executions, onChatCreated }) {
  const [query, setQuery] = useState("");
  const repository = repositoryRecord.repository;
  const normalizedQuery = query.trim().toLowerCase();
  const repoChats = sortChatsByUpdatedAt(chats.filter((chat) => chat.repository === repository));
  const filteredChats = repoChats.filter((chat) => chatMatchesQuery(chat, normalizedQuery));
  const repoExecutions = executions.filter((execution) => execution.repository === repository);

  return (
    <>
      <section className="panel repositoryHero">
        <div>
          <p className="eyebrow">Repository top</p>
          <h1>{repositoryRecord.nickname || repository}</h1>
          <p>{repository}</p>
          <div className="stats inlineStats">
            <span>{repoExecutions.length} 開発</span>
            <span>{repoChats.length} チャット</span>
            <span>平均 {repositoryRecord.averageProgress || 0}%</span>
          </div>
        </div>
        <div className="actions">
          <a href={`https://github.com/${repository}`}>GitHub</a>
          <a href={repositoryChatUrl(repository)}>旧チャット導線</a>
        </div>
      </section>

      <section className="splitLayout">
        <section className="panel mainChatPanel">
          <div className="sectionTitle">
            <div>
              <p className="eyebrow">Main chat</p>
              <h2>メインチャット</h2>
            </div>
          </div>
          <p>まずここで会話します。Butler が内容を整理し、必要なら Issue 候補、RAG 候補、開発タスクチャットへ交通整理します。</p>
          <ConversationStarter embedded repository={repository} onChatCreated={onChatCreated} />
        </section>

        <section className="panel">
          <div className="sectionTitle">
            <div>
              <p className="eyebrow">Threads</p>
              <h2>過去チャット</h2>
            </div>
            <span className="muted">{filteredChats.length} 件</span>
          </div>
          <div className="toolbar compactToolbar">
            <label>
              このリポジトリ内を検索
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="会話本文 / Issue / PR / runner 返答" />
            </label>
          </div>
          <div className="threadList">
            {filteredChats.map((chat) => (
              <a
                className="threadRow"
                href={`/chats/${encodeURIComponent(chat.chatId)}`}
                key={chat.chatId}
                title={chatHoverText(chat)}
              >
                <strong>{chat.title}</strong>
                <span>{chat.issueNumber ? `#${chat.issueNumber}` : "main"}</span>
                <em>{formatDate(chat.updatedAt)}</em>
              </a>
            ))}
            {!filteredChats.length ? <p className="muted">一致するチャットはありません。</p> : null}
          </div>
        </section>
      </section>

      <section className="panel">
        <div className="sectionTitle">
          <h2>進行中</h2>
          <a href={`/api/executions?repository=${encodeURIComponent(repository)}`}>API</a>
        </div>
        <div className="grid">
          {repoExecutions.map((execution) => <ExecutionCard execution={execution} key={execution.executionId} />)}
          {!repoExecutions.length ? <p className="muted">進行中の実行はまだありません。</p> : null}
        </div>
      </section>
    </>
  );
}

function NicknameEditor({ repository, onRepositoriesChange }) {
  const [nickname, setNickname] = useState(repository.nickname || "");

  async function submit(event) {
    event.preventDefault();
    if (!nickname.trim()) return;
    const response = await fetch(`/api/repositories/${encodeURIComponent(repository.id)}/nickname`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nickname })
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok && body.repositories) {
      onRepositoriesChange(body.repositories);
    }
  }

  return (
    <form className="nicknameForm" onSubmit={submit}>
      <label>
        表示名
        <input value={nickname} onChange={(event) => setNickname(event.target.value)} />
      </label>
      <button type="submit">表示名を変更</button>
    </form>
  );
}

function AliasList({ editing, repository, onRepositoriesChange }) {
  const [alias, setAlias] = useState("");
  const aliases = repository.aliases || [];

  async function submit(event) {
    event.preventDefault();
    if (!alias.trim()) return;
    const response = await fetch(`/api/repositories/${encodeURIComponent(repository.id)}/aliases`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ alias })
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok && body.repositories) {
      onRepositoriesChange(body.repositories);
      setAlias("");
    }
  }

  return (
    <div className="aliasBlock">
      <p className="aliasTitle">別名</p>
      <div className="aliasList">
        {aliases.length ? aliases.map((item) => (
          <span className="aliasPill" key={item}>
            {item}
            {editing ? (
              <button type="button" aria-label={`${item} を削除`} onClick={() => deleteAlias(repository.id, item, onRepositoriesChange)}>削除</button>
            ) : null}
          </span>
        )) : <span className="muted">未登録</span>}
      </div>
      {editing ? (
        <form className="aliasForm" onSubmit={submit}>
          <input value={alias} onChange={(event) => setAlias(event.target.value)} placeholder="ニックネーム" />
          <button type="submit">別名を追加</button>
        </form>
      ) : null}
    </div>
  );
}

async function deleteAlias(repositoryId, alias, onRepositoriesChange) {
  const response = await fetch(`/api/repositories/${encodeURIComponent(repositoryId)}/aliases`, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ alias })
  });
  const body = await response.json().catch(() => ({}));
  if (response.ok && body.repositories) {
    onRepositoriesChange(body.repositories);
  }
}

async function togglePinned(repositoryId, pinned, onRepositoriesChange) {
  const response = await fetch(`/api/repositories/${encodeURIComponent(repositoryId)}/pin`, {
    method: pinned ? "DELETE" : "POST"
  });
  const body = await response.json().catch(() => ({}));
  if (response.ok && body.repositories) {
    onRepositoriesChange(body.repositories);
  }
}

async function deleteRepository(repositoryId, onRepositoriesChange) {
  const response = await fetch(`/api/repositories/${encodeURIComponent(repositoryId)}`, {
    method: "DELETE"
  });
  const body = await response.json().catch(() => ({}));
  if (response.ok && body.repositories) {
    onRepositoriesChange(body.repositories);
  }
}

async function checkReadiness(repositoryId, onRepositoriesChange) {
  const response = await fetch(`/api/repositories/${encodeURIComponent(repositoryId)}/readiness-check`, {
    method: "POST"
  });
  const body = await response.json().catch(() => ({}));
  if (response.ok && body.repositories) {
    onRepositoriesChange(body.repositories);
  }
}

function RepositoryForm({ onRepositoriesChange }) {
  const [name, setName] = useState("");
  const [repository, setRepository] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setMessage("登録中...");
    const response = await fetch("/api/repositories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        repository,
        notes: repository ? "owner/repo 指定で追加" : "owner/repo 未解決。後続で repo 解決が必要"
      })
    });
    const body = await response.json();
    if (!response.ok || body.ok === false) {
      setMessage("登録できませんでした。入力を確認してください。");
      return;
    }
    onRepositoriesChange(body.repositories || []);
    setMessage(`${body.repository.nickname || body.repository.repository} を登録しました。`);
    setName("");
    setRepository("");
  }

  return (
    <form className="formGrid" onSubmit={submit}>
      <label>
        表示名
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="TOMIO / SunabaEye" />
      </label>
      <label>
        GitHub owner/repo
        <input value={repository} onChange={(event) => setRepository(event.target.value)} placeholder="marushu/example-repo" />
      </label>
      <button type="submit">リポジトリを追加</button>
      {message ? <p className="formMessage">{message}</p> : null}
    </form>
  );
}

function ChatIndex({ chats, executions, repositories }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredChats = sortChatsByUpdatedAt(chats).filter((chat) => chatMatchesQuery(chat, normalizedQuery));

  return (
    <>
      <section className="panel">
        <div className="sectionTitle">
          <div>
            <p className="eyebrow">Development chats</p>
            <h1>開発チャット</h1>
          </div>
          <a href="/api/chats">API</a>
        </div>
        <p>各開発の会話本文、runner 返答、判断メモを投稿一覧のように更新順で並べます。runtime truth は GitHub Actions / VPS runner event で更新します。</p>
        <div className="toolbar">
          <label>
            横断検索
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="会話本文 / repo / Issue / PR / runner 返答" />
          </label>
          <a className="secondaryLink" href="/orchestrator">全体進捗へ</a>
        </div>
      </section>
      <section className="panel">
        <div className="sectionTitle">
          <div>
            <h2>更新順</h2>
            <span className="muted">{filteredChats.length} 件</span>
          </div>
        </div>
        <div className="chatList">
          {filteredChats.map((chat) => (
            <ChatListItem
              chat={chat}
              execution={executions.find((item) => item.executionId === chat.executionId)}
              key={chat.chatId}
              query={normalizedQuery}
            />
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="sectionTitle">
          <h2>リポジトリ別</h2>
        </div>
        <div className="grid">
          {repositories.filter((repo) => repo.repository).map((repo) => (
            <article className="card" key={repo.id || repo.repository}>
              <h3>{repo.nickname || repo.repository}</h3>
              <p>{repo.repository}</p>
              <p>{chats.filter((chat) => chat.repository === repo.repository).length} チャット</p>
              <div className="actions">
                <a href={repo.chatUrl || repositoryChatUrl(repo.repository)}>チャット</a>
                <a href={`https://github.com/${repo.repository}`}>GitHub</a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function RepositoryChatWorkspace({ repository, chats, executions, onChatCreated }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const repoChats = sortChatsByUpdatedAt(chats.filter((chat) => chat.repository === repository));
  const filteredRepoChats = repoChats.filter((chat) => chatMatchesQuery(chat, normalizedQuery));
  const repoExecutions = executions.filter((execution) => execution.repository === repository);

  return (
    <>
      <section className="panel">
        <div className="sectionTitle">
          <div>
            <p className="eyebrow">Repository chat</p>
            <h1>{repository}</h1>
          </div>
          <div className="actions">
            <a href="/chats">全チャット</a>
            <a href={`https://github.com/${repository}`}>GitHub</a>
          </div>
        </div>
        <p>このリポジトリについて Butler / VPS Codex CLI と会話します。会話から Issue 候補、RAG 候補、実装 queue へ進めます。</p>
      </section>
      <section className="splitLayout">
        <div className="panel">
          <div className="sectionTitle">
            <div>
              <h2>過去チャット</h2>
              <span className="muted">更新順 / 本文検索 / event-driven</span>
            </div>
          </div>
          <div className="toolbar compactToolbar">
            <label>
              このリポジトリ内を検索
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="会話本文 / Issue / PR / runner 返答" />
            </label>
          </div>
          <div className="chatList">
            {filteredRepoChats.map((chat) => (
              <ChatListItem
                chat={chat}
                execution={repoExecutions.find((item) => item.executionId === chat.executionId)}
                key={chat.chatId}
                query={normalizedQuery}
              />
            ))}
            {!repoChats.length ? <p className="muted">このリポジトリのチャットはまだありません。</p> : null}
            {repoChats.length && !filteredRepoChats.length ? <p className="muted">一致するチャットはありません。</p> : null}
          </div>
        </div>
        <ConversationStarter repository={repository} onChatCreated={onChatCreated} />
      </section>
      <section className="panel">
        <div className="sectionTitle">
          <h2>進行中</h2>
          <a href={`/api/executions?repository=${encodeURIComponent(repository)}`}>API</a>
        </div>
        <div className="grid">
          {repoExecutions.map((execution) => <ExecutionCard execution={execution} key={execution.executionId} />)}
          {!repoExecutions.length ? <p className="muted">進行中の実行はまだありません。</p> : null}
        </div>
      </section>
    </>
  );
}

function ConversationStarter({ embedded = false, repository, onChatCreated }) {
  const [message, setMessage] = useState("");
  const [issueNumber, setIssueNumber] = useState("");
  const [taskType, setTaskType] = useState("implementation");
  const [status, setStatus] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (!message.trim()) return;
    const submitAction = event.nativeEvent?.submitter?.value || "conversation";
    const endpoint = submitAction === "dispatch" ? "/api/butler/dispatch" : "/api/butler/converse";
    setStatus(submitAction === "dispatch" ? "開発 queue に入れています..." : "Butler に会話を渡しています...");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repository,
        issueNumber,
        taskType: submitAction === "dispatch" ? taskType : "conversation",
        message
      })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.ok === false) {
      setStatus(body.authority || body.error || "依頼を作成できませんでした。");
      return;
    }
    onChatCreated(body.chat, body.execution);
    setMessage("");
    setIssueNumber("");
    setStatus(submitAction === "dispatch" ? "開発 queue に入れました。" : "会話チャットを作成しました。VPS Codex CLI の返答待ちです。");
  }

  return (
    <section className={embedded ? "requestPanel embeddedRequest" : "panel requestPanel"}>
      <div className="sectionTitle">
        <div>
          <p className="eyebrow">Butler conversation</p>
          <h2>Butler と会話</h2>
        </div>
      </div>
      <form className="verticalForm" onSubmit={submit}>
        <label>
          関連 Issue
          <input inputMode="numeric" value={issueNumber} onChange={(event) => setIssueNumber(event.target.value)} placeholder="会話から作るなら未指定" />
        </label>
        <label>
          開発 queue に入れる場合の種類
          <select value={taskType} onChange={(event) => setTaskType(event.target.value)}>
            <option value="implementation">実装</option>
            <option value="investigation">調査</option>
            <option value="docs">ドキュメント</option>
            <option value="tests">テスト</option>
            <option value="review">レビュー</option>
          </select>
        </label>
        <label>
          会話
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="考え、違和感、作りたい体験を Butler に話す" />
        </label>
        <div className="buttonRow">
          <button type="submit" value="conversation">会話を始める</button>
          <button type="submit" value="dispatch">すぐ開発 queue</button>
        </div>
        {status ? <p className="formMessage">{status}</p> : null}
      </form>
    </section>
  );
}

function ChatDetail({ chat, chatId, execution, onChatChange, onExecutionCreated }) {
  const [text, setText] = useState("");
  const [role, setRole] = useState("owner");
  const [taskType, setTaskType] = useState("implementation");
  const [status, setStatus] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (!text.trim()) return;
    const submitAction = event.nativeEvent?.submitter?.value || "converse";
    const endpoint = submitAction === "dispatch"
      ? `/api/chats/${encodeURIComponent(chatId)}/dispatch`
      : submitAction === "message"
        ? `/api/chats/${encodeURIComponent(chatId)}/messages`
      : `/api/chats/${encodeURIComponent(chatId)}/messages`;
    const resolvedEndpoint = submitAction === "converse"
      ? `/api/chats/${encodeURIComponent(chatId)}/converse`
      : endpoint;
    setStatus(submitAction === "dispatch" ? "追加指示を開発 queue に入れています..." : submitAction === "converse" ? "会話ターンを VPS Codex CLI に渡しています..." : "追加中...");
    const response = await fetch(resolvedEndpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role, text, taskType })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.ok === false) {
      setStatus(body.authority || body.error || "追加できませんでした。");
      return;
    }
    onChatChange(body.chat);
    if (body.execution) {
      onExecutionCreated(body.execution);
    }
    setText("");
    setStatus(submitAction === "dispatch" ? "追加指示を開発 queue に入れました。" : submitAction === "converse" ? "会話ターンを渡しました。" : "追加しました。");
  }

  if (!chat) {
    return (
      <section className="panel">
        <h1>チャットが見つかりません</h1>
        <p>{chatId}</p>
        <div className="actions"><a href="/chats">チャット一覧へ</a></div>
      </section>
    );
  }

  return (
    <>
      <section className="panel">
        <div className="sectionTitle">
          <div>
            <p className="eyebrow">Chat detail</p>
            <h1>{chat.title}</h1>
          </div>
          <div className="actions">
            <a href={repositoryChatUrl(chat.repository)}>Repo chats</a>
            <a href={`/progress/${encodeURIComponent(chat.executionId || "")}`}>進捗</a>
            <a href={`/api/chats/${encodeURIComponent(chat.chatId)}`}>API</a>
          </div>
        </div>
        <p>{chat.summary}</p>
        <dl className="compact chatMeta">
          <div><dt>repository</dt><dd>{chat.repository}</dd></div>
          <div><dt>Issue</dt><dd>{chat.issueNumber || "なし"}</dd></div>
          <div><dt>PR</dt><dd>{chat.prNumber || "なし"}</dd></div>
          <div><dt>status</dt><dd>{displayChatStatus(chat.status)}</dd></div>
          <div><dt>更新</dt><dd>{formatDate(chat.updatedAt)}</dd></div>
        </dl>
        <div className="tagRow">
          {(chat.tags || []).map((tag) => <span className="aliasPill" key={tag}>{tag}</span>)}
        </div>
      </section>
      {execution ? (
        <section className="panel">
          <div className="sectionTitle">
            <h2>実行状況</h2>
          </div>
          <ExecutionCard execution={execution} />
        </section>
      ) : null}
      <section className="splitLayout">
        <div className="panel">
          <div className="sectionTitle">
            <div>
              <h2>会話履歴</h2>
              <span className="muted">event-driven</span>
            </div>
          </div>
          <div className="messageList">
            {(chat.messages || []).map((message, index) => (
              <article className="messageBubble" key={`${message.createdAt}-${index}`}>
                <div className="messageMeta">{displayRole(message.role)} / {formatDate(message.createdAt)}</div>
                <p>{message.text}</p>
              </article>
            ))}
          </div>
        </div>
        <section className="panel requestPanel">
          <div className="sectionTitle">
            <h2>会話 / 追記 / 開発指示</h2>
          </div>
          <form className="verticalForm" onSubmit={submit}>
            <label>
              役割
              <select value={role} onChange={(event) => setRole(event.target.value)}>
                <option value="owner">オーナー</option>
                <option value="butler">Butler</option>
                <option value="runner">Runner</option>
              </select>
            </label>
            <label>
              開発 queue に入れる場合の種類
              <select value={taskType} onChange={(event) => setTaskType(event.target.value)}>
                <option value="implementation">実装</option>
                <option value="investigation">調査</option>
                <option value="docs">ドキュメント</option>
                <option value="tests">テスト</option>
                <option value="review">レビュー</option>
              </select>
            </label>
            <label>
              メッセージ
              <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Butler に話す内容、またはこのチャットに残すメモ" />
            </label>
            <div className="buttonRow">
              <button type="submit" value="message">メモとして追加</button>
              <button type="submit" value="converse">会話として送る</button>
              <button type="submit" value="dispatch">開発 queue</button>
            </div>
            {status ? <p className="formMessage">{status}</p> : null}
          </form>
        </section>
      </section>
    </>
  );
}

function ChatListItem({ chat, execution, query = "" }) {
  const previews = chatConversationPreview(chat, query);
  return (
    <article className="chatRow">
      <div>
        <div className="chatRowHeader">
          <h3>{chat.title}</h3>
          <span className={`pill ${chat.status || "active"}`}>{displayChatStatus(chat.status)}</span>
        </div>
        <p>{chat.summary}</p>
        <div className="postPreview">
          {previews.map((message, index) => (
            <blockquote key={`${message.createdAt}-${index}`}>
              <span>{displayRole(message.role)} / {formatDate(message.createdAt)}</span>
              <p>{message.text}</p>
            </blockquote>
          ))}
        </div>
        <div className="metaLine">
          <span>{chat.repository}</span>
          {chat.issueNumber ? <span>Issue #{chat.issueNumber}</span> : null}
          {chat.prNumber ? <span>PR #{chat.prNumber}</span> : null}
          <span>{formatDate(chat.updatedAt)}</span>
        </div>
      </div>
      <div className="chatActions">
        <a href={`/chats/${encodeURIComponent(chat.chatId)}`}>開く</a>
        <a href={repositoryChatUrl(chat.repository)}>Repo</a>
        {execution ? <a href={`/progress/${encodeURIComponent(execution.executionId)}`}>進捗</a> : null}
        {chat.issueNumber ? <a href={`https://github.com/${chat.repository}/issues/${chat.issueNumber}`}>Issue</a> : null}
        {chat.prNumber ? <a href={`https://github.com/${chat.repository}/pull/${chat.prNumber}`}>PR</a> : null}
      </div>
    </article>
  );
}

function chatMatchesQuery(chat, query) {
  if (!query) return true;
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
    ...(chat.messages || []).map((message) => `${message.role} ${message.text}`)
  ].join(" ").toLowerCase().includes(query);
}

function chatConversationPreview(chat, query) {
  const messages = chat.messages || [];
  if (query) {
    const hits = messages.filter((message) => `${message.role} ${message.text}`.toLowerCase().includes(query));
    if (hits.length) return hits.slice(-3);
  }
  return messages.slice(-3);
}

function chatHoverText(chat) {
  return [
    chat.summary,
    ...(chat.messages || []).slice(-3).map((message) => `${displayRole(message.role)}: ${message.text}`)
  ].filter(Boolean).join("\n\n");
}

function displayReadiness(readiness) {
  return {
    ready: "準備済み",
    observed: "検出済み",
    setup_required: "要セットアップ",
    unverified: "未確認",
    unresolved: "未解決"
  }[readiness] || "未確認";
}

function displayParityStatus(status) {
  return {
    ok: "OK",
    missing: "不足",
    unknown: "未確認",
    manual_required: "手動確認"
  }[status] || "未確認";
}

function parseRepositoryChatRoute(path) {
  const match = path.match(/^\/repositories\/([^/]+)\/([^/]+)\/chats$/);
  if (!match) return null;
  return `${decodeURIComponent(match[1])}/${decodeURIComponent(match[2])}`;
}

function parseRepositoryTopRoute(path, repositories) {
  const match = path.match(/^\/repositories\/([^/]+)$/);
  if (!match) return null;
  const slug = decodeURIComponent(match[1]).toLowerCase();
  return repositories.find((repo) => {
    const candidates = [
      repo.id,
      repo.nickname,
      repo.repository,
      repositorySlug(repo.repository),
      ...(repo.aliases || [])
    ];
    return candidates.some((candidate) => normalizeClientText(candidate).toLowerCase() === slug);
  }) || null;
}

function parseChatDetailRoute(path) {
  const match = path.match(/^\/chats\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function repositoryTopUrl(repositoryRecord) {
  return `/repositories/${encodeURIComponent(repositorySlug(repositoryRecord.repository || repositoryRecord.nickname || repositoryRecord.id))}`;
}

function repositorySlug(repository) {
  const value = String(repository || "");
  const repoName = value.includes("/") ? value.split("/").at(-1) : value;
  return repoName.replace(/[^a-z0-9.-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "repository";
}

function repositoryChatUrl(repository) {
  const [owner, repo] = String(repository || "").split("/");
  if (!owner || !repo) return "/chats";
  return `/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/chats`;
}

function normalizeClientText(value) {
  return String(value || "").trim();
}

function sortChatsByUpdatedAt(items) {
  return [...items].sort((a, b) => Date.parse(b.updatedAt || 0) - Date.parse(a.updatedAt || 0));
}

function formatDate(value) {
  if (!value) return "未確認";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function displayChatStatus(status) {
  return {
    active: "進行中",
    pinned: "固定",
    archived: "完了済み",
    cold: "保留"
  }[status] || "進行中";
}

function displayRole(role) {
  return {
    owner: "オーナー",
    butler: "Butler",
    runner: "Runner"
  }[role] || role;
}

function NotificationSettings({ settings, eventTypes }) {
  return (
    <section className="panel">
      <div className="sectionTitle">
        <div>
          <p className="eyebrow">Owner notifications</p>
          <h1>通知設定</h1>
        </div>
        <a href="/api/notifications/settings">API</a>
      </div>
      <p>初期状態は全イベント通知です。細かい保存UIは次のスライスで接続します。</p>
      <div className="stack">
        {eventTypes.map((eventType) => (
          <label className="checkRow" key={eventType.key}>
            <input type="checkbox" defaultChecked={settings?.mode === "all" || settings?.enabledEvents?.includes(eventType.key)} />
            <span>{eventType.label}</span>
            <code>{eventType.key}</code>
          </label>
        ))}
      </div>
    </section>
  );
}

function DeployPanel() {
  return (
    <>
      <section className="panel">
        <div className="sectionTitle">
          <div>
            <p className="eyebrow">Production deploy</p>
            <h1>デプロイ</h1>
          </div>
          <a href={deployRunsApiUrl}>最新 run API</a>
        </div>
        <p>v3 の production deploy は GO + passkey の後に実行します。この画面は deploy 前後の確認入口です。</p>
        <div className="quickGrid">
          <a className="quickLink primary" href={passkeyUrl}>
            <span>1</span>
            <strong>Passkey 承認</strong>
            <small>deploy_production の短命 grant を取得</small>
          </a>
          <a className="quickLink" href="https://github.com/marushu/vtdd-v3/actions/workflows/deploy-production.yml">
            <span>2</span>
            <strong>GitHub Actions</strong>
            <small>deploy workflow と run を確認</small>
          </a>
          <a className="quickLink" href={deployRunsApiUrl}>
            <span>3</span>
            <strong>Run API</strong>
            <small>dashboard へ同期する deploy run truth</small>
          </a>
          <a className="quickLink" href="/orchestrator">
            <span>4</span>
            <strong>戻る</strong>
            <small>全体の進行状況へ戻る</small>
          </a>
        </div>
      </section>
      <section className="notice">
        <strong>Cloudflare 本番反映について</strong>
        <p>PR merge だけでは Worker runtime は変わりません。merge 後に deploy run が成功して初めて workers.dev 側に反映されます。</p>
      </section>
    </>
  );
}

function DecisionQueue({ decisions }) {
  return (
    <section className="panel">
      <div className="sectionTitle">
        <div>
          <p className="eyebrow">Human gate</p>
          <h1>判断待ち</h1>
        </div>
        <a href="/api/decisions">API</a>
      </div>
      <p>merge、deploy、調査など、人間の判断が必要な項目をここに集約します。</p>
      <div className="grid">
        {decisions.map((decision) => (
          <article className="card" key={`${decision.executionId}-${decision.action}`}>
            <div className="cardHead">
              <div>
                <h3>{decision.repository}</h3>
                <p>{decision.title}</p>
              </div>
              <span className="pill waiting">{decision.authority}</span>
            </div>
            <p>{decision.reason}</p>
            <div className="actions">
              <a href={`/progress/${encodeURIComponent(decision.executionId)}`}>進捗</a>
              <a href={`https://github.com/${decision.repository}`}>GitHub</a>
              {decision.prUrl ? <a href={decision.prUrl}>PR</a> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function summarizeRepositories(executions) {
  const map = new Map();
  executions.forEach((execution) => {
    const current = map.get(execution.repository) || { repository: execution.repository, count: 0, progress: 0 };
    current.count += 1;
    current.progress += Number(execution.progress || 0);
    map.set(execution.repository, current);
  });
  return [...map.values()].map((item) => ({
    ...item,
    averageProgress: Math.round(item.progress / item.count)
  }));
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

createRoot(document.getElementById("root")).render(<App />);
