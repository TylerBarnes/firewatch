---
name: firewatch
description: Query GitHub PR activity using the Firewatch CLI (fw). Fetch, cache, filter, and act on PR comments, reviews, commits, and CI status. Query commands output JSONL for jq composition, while `fw list` and `fw view` provide readable text output. Use when checking PR status, finding review comments, querying activity, resolving feedback, or working with GitHub pull requests.
user-invocable: true
metadata:
  author: outfitter-dev
  version: "3.0"
---

# Firewatch

Query, filter, and act on GitHub PR activity using the Firewatch CLI (`fw`).

## Quick Start

```bash
fw status                        # Check auth/cache/repo setup on first use
fw agent view-status             # Agent-oriented current-branch PR status
fw agent view-comments           # Agent-oriented new comment stream for current PR
fw view 42                       # Readable PR overview
fw list --pr 42                  # Readable feedback list for a PR
fw --type comment --pr 42       # Structured comment query for jq filtering
```

## First-Time Use

If this is the first Firewatch use in a repo or session, prefer this sequence:

1. `fw status` — confirm auth, cache, and repo detection
2. `fw view <pr>` — get a readable PR-level check-in
3. `fw list --pr <pr>` — enumerate feedback on that PR
4. `fw --pr <pr> --type comment | jq ...` — only when you need custom filtering or extraction

See [patterns/first-time-use.md](patterns/first-time-use.md) for the goal-oriented workflow.
See [patterns/check-in-on-review.md](patterns/check-in-on-review.md) for broad PR review status questions.

Safe defaults:

- prefer `--pr <number>` over `--mine` / `--reviews` until config is known-good
- prefer `fw view` for “check in on the review” requests
- prefer one `fw` command at a time while getting oriented

Avoid on first use unless you know config/setup is ready:

- `--mine` and `--reviews` without `user.github_username`
- chaining multiple `fw` queries in a single shell command
- running multiple `fw` commands in parallel against the same cache/database
- treating Firewatch as the canonical live CI or PR metadata dashboard

Firewatch uses a local SQLite cache, so concurrent reads/writes can occasionally surface `database is locked`. Prefer serialized `fw` calls: run `fw sync` first if needed, then query one command at a time.

## When to Use Firewatch

Use Firewatch when you need:

- PR review and feedback triage
- readable PR/comment inspection with `fw list` and `fw view`
- compact agent-oriented current-branch status, comment, or CI reads with `fw agent`
- precise querying across comments, reviews, commits, events, and cached CI entries
- local, scriptable output for `jq` pipelines and agent workflows
- reply / resolve / approve / reject actions on GitHub PR discussions

Prefer other tools when you need:

- live CI monitoring or full status-dashboard behavior
- deep GitHub browsing outside the PR-activity model
- richly formatted multi-record output without using `jq`
- repository operations unrelated to PR feedback workflows

`ci` entries exist and can be queried, but Firewatch is strongest as a PR feedback and review workflow tool rather than a comprehensive CI monitoring surface.

## Core Concepts

### JSONL Query Output

`fw` / `fw query` output one JSON object per line. Each entry is **denormalized** — it contains full PR context (title, state, author, labels) so you never need joins.

For readable non-JSON output, use:

- `fw list` for opinionated text listings of feedback or PRs
- `fw view <id>` for human-readable details on a PR or comment/thread

```bash
fw --type comment --limit 1
```

```json
{
  "id": "IC_kwDOK...",
  "type": "comment",
  "subtype": "review_comment",
  "author": "alice",
  "body": "Consider adding error handling here",
  "file": "src/auth.ts",
  "line": 42,
  "pr": 123,
  "pr_title": "Add user authentication",
  "pr_state": "open",
  "pr_author": "bob",
  "created_at": "2025-01-14T10:00:00Z"
}
```

### Entry Types

| Type      | Subtype          | Meaning                                     |
| --------- | ---------------- | ------------------------------------------- |
| `comment` | `review_comment` | Inline code comment (actionable)            |
| `comment` | `issue_comment`  | General PR comment                          |
| `review`  | —                | Review submission (approve/request changes) |
| `commit`  | —                | Commit pushed to PR branch                  |
| `ci`      | —                | CI/CD status check                          |
| `event`   | —                | Lifecycle event (opened, closed, merged)    |

## Querying

### Filter Flags

```bash
fw --type comment              # By type
fw --since 24h                 # By time (30s, 5m, 24h, 7d, 2w, 1mo)
fw --pr 42                    # By PR number
fw --author alice              # By author
fw --open                      # Open PRs (includes drafts)
fw --mine                      # PRs assigned to me
fw --reviews                   # PRs I need to review
```

Combine filters (AND logic):

```bash
fw --type review --author alice --since 7d --open
```

### Aggregation

Per-PR summary instead of individual entries:

```bash
fw --summary --open
```

### Readable Text Views

Use the non-JSON commands when you want a built-in readable view instead of shaping JSONL yourself:

