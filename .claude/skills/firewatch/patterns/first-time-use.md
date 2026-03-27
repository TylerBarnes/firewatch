# First-Time Use Pattern

Safe workflow for the first Firewatch use in a repo or session.

## Goal

Get oriented without assuming config is complete or jumping straight into raw JSONL.

## Recommended Sequence

```bash
fw status
fw agent view-status
fw view PR_NUMBER
fw list --pr PR_NUMBER
```

Use JSONL only when the readable views are not enough:

```bash
fw --type comment --pr PR_NUMBER | jq 'select(.subtype == "review_comment")'
```

## Why This Order Works

1. `fw status` checks auth, cache, and repo detection.
2. `fw agent view-status` gives a compact current-branch PR summary when branch-to-PR detection works.
3. `fw view <pr>` gives a broader readable PR-level summary.
4. `fw list --pr <pr>` shows the feedback items in a readable format.
5. `fw --pr <pr> --type comment` is the structured fallback for custom filtering.

## Safe Defaults

- Prefer `--pr <number>` over `--mine` or `--reviews` until config is known-good.
- Prefer `fw agent view-status` for a compact current-branch check-in, and `fw view` / `fw list` for broader readable inspection.
- Run one `fw` command at a time while getting oriented.
- Use `fw sync` explicitly if you want to refresh first.

## Avoid Early On

- `fw --mine` or `fw --reviews` before `user.github_username` is configured.
- Running multiple `fw` commands in parallel.
- Chaining several `fw` commands together in one shell line.
- Treating Firewatch as a live CI dashboard.

Firewatch uses a local SQLite cache. Concurrent access can produce `database is locked`, so serialize commands when possible.

## Good Starting Commands

### Check setup

```bash
fw status
```

### Read one PR

```bash
fw view 42
fw list --pr 42
```

### Refresh before reading

```bash
fw sync
fw view 42
```

## Agent Routing

When the user says things like:

- "use firewatch"
- "check this PR"
- "what's going on with the review?"

Default to:

1. `fw status` if setup may be unknown
2. `fw agent view-status` for a compact current-branch check-in when cwd should map to a PR
3. `fw view <pr>` for broader readable context
4. `fw list --pr <pr>` for readable feedback enumeration
5. JSONL + `jq` only if the user wants filtering, counting, or extraction
