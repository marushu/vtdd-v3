# Issue: Dashboard dispatch to VPS Codex CLI

## Intent

Allow the owner to start a VPS Codex CLI execution from the Cloudflare
dashboard without going through a Custom GPT thread.

## Success Criteria

- Owner can choose repo, issue, and task type.
- Dispatch creates an executionId and queue record.
- Dashboard immediately shows the progress page URL.
- Dispatch does not require OpenAI API credits from the Worker.
- High-risk actions are not executed by dispatch.

## Non-goals

- Full natural-language intent parsing.
- Merge/deploy/close execution.
- DNS or credential mutation.