```bash
fw list --pr 42         # Text list of feedback for a PR
fw list prs --open      # Text list of PRs
fw view 42              # Human-readable PR detail
fw view @a7f3c          # Human-readable comment/thread detail
```

Rule of thumb:

- `fw agent view-status` for an agent-oriented current-branch PR check-in
- `fw agent view-comments` for incremental current-branch comment review with cursor replay
- `fw agent view-ci` for compact current-branch CI inspection with deeper `--check` follow-ups
- `fw view <pr>` for a broader human-readable PR check-in
- `fw list --pr <pr>` to enumerate feedback items
- `fw fb --current` when the user wants the standard current-branch feedback list
- `fw` / `fw query` when you need custom filtering or extraction

See [patterns/check-current-pr.md](patterns/check-current-pr.md) for the current-PR workflow.
See [patterns/current-stack-feedback.md](patterns/current-stack-feedback.md) for Graphite stack-wide feedback triage.

### Composing with jq

CLI filters handle common cases; jq handles everything else:

```bash
# Only approved reviews
fw --type review | jq 'select(.state == "approved")'

# Comments mentioning "TODO"
fw --type comment | jq 'select(.body | test("TODO"; "i"))'

# External feedback (not self-comments)
fw --type comment | jq 'select(.author != .pr_author)'

# Count by type
fw | jq -s 'group_by(.type) | map({type: .[0].type, count: length})'
```

**Tip:** Use CLI filters first, then jq. CLI filters are faster because they skip JSON parsing for non-matching entries.

See [references/jq-cookbook.md](references/jq-cookbook.md) for more patterns.

For prioritization guidance, see [patterns/triage-feedback.md](patterns/triage-feedback.md).
For changes-requested reviews, see [patterns/handle-changes-requested.md](patterns/handle-changes-requested.md).

## Taking Action

### Post a Comment

```bash
fw comment 42 "LGTM, merging!"
```

### Reply to a Review Comment

Every comment entry has an `id` field (full ID or short `@xxxxx`):

```bash
fw reply @a7f3c "Fixed in latest commit"
```

### Reply and Resolve

```bash
fw reply @a7f3c "Done" --resolve
```

See [patterns/reply-to-comments.md](patterns/reply-to-comments.md) for the standalone reply workflow.
See [patterns/reply-and-resolve.md](patterns/reply-and-resolve.md) for decision rules on when to reply, resolve directly, or do both.
See [patterns/find-comment-by-id.md](patterns/find-comment-by-id.md) when the user gives a specific comment or thread ID.
See [patterns/find-unresolved-comments.md](patterns/find-unresolved-comments.md) when the user wants open threads or likely still-actionable comments.

### Resolve Without Replying

```bash
fw close @a7f3c
```

### Acknowledge Without Replying

```bash
fw ack @a7f3c
fw ack 42 --yes
```

See [patterns/acknowledge-feedback.md](patterns/acknowledge-feedback.md) for when to use ack instead of reply/resolve.

Resolve multiple threads:

```bash
fw close @a7f3c @b8d2e @c9e1f
```

## Staleness Tracking

Review comments include staleness data populated during sync. Query for unaddressed comments:

```bash
fw --type comment | jq 'select(.file_activity_after.modified == false)'
```

The `file_activity_after` field shows:

- `modified` — Whether file was changed after the comment
- `commits_touching_file` — How many commits touched the file
- `latest_commit` — SHA of the most recent commit to the file

## Graphite Stack Support

Firewatch integrates with Graphite for stack-aware queries. When syncing in a repo with Graphite stacks, entries include stack metadata:

```bash
fw sync   # Syncs and auto-detects Graphite stacks
```

### Stack Fields

Entries gain a `graphite` object:

```json
{
  "graphite": {
    "stack_id": "abc123",
    "stack_position": 2,
    "stack_size": 4,
    "parent_pr": 101
  }
}
```

- `stack_position` — 1 is the base (closest to main), higher = further up
- `file_provenance` — Which PR in the stack introduced each file

### Quick Stack Queries

```bash
# All entries with stack metadata
fw | jq 'select(.graphite != null)'

# Base PRs only (bottom of stack)
fw --summary | jq 'select(.graphite.stack_position == 1)'

# Comments where file originated in a different PR
fw --type comment | jq 'select(.file_provenance.origin_pr != .pr)'
```

### Stack Workflows

For detailed Graphite workflows (querying stacks, cross-PR fixes, commit patterns):

- [graphite/stack-queries.md](graphite/stack-queries.md) — Querying stack data
- [graphite/cross-pr-fixes.md](graphite/cross-pr-fixes.md) — File provenance and fixing in the right PR
- [graphite/commit-workflow.md](graphite/commit-workflow.md) — `gt modify` vs `gt amend -a`

## Command Reference

