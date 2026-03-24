# Bulk Cleanup Pattern

Workflow for cleaning up many review threads or feedback items after a larger pass of fixes.

## Goal

Handle prompts like "clean up resolved comments", "close everything I already fixed", or "bulk acknowledge this PR" without losing track of what still needs human attention.

## Start by Listing the Feedback

For a single PR:

```bash
fw list --pr PR_NUMBER
```

For current-branch feedback:

```bash
fw fb --current
```

For stack-scoped cleanup:

```bash
fw fb --stack
```

## Separate the Buckets

### Threads likely ready to close

```bash
fw --type comment --pr PR_NUMBER | jq 'select(
  .subtype == "review_comment" and
  (.thread_resolved // false) == false and
  (.file_activity_after.modified // false) == true
) | {id, file, line, body}'
```

### Threads needing an explicit reply

Use readable output or `fw view COMMENT_ID` to find comments that:

- ask a question
- request clarification
- involve a tradeoff or disagreement
- are not self-evident from the diff

### Feedback to acknowledge but not resolve yet

```bash
fw ack PR_NUMBER --yes
```

Use this only when the goal is "mark as seen" rather than "thread is done."

## Bulk Action Options

### Close one or more obviously resolved threads

```bash
fw close COMMENT_ID_1 COMMENT_ID_2 COMMENT_ID_3
```

### Reply and resolve one thread at a time when explanation matters

```bash
fw reply COMMENT_ID "Fixed" --resolve
```

### Bulk acknowledge everything on a PR

```bash
fw ack PR_NUMBER --yes
```

## Safety Rules

- Do not bulk close threads you have not inspected.
- Prefer `fw reply ... --resolve` over silent close when the reviewer would benefit from context.
- Use `fw ack` instead of `fw close` when the work is not complete.
- Re-sync before a final cleanup pass if the local cache may be stale:

```bash
fw sync
```

## Recommended Cleanup Order

1. Close threads with obvious, verified fixes
2. Reply+resolve threads where a short explanation helps
3. Ack items that are seen but not done
4. Leave open anything still ambiguous or unverified

## Related Patterns

- For deciding reply vs resolve, use [reply-and-resolve.md](reply-and-resolve.md).
- For ack-only workflows, use [acknowledge-feedback.md](acknowledge-feedback.md).
- For large review rounds with prioritization first, use [triage-feedback.md](triage-feedback.md).
