# Issue: 開発チャットの rollover / continuation

GitHub Issue: #12

## 意図

1つの chat が長くなったり、phase / topic が変わった場合に、Butler が新しい chat へ安全に移動できるようにする。

ChatGPT の長い1スレではなく、VTDD chat を開発単位・phase 単位の作業部屋として扱う。

## 成功条件

- chat に `parentChatId`, `continuationOf`, `continuationReason`, `rootChatId` を持てる。
- continuation reason は `context_too_long`, `topic_shift`, `phase_changed`, `issue_split`, `pr_review_started`, `deploy_phase_started` を扱える。
- 旧 chat の末尾に continuation notice を残せる。
- 新 chat の冒頭に handoff summary / unresolved / next action を持てる。
- Butler / dashboard が常に latest chat に案内できる。
- archived chat は summary-first にできる。
- chain traversal API で過去 chat を辿れる。

## 非ゴール

- LLM による自動要約生成の本実装。
- ChatGPT 公式 thread migration。
- 無制限 transcript 連結。

## 検証

- rollover API test。
- parent / child / latest の解決 test。
- 旧 chat と新 chat の notice / summary test。
