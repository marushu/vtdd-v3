# 五月雨 backlog capture

Last updated: 2026-05-19

## 目的

この文書は、v3 dashboard 構想中に五月雨で出た owner intent を durable repo truth に固定する。

ChatGPT thread の記憶だけに置かず、GitHub Issue / docs / dashboard Issue catalog へ接続する。

## すでに v3 に入ったもの

- v3 repository: `marushu/vtdd-v3`
- Cloudflare Worker dashboard: `/orchestrator`
- repository ごとの progress card
- execution progress page: `/progress/:executionId`
- dispatch page: `/dispatch`
- decision queue page: `/decisions`
- notification page: `/notifications`
- KV-backed execution store
- VPS runner queue / claim API
- dashboard dispatch preview
- high-risk task type の dispatch block
- VPS runner dry-run adapter
- runner から chat への返信保存
- repository-scoped development chats
- chat detail / summary / messages
- chat search API
- PR / Issue / repository への owner-facing link
- Issue / PR / docs の日本語-first discipline

## まだ追加できていないもの

- #10 Dashboard を対象 GitHub アカウントだけに制限する。
- #11 既存 RAG に開発チャットを保存・検索できるようにする。
- #12 開発チャットの rollover / continuation。
- #13 Voice/Text Driven Development のマイク入力。
- #13 mic mode 中の Screen Wake Lock と voice-first feedback。
- #13 音声会話中の compact GO + passkey approval sheet。
- #14 Butler intent router for dashboard chat。
- #15 VPS 常駐 runner と token gate。
- #15 runner auth mode / cost guard。
- #16 chat / execution の realtime 更新。
- #17 同一 repository 並行開発の conflict-aware scheduler。

既存 Issue では以下も未完了のまま残る。

- #3 人間の判断キュー。
- #4 オーナー通知。
- #6 `vtdd.hibou-web.com` の Cloudflare 移行検討。
- #7 v3 GitHub App 権限と runner 認証情報。

## 重要な判断

- dashboard が実質的な Butler home になる。
- Custom GPT は primary surface ではなく、必要なら optional entrance として残す。
- VPS / local runner が通常の実行面になる。
- 追加 OpenAI API 課金や Codex backend dependency は default にしない。
- mac Codex は emergency / bootstrap / auxiliary surface に寄せる。
- chat は ChatGPT thread ではなく VTDD 側の durable work room として扱う。
- 音声入力は即実行ではなく、確認可能な text intent に変換する。
- マイクモード中は可能なら Screen Wake Lock で自動ロックを抑止し、解除 / 未対応を owner に見える状態にする。
- 高リスク intent は音声だけで通さず、短い evidence と scope を表示した GO + passkey ボタンに流す。
- RAG は full transcript ではなく summary / decision / unresolved / evidence を優先する。

## 安全境界

- dashboard auth / runner token / credential / permission / DNS / deploy / merge / close は authority gate の対象。
- production auth policy や secret mutation は GO + passkey なしに実行しない。
- raw terminal log、secret、token、approval grant、chain-of-thought は RAG / chat に保存しない。
- runner は execution credentials を持っても、merge / deploy / close を自律実行しない。
- 運転中利用では voice-first feedback を優先し、画面注視や high-risk action の音声自動実行を前提にしない。
- 同一 repository の並行開発は conflict-aware scheduler を通し、危ない場合は queue / dry-run / human decision に回す。
- `OPENAI_API_KEY` / API key billing mode は明示承認、budget cap、dashboard cost risk 表示なしに使わない。

## 次の推奨順

1. #10 dashboard auth
2. #15 VPS 常駐 runner と token gate
3. #16 realtime 更新
4. #14 Butler intent router
5. #13 Voice/Text Driven Development
6. #11 RAG adapter
7. #12 chat rollover

#10 を先に進める理由は、dashboard / chat / search が公開 URL 上にあるため。
