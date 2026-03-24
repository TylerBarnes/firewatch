# Check Current PR Pattern

Workflow for pulling review feedback for the PR associated with the currently checked out branch.

## Goal

Inspect the current branch's PR with readable output first, then drop to structured queries only if needed.

## Preferred Path

Use Firewatch's current-branch feedback targeting when the goal is "show me feedback for the PR I'm on":

```bash
fw fb --current
```

This is the simplest current-PR command because it lets Firewatch resolve the branch-to-PR mapping.

## Readable Workflow

```bash
fw fb --current
```

Use this when the user asks:

- "pull review comments for the current PR"
- "what feedback is on the PR I'm checked out on?"
- "show me comments for this branch"

## If You Need the PR Number Explicitly

If you need a PR number for `fw view`, `fw list --pr`, or a follow-up action, resolve it with GitHub CLI:

```bash
gh pr view --json number -q '.number'
```

Then use the number with the readable Firewatch surfaces:

```bash
fw view PR_NUMBER
fw list --pr PR_NUMBER
```

## Structured Query Fallback

When the user wants only review comments or a machine-friendly filter, use the PR number and switch to JSONL:

```bash
fw --type comment --pr PR_NUMBER | jq 'select(.subtype == "review_comment")'
```

Useful variants:

```bash
# Human comments only
fw --type comment --pr PR_NUMBER | jq 'select(.author != .pr_author)'

# Likely still-unaddressed review comments
fw --type comment --pr PR_NUMBER | jq 'select(
  .subtype == "review_comment" and
  (.file_activity_after.modified // false) == false
)'
```

## Decision Rule

- Use `fw fb --current` when the goal is "current branch's PR feedback".
- Use `fw view <pr>` for a readable PR summary once the PR number is known.
- Use `fw list --pr <pr>` for readable item-by-item feedback.
- Use `fw --type comment --pr <pr>` only when the user needs custom filtering or extraction.

## Notes

- `fw fb --current` depends on being in a git repo with a branch Firewatch can map to a PR.
- If branch detection fails, fall back to `gh pr view --json number -q '.number'` and then use explicit `--pr` commands.
- Prefer serialized commands here too; avoid parallel `fw` calls against the same cache.
