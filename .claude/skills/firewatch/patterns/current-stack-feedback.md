# Current Stack Feedback Pattern

Workflow for reviewing and prioritizing feedback across the current Graphite stack.

## Goal

Handle prompts like "what feedback is on my stack?" or "which PR in this stack should I fix first?" with stack-aware ordering and cross-PR fix routing.

## Start with Stack-Scoped Feedback

```bash
fw fb --stack
```

Useful variants:

```bash
# Current PR + downstack toward trunk
fw fb --stack down

# Current PR + upstack toward tip
fw fb --stack up
```

Use this when the user asks about the current stack rather than one PR.

## Prioritize Bottom-Up

When the stack has multiple PRs, prioritize base PRs first.

Base PRs are the ones with lower `graphite.stack_position` values.

If you need structured output to sort or summarize:

```bash
fw --type comment --pr PR_1,PR_2,PR_3 | jq 'select(.graphite.stack_position != null) | {
  id,
  pr: .pr_number,
  stack_position: .graphite.stack_position,
  author,
  file,
  body
}'
```

## What to Look For

### Blocking or likely-unaddressed review comments

```bash
fw --type comment --pr PR_1,PR_2,PR_3 | jq 'select(
  .subtype == "review_comment" and
  (.thread_resolved // false) == false and
  (.file_activity_after.modified // false) == false
) | {
  id,
  pr: .pr_number,
  stack_position: .graphite.stack_position,
  file,
  body
}'
```

### Cross-PR fixes

```bash
fw --type comment --pr PR_1,PR_2,PR_3 | jq 'select(.file_provenance.origin_pr != null) | {
  id,
  pr: .pr_number,
  origin_pr: .file_provenance.origin_pr,
  file,
  body
}'
```

If `origin_pr` differs from the commenting PR, the fix belongs in the origin PR.

## Decision Rules

### Fix base PR first when

- the comment is on a lower stack position
- a file originated in a lower PR
- the change will propagate up the stack

### Fix current/top PR directly when

- the feedback is specific to that PR's unique changes
- provenance does not point lower in the stack
- the issue is isolated and does not affect ancestors

## Reporting Back

When summarizing stack feedback, include:

1. Which PRs in the stack have open feedback
2. Which PR should be handled first
3. Whether any comments should be fixed in another PR due to provenance
4. Whether any comments are likely already addressed

## Related Patterns

- For one PR on the current branch, use [check-current-pr.md](check-current-pr.md).
- For generic prioritization, use [triage-feedback.md](triage-feedback.md).
- For provenance-based routing, see [../graphite/cross-pr-fixes.md](../graphite/cross-pr-fixes.md).
