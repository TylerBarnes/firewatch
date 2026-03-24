# Find Comment by ID Pattern

Workflow for inspecting or acting on one specific comment or thread when the user provides an ID.

## Goal

Handle prompts like "reply to this thread", "show me comment `@a7f3c`", or "resolve this feedback" reliably.

## First Step: Inspect the ID

Use:

```bash
fw view COMMENT_ID
```

This works with Firewatch short IDs like `@a7f3c` and full GitHub IDs.

## What `fw view` Gives You

For a comment or thread ID, `fw view <id>` lets you confirm:

- PR number and title
- author
- body text
- file and line, if it is inline review feedback
- thread status for review comments

## Choose the Next Action

### Reply only

```bash
fw reply COMMENT_ID "Could you clarify what you mean by ... ?"
```

### Reply and resolve

```bash
fw reply COMMENT_ID "Fixed" --resolve
```

### Resolve without reply

```bash
fw close COMMENT_ID
```

### Acknowledge without resolving

```bash
fw ack COMMENT_ID
```

## Decision Rules

- Start with `fw view <id>` before taking action unless the user already supplied enough context.
- Use `fw reply` when a written response is needed.
- Use `fw close` when the thread is clearly resolved and no reply is needed.
- Use `fw ack` when the goal is only to mark the feedback as seen.

## If the ID Is Not Enough

If the user gives only a PR number but means "the relevant comment on this PR", switch to:

```bash
fw list --pr PR_NUMBER
```

If they give a current-branch request instead of an ID, switch to:

```bash
fw fb --current
```

## Related Patterns

- For choosing between reply and resolve, use [reply-and-resolve.md](reply-and-resolve.md).
- For ack-only workflows, use [acknowledge-feedback.md](acknowledge-feedback.md).
- For PR-wide triage, use [triage-feedback.md](triage-feedback.md).
