# Issue: Human decision queue

## Intent

Create a dashboard queue for work that is waiting on the owner.

## Success Criteria

- Queue groups items by `merge GO`, `deploy GO`, `issue close GO`, `review
  needed`, `investigation needed`, and `blocked`.
- Each item links to the PR, Issue, progress page, and governed operator URL
  when relevant.
- High-risk actions stay behind GO + real passkey.
- The owner can inspect evidence before deciding.

## Non-goals

- Automatic merge.
- Automatic deploy.
- Automatic issue close.
