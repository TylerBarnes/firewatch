# Find Unresolved Comments Pattern

Workflow for finding open review threads or likely unresolved comments before replying, fixing, acknowledging, or closing them.

## Goal

Handle prompts like "show me unresolved comments", "find open review threads", "what feedback is still outstanding", or "what comments still need attention".

## Start with Readable Output

For one PR:

```bash
fw list --pr PR_NUMBER
```

For the currently checked out branch's PR:

```bash
fw fb --current
```

For a Graphite stack:

```bash
fw fb --stack
```

These are the best first commands when the user wants a readable review queue instead of raw JSONL.

## Structured Query for Likely Unresolved Review Comments

Use the query surface when you need filtering or jq composition:

```bash
fw --type comment --pr PR_NUMBER --jsonl \
  | jq 'select(.subtype == "review_comment" and (.thread_resolved // false) == false)'
```

This finds review comments whose GitHub thread is still open.

## Broader "Needs Attention" Filter

Some comments may already be resolved in GitHub but still matter locally if no code changed after the comment. To find comments that are likely still actionable:

```bash
fw --type comment --pr PR_NUMBER --jsonl \
  | jq 'select(.subtype == "review_comment" and (.file_activity_after.modified // false) == false)'
```

Use this when the user means "unaddressed" rather than strictly "unresolved".

## Current PR Triage Flow

1. Run `fw fb --current`
2. If the readable list is enough, work from there
3. If you need exact filtering, switch to `fw --type comment --pr PR_NUMBER --jsonl | jq ...`
4. Inspect specific threads with `fw view COMMENT_ID`

## Common Follow-ups

### Reply to an open thread

```bash
fw reply COMMENT_ID "Fixed"
```

### Reply and resolve

```bash
fw reply COMMENT_ID "Fixed" --resolve
```

### Resolve without replying

```bash
fw close COMMENT_ID
```

### Acknowledge locally without resolving

```bash
fw ack COMMENT_ID
```

## Decision Rules

### Use `thread_resolved == false`

When the user explicitly asks for:

- unresolved comments
- open threads
- comments that still need to be resolved in GitHub

### Use `file_activity_after.modified == false`

When the user asks for:

- unaddressed comments
- comments still needing fixes
- likely actionable review feedback

## Stack-Wide Review

For stacked PRs, start with:

```bash
fw fb --stack
```

Then drill into the specific PRs or comment IDs that still need action.

## Related Patterns

- For writing replies, use [reply-to-comments.md](reply-to-comments.md).
- For broader prioritization, use [triage-feedback.md](triage-feedback.md).
- For resolve-only or bulk-close flows, use [resolving-threads.md](resolving-threads.md).
