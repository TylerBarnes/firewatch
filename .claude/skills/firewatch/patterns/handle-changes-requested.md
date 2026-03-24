# Handle Changes Requested Pattern

Workflow for responding when a PR has a changes-requested review.

## Goal

Identify the blocking feedback, group it into actionable work, implement fixes, and close the loop cleanly.

## Detect Changes Requested

Start with a readable check-in:

```bash
fw view PR_NUMBER
fw list --pr PR_NUMBER
```

Then confirm the changes-requested signal in structured output if needed:

```bash
fw --summary --pr PR_NUMBER | jq 'select(.review_states.changes_requested > 0)'
```

## Pull the Actionable Comments

### Human review comments

```bash
fw --type comment --pr PR_NUMBER | jq 'select(
  .subtype == "review_comment" and
  .author != .pr_author
)'
```

### Likely still-unaddressed comments

```bash
fw --type comment --pr PR_NUMBER | jq 'select(
  .subtype == "review_comment" and
  .author != .pr_author and
  (.thread_resolved // false) == false and
  (.file_activity_after.modified // false) == false
)'
```

### Group comments by file

```bash
fw --type comment --pr PR_NUMBER | jq -s '
  map(select(.subtype == "review_comment" and .author != .pr_author))
  | group_by(.file)
  | map({file: .[0].file, count: length, ids: map(.id)})
'
```

## Prioritize the Work

Work in this order:

1. Blocking bugs / correctness issues
2. Direct requests from a changes-requested review
3. Clarifications that block approval
4. Nits and optional cleanup

Treat comments with language like these as high priority:

- `bug`
- `issue`
- `blocking`
- `must`
- `should`

## Implementation Loop

1. Read the comment and nearby code.
2. Make the requested code change.
3. Run the relevant tests/lint/typecheck.
4. Re-sync if you need updated file-activity hints:

```bash
fw sync
```

5. Reply or resolve only after the fix is verified.

## Reply / Resolve Rules

### Reply and resolve

Use when the fix is complete and the thread is clearly addressed:

```bash
fw reply COMMENT_ID "Fixed" --resolve
```

### Reply only

Use when you need reviewer confirmation or are explaining a tradeoff:

```bash
fw reply COMMENT_ID "I kept this as-is because ..."
```

### Resolve without reply

Use sparingly when the fix is self-evident and no explanation is needed:

```bash
fw close COMMENT_ID
```

## Common Outcome Summary

When reporting back, summarize:

- whether changes requested is still the active review state
- which files/comments were addressed
- what remains open, if anything
- what verification was run

## Related Patterns

- For prioritization before coding, use [triage-feedback.md](triage-feedback.md).
- For code-change workflow details, use [implementing-feedback.md](implementing-feedback.md).
- For reply/resolve decisions, use [reply-and-resolve.md](reply-and-resolve.md).
