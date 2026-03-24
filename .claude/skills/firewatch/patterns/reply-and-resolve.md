# Reply and Resolve Pattern

Workflow for responding to review comments after you understand or implement the fix.

## Goal

Choose the right action for each thread: reply, reply-and-resolve, or resolve-only.

## Default Actions

### Reply and resolve

Use when you made the change and want a short acknowledgement:

```bash
fw reply COMMENT_ID "Fixed" --resolve
```

### Reply only

Use when you want reviewer confirmation or need clarification:

```bash
fw reply COMMENT_ID "I updated this. Let me know if you'd still like a different approach."
```

### Resolve only

Use when the fix is obvious and no explanation is needed:

```bash
fw close COMMENT_ID
```

## When to Use Each

### Use `fw reply <id> "text" --resolve` when:

- you changed code
- the fix is not obvious from the diff
- a short explanation helps the reviewer
- you want a clear audit trail in the thread

### Use `fw reply <id> "text"` when:

- you need clarification
- you disagree and want discussion
- the fix is partial
- the reviewer should verify before closing

### Use `fw close <id>` when:

- the thread is already effectively addressed
- the fix is self-evident
- several comments were handled by one obvious change

## Good Reply Shapes

- `Fixed`
- `Added null check`
- `Renamed for clarity`
- Extracted to `validateInput` helper
- `Added test coverage`
- `Kept this as-is because ...`
- `Could you clarify what you mean by ... ?`

Keep replies brief and specific.

## Inspect Before Acting

If needed, inspect the thread first:

```bash
fw view COMMENT_ID
```

Or inspect feedback on the PR:

```bash
fw list --pr PR_NUMBER
```

## Bulk Resolution Pattern

When several comments are clearly addressed by the same change:

```bash
fw --type comment --pr PR_NUMBER | jq -r '
  select(
    .subtype == "review_comment" and
    .file == "src/auth.ts" and
    (.file_activity_after.modified // false) == true
  ) | .id
' | xargs fw close
```

## Verification

After resolving, refresh and confirm what remains:

```bash
fw sync
fw --type comment --pr PR_NUMBER | jq 'select(.subtype == "review_comment") | {
  id,
  file,
  line,
  body: .body[0:60]
}'
```

## Decision Rule

- If code changed and the reviewer benefits from context, reply and resolve.
- If discussion is still active, reply only.
- If the fix is obvious and complete, resolve directly.

For a larger end-to-end workflow, see [resolving-threads.md](resolving-threads.md).