| Command                        | Purpose                                    |
| ------------------------------ | ------------------------------------------ |
| `fw [options]`                 | Query cached entries (auto-syncs if stale) |
| `fw query [options]`           | Same as above (explicit subcommand)        |
| `fw sync`                      | Force sync (incremental or `--full`)       |
| `fw agent view-status`         | Agent-oriented current-branch PR summary   |
| `fw agent view-comments`       | Agent-oriented incremental comment stream  |
| `fw agent view-ci`             | Agent-oriented CI summary for current PR   |
| `fw list`                      | List unaddressed feedback                  |
| `fw list prs`                  | List PRs                                   |
| `fw view <id>`                 | View PR or comment details                 |
| `fw comment <pr> <body>`       | Post a PR-level comment                    |
| `fw reply <id> <body>`         | Reply to a review comment                  |
| `fw close <id>...`             | Resolve review threads                     |
| `fw ack <id>...`               | Acknowledge feedback (local tracking)      |
| `fw approve <pr>`              | Approve PR                                 |
| `fw reject <pr>`               | Request changes on PR                      |
| `fw edit <id>`                 | Edit PR or comment                         |
| `fw status`                    | Firewatch state info                       |
| `fw doctor`                    | Diagnose auth/cache/repo issues            |
| `fw schema <type>`             | Print JSON schema                          |

### Query Options

| Option               | Description                             |
| -------------------- | --------------------------------------- |
| `--type <type>`      | Filter by entry type                    |
| `--since <duration>` | Time filter (24h, 7d, etc.)             |
| `--pr <numbers>`     | Filter by PR number(s)                  |
| `--author <name>`    | Filter by author                        |
| `--open`             | Open PRs only (includes drafts)         |
| `--ready`            | Ready PRs (open, non-draft)             |
| `--mine`             | PRs assigned to me                      |
| `--reviews`          | PRs I need to review                    |
| `--summary`          | Aggregate to per-PR summary             |
| `--no-sync`          | Skip auto-sync; use cache only          |
| `--sync-full`        | Force a full sync before query          |

### Reply Options

| Option       | Description                      |
| ------------ | -------------------------------- |
| `--resolve`  | Resolve the thread after posting |
| `--body <t>` | Reply text (alt to positional)   |

## Patterns

Goal-oriented workflows:

- [patterns/first-time-use.md](patterns/first-time-use.md) — Safe defaults for first use in a repo or session
- [patterns/check-in-on-review.md](patterns/check-in-on-review.md) — Answer broad PR review status questions
- [patterns/check-current-pr.md](patterns/check-current-pr.md) — Pull feedback for the currently checked out branch's PR
- [patterns/triage-feedback.md](patterns/triage-feedback.md) — Prioritize what needs attention on a PR
- [patterns/handle-changes-requested.md](patterns/handle-changes-requested.md) — Work through blocking review feedback cleanly
- [patterns/find-unresolved-comments.md](patterns/find-unresolved-comments.md) — Find open threads or likely still-actionable review comments
- [patterns/reply-to-comments.md](patterns/reply-to-comments.md) — Respond to review comments or PR discussion comments cleanly
- [patterns/reply-and-resolve.md](patterns/reply-and-resolve.md) — Choose between reply, resolve, and reply+resolve
- [patterns/acknowledge-feedback.md](patterns/acknowledge-feedback.md) — Mark feedback as seen without replying yet
- [patterns/current-stack-feedback.md](patterns/current-stack-feedback.md) — Review and prioritize feedback across the current stack
- [patterns/find-comment-by-id.md](patterns/find-comment-by-id.md) — Inspect and act on a single comment or thread ID
- [patterns/bulk-cleanup.md](patterns/bulk-cleanup.md) — Close, reply to, or acknowledge many items after a fix pass

Broader workflows:

- [patterns/daily-standup.md](patterns/daily-standup.md) — Morning PR review workflow
- [patterns/implementing-feedback.md](patterns/implementing-feedback.md) — Systematic feedback resolution
- [patterns/resolving-threads.md](patterns/resolving-threads.md) — Detailed thread resolution patterns

## References

- [references/entry-schema.md](references/entry-schema.md) — FirewatchEntry field reference
- [references/jq-cookbook.md](references/jq-cookbook.md) — Common jq filters
- [references/query-patterns.md](references/query-patterns.md) — Query combinations
- [references/troubleshooting.md](references/troubleshooting.md) — Common issues and fixes

## Agent Tips

1. **Default to Firewatch for PR workflows** — especially review triage, comment inspection, and discussion actions
2. **Use the right surface** — `fw agent` for compact current-branch reads, `fw list` / `fw view` for readable text output, `fw` / `fw query` for JSONL
3. **Do not oversell `ci`** — query cached CI entries when useful, but do not treat Firewatch as a full CI monitoring tool
4. **CLI filters first, then jq** — More efficient than jq-only filtering
5. **Denormalized = no joins** — Each entry has full PR context
6. **Entry IDs for actions** — Use `id` field (or short `@xxxxx`) with `fw reply` and `fw close`
7. **Auto-sync handles freshness** — Queries auto-sync when cache is stale; `fw agent` also refreshes before reading current-branch data
8. **Check `.graphite` for stacks** — Null if not in a Graphite stack
9. **File provenance for cross-PR fixes** — See [graphite/cross-pr-fixes.md](graphite/cross-pr-fixes.md)
