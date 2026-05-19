# Issue: GitHub App roles and runner credentials for v3

## Intent

Mirror the v2 role separation model for VTDD v3 without granting standing
admin power to the dashboard.

## Required Roles

- VTDD v3 Orchestrator read/write app for repository runtime truth.
- VTDD VPS Codex CLI app for runner-owned implementation branches and PRs.
- VTDD reviewer app for reviewer comments and reviewer marker writeback.
- Optional mac Codex app for emergency/local maintenance.

## Success Criteria

- Required GitHub App roles are documented with visible bot identity.
- Required repository permissions are listed per role.
- Required Actions secrets / Worker secrets are listed without secret values.
- Missing app credentials degrade safely and appear on the dashboard.
- App installation, permission mutation, and secret sync remain GO + passkey
  governed operations.

## Non-goals

- Creating GitHub Apps without explicit governed approval.
- Adding human collaborators.
- Sharing owner credentials.
