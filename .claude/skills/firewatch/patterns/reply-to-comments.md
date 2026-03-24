# Reply to Comments Pattern

Workflow for writing responses to review comments or PR discussion comments.

## Goal

Handle prompts like "reply to this comment", "respond to these review comments", or "draft replies for open threads" with the right inspection and response flow.

## Start by Inspecting the Comment

For a specific comment or thread ID:

```bash
fw view COMMENT_ID
```

For a PR-wide reply pass:

```bash
fw list --pr PR_NUMBER
```

For the currently checked out branch's PR:

```bash
fw fb --current
```

## Default Reply Command

```bash
fw reply COMMENT_ID "Your reply here"
```

Use `--resolve` only when the fix is complete and the thread should close:

```bash
fw reply COMMENT_ID "Fixed" --resolve
```

## Common Reply Situations

### Clarify or ask a follow-up

```bash
fw reply COMMENT_ID "Could you clarify what you mean by ... ?"
```

### Confirm a code change

```bash
fw reply COMMENT_ID "Added null check"
```

### Explain a tradeoff or disagreement

```bash
fw reply COMMENT_ID "I kept this as-is because this path needs to preserve ..."
```

### Confirm partial progress without closing

```bash
fw reply COMMENT_ID "I updated the main case. I'm still checking the edge case you mentioned."
```

## Good Reply Shapes

- `Fixed`
- `Added null check`
- `Renamed for clarity`
- `Added test coverage`
- `I kept this as-is because ...`
- `Could you clarify what you mean by ... ?`

Keep replies brief, concrete, and tied to the feedback.

## Decision Rules

### Reply only

Use `fw reply` without `--resolve` when:

- the reviewer asked a question
- clarification is needed
- you disagree and want discussion
- the fix is partial or unverified

### Reply and resolve

Use `fw reply ... --resolve` when:

- the fix is complete
- the thread is ready to close
- a short written acknowledgement helps the reviewer

### Do not reply yet

If you still need to find the thread or determine if it is unresolved, switch to [find-unresolved-comments.md](find-unresolved-comments.md).

## Multi-Comment Reply Pass

When replying to several comments on one PR:

1. List the comments with `fw list --pr PR_NUMBER`
2. Inspect any ambiguous threads with `fw view COMMENT_ID`
3. Reply one thread at a time with `fw reply`
4. Add `--resolve` only for completed threads

## Related Patterns

- For choosing reply vs resolve vs close-only, use [reply-and-resolve.md](reply-and-resolve.md).
- For a specific provided ID, use [find-comment-by-id.md](find-comment-by-id.md).
- For finding the open threads first, use [find-unresolved-comments.md](find-unresolved-comments.md).
