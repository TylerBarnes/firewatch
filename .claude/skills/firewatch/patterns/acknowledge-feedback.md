# Acknowledge Feedback Pattern

Workflow for marking feedback as seen without replying or resolving it yet.

## Goal

Use acknowledgement when the user wants to say "I've seen this" without implying the work is complete.

## When to Use Ack

Use `fw ack` when the user asks to:

- "mark this as seen"
- "ack this feedback"
- "acknowledge these comments"
- "bulk acknowledge everything on this PR"

Ack is different from reply/resolve:

- `fw ack` = seen / tracked
- `fw reply` = explicit written response
- `fw close` = resolve the thread

## Single Comment Ack

```bash
fw ack COMMENT_ID
```

This works with Firewatch short IDs like `@a7f3c`.

## Bulk Ack a PR

```bash
fw ack PR_NUMBER
```

For bulk operations, use `--yes` to skip confirmation when appropriate:

```bash
fw ack PR_NUMBER --yes
```

## Review Existing Acknowledgements

```bash
fw ack --list
```

You can also clear one if needed:

```bash
fw ack --clear COMMENT_ID
```

## Decision Rules

### Use ack

- the user wants to track feedback as seen
- you are triaging and not ready to reply yet
- the thread is not fixed yet
- you want to avoid losing track of issue comments that cannot be resolved on GitHub

### Do not use ack alone

- when the user asked for a written response
- when the fix is done and the thread should be resolved
- when reviewer clarification is required now

## Practical Notes

- Ack stores local tracking and can also add a 👍 reaction when GitHub auth is available.
- For issue comments, ack is especially useful because there may be no resolve action.
- Bulk ack is useful after a first-pass triage when you want to separate "seen" from "still needs work."

## Recommended Follow-up Routing

- If the user wants to prioritize after acknowledging, use [triage-feedback.md](triage-feedback.md).
- If the user wants to answer a comment, use [reply-and-resolve.md](reply-and-resolve.md).
- If the user wants to clear an ack and revisit the thread, use `fw ack --clear COMMENT_ID`.
