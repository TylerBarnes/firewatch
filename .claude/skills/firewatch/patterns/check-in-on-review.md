# Check In on Review Pattern

Workflow for broad status questions about a PR review.

## Goal

Answer prompts like "check in on the review" or "what's going on with this PR?" with readable output first, then targeted structured queries if something needs deeper inspection.

## Start with Readable Output

```bash
fw view PR_NUMBER
fw list --pr PR_NUMBER
```

Use this when the user asks:

- "check in on the review"
- "what's the status of this PR?"
- "does this still need anything?"
- "what feedback is still open here?"

## What These Commands Tell You

- `fw view <pr>` gives PR-level context: title, state, review state, recent activity, and summary.
- `fw list --pr <pr>` gives the readable feedback queue for that PR.

If you want a compact rollup across PRs or a machine-friendly summary:

```bash
fw --summary --pr PR_NUMBER
```

## Escalate to Structured Queries Only When Needed

### Review comments only

```bash
fw --type comment --pr PR_NUMBER | jq 'select(.subtype == "review_comment")'
```

### Likely unresolved review comments

```bash
fw --type comment --pr PR_NUMBER | jq 'select(
  .subtype == "review_comment" and
  (.thread_resolved // false) == false and
  (.file_activity_after.modified // false) == false
)'
```

### Discussion comments that may still need a response

```bash
fw --type comment --pr PR_NUMBER | jq 'select(.subtype == "issue_comment")'
```

## Quick Interpretation Rules

### Likely still needs work

- review state shows changes requested
- unresolved human review comments remain
- discussion comments ask questions that were not answered
- recent activity is bot-only and no human feedback was addressed

### Probably okay / mostly clear

- no unresolved human comments remain
- only bot or informational comments remain
- files changed after the main review comments landed
- PR looks approved or comment-only with no blocking signals

## Recommended Answer Shape

When summarizing for the user, report:

1. Whether the PR is still open
2. Whether there are changes requested or open review comments
3. The main actionable themes
4. Whether anything looks self-evidently resolved already

## Next Step Routing

- If the user needs prioritization, follow [triage-feedback.md](triage-feedback.md).
- If the user wants to implement fixes, follow [implementing-feedback.md](implementing-feedback.md).
- If the user wants to reply or resolve, follow [reply-and-resolve.md](reply-and-resolve.md).
