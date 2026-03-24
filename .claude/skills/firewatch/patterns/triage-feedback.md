# Triage Feedback Pattern

Workflow for deciding what needs attention on a PR and what can wait.

## Goal

Quickly separate blocking review feedback from informational noise.

## Start with Readable Output

For a single PR:

```bash
fw view PR_NUMBER
fw list --pr PR_NUMBER
```

For current-branch feedback:

```bash
fw fb --current
```

For a broader morning sweep across open PRs:

```bash
fw --summary --open
```

## What to Prioritize

### 1. Changes requested

```bash
fw --summary | jq 'select(.review_states.changes_requested > 0)'
```

These are highest priority.

### 2. Human review comments on your PR

```bash
fw --type comment --pr PR_NUMBER | jq 'select(
  .subtype == "review_comment" and
  .author != .pr_author
)'
```

### 3. Likely unaddressed review comments

```bash
fw --type comment --pr PR_NUMBER | jq 'select(
  .subtype == "review_comment" and
  .author != .pr_author and
  (.file_activity_after.modified // false) == false
)'
```

### 4. General PR discussion comments

```bash
fw --type comment --pr PR_NUMBER | jq 'select(.subtype == "issue_comment")'
```

These may need a reply even when they are not inline code comments.

## Suggested Triage Order

1. Blocking comments / changes requested
2. Human inline review comments
3. Discussion comments needing clarification or response
4. Bot comments and informational noise

## Decision Rules

### Handle now

- reviewer found a bug
- reviewer requested a concrete code change
- thread is still unaddressed
- changes requested review is present

### Reply first, don’t resolve yet

- comment asks a question
- comment needs clarification
- you disagree with the suggestion
- fix is partial or not yet verified

### Lower priority

- nit comments
- bot comments without concrete action
- already-addressed comments where the file changed after the comment

## Useful Filters

### External feedback only

```bash
fw --type comment --pr PR_NUMBER | jq 'select(.author != .pr_author)'
```

### Count review comments by file

```bash
fw --type comment --pr PR_NUMBER | jq -s '
  map(select(.subtype == "review_comment"))
  | group_by(.file)
  | map({file: .[0].file, count: length})
'
```

### Find comments likely needing code changes

```bash
fw --type comment --pr PR_NUMBER | jq 'select(
  .subtype == "review_comment" and
  (.body | test("consider|should|bug|issue|blocking"; "i"))
)'
```

## Next Step After Triage

- If you need to implement code changes, follow [implementing-feedback.md](implementing-feedback.md).
- If the fix is done and you need to reply or resolve, follow [reply-and-resolve.md](reply-and-resolve.md).
