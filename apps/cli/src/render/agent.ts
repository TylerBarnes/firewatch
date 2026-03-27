import { generateShortId, type FirewatchEntry } from "@outfitter/firewatch-core";

interface AgentStatusInput {
  pr: number;
  title: string;
  state: string;
  author: string;
  branch: string;
  labels: string[];
  reviewers: Map<string, string>;
  counts: {
    comments: number;
    reviews: number;
    commits: number;
    ci: number;
  };
  lastActivityAt?: string | undefined;
  previousCursor?: string | null;
  currentCursor: string;
  newCommentCount?: number;
  hasCi: boolean;
}

function truncateLines(body: string | undefined, maxLines: number): string[] {
  if (!body) {
    return ["(no body)"];
  }

  const lines = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maxLines);

  return lines.length > 0 ? lines : ["(no body)"];
}

export function formatAgentCursorHeader(options?: {
  previousCursor?: string | null | undefined;
  activeCursor?: string | null | undefined;
  isReplay?: boolean | undefined;
}): string {
  if (options?.isReplay) {
    return `Showing updates since cursor '${options.activeCursor ?? ""}'.`;
  }

  if (!options?.previousCursor) {
    return "These are all updates for this command (first run; no previous cursor).";
  }

  return `These are new updates since the last time this command ran. To see the previous output, run again with --cursor '${options.previousCursor}'.`;
}

export function formatAgentComments(
  entries: FirewatchEntry[],
  repo: string
): string {
  if (entries.length === 0) {
    return "No new comments.";
  }

  return entries
    .map((entry) => {
      const shortId = `@${generateShortId(entry.id, repo)}`;
      const typeLabel = entry.subtype ?? entry.type;
      const location = entry.file
        ? ` on ${entry.file}${entry.line ? `:${entry.line}` : ""}`
        : "";
      const threadStatus =
        entry.subtype === "review_comment"
          ? ` [${entry.thread_resolved ? "resolved" : "unresolved"}]`
          : "";
      const bodyLines = truncateLines(entry.body, 3)
        .map((line) => `  ${line}`)
        .join("\n");

      const hints = [
        `  → fw reply ${shortId} \"...\"`,
        `  → fw view ${shortId}`,
      ];

      if (entry.subtype === "review_comment") {
        hints.splice(1, 0, `  → fw close ${shortId}`);
      }

      return `${shortId} ${typeLabel} by @${entry.author}${location}${threadStatus}\n${bodyLines}\n${hints.join("\n")}`;
    })
    .join("\n\n");
}

export function formatAgentCi(
  entries: FirewatchEntry[],
  options: { check?: string | undefined }
): string {
  if (entries.length === 0) {
    return "No CI entries found in cache. Run `fw sync` if checks are missing.";
  }

  const filtered = options.check
    ? entries.filter((entry) => (entry.body ?? "").includes(options.check!))
    : entries;

  if (filtered.length === 0) {
    return `No CI entries matched check \"${options.check}\".`;
  }

  return filtered
    .map((entry) => {
      const status = entry.state ?? "unknown";
      const body = entry.body?.trim() || "(no details)";
      if (options.check) {
        return `${status}\n${body}`;
      }

      const summary = body.split("\n")[0] ?? body;
      const hint =
        status === "pending" || status === "failure" || status === "failed"
          ? `  → fw agent view-ci --check \"${summary}\"`
          : "";
      return `${summary} | ${status}${hint ? `\n${hint}` : ""}`;
    })
    .join("\n");
}

export function formatAgentStatus(input: AgentStatusInput): string {
  const lines = [
    `PR #${input.pr}: ${input.title}`,
    `State: ${input.state} | Author: @${input.author} | Branch: ${input.branch} → main`,
  ];

  if (input.labels.length > 0) {
    lines.push(`Labels: ${input.labels.join(", ")}`);
  }

  if (input.reviewers.size > 0) {
    lines.push(
      `Reviewers: ${[...input.reviewers.entries()]
        .map(([reviewer, state]) => `${reviewer} (${state})`)
        .join(", ")}`
    );
  }

  const activityBits = [
    `${input.counts.comments} comments`,
    `${input.counts.reviews} reviews`,
    `${input.counts.commits} commits`,
  ];
  if (input.counts.ci > 0) {
    activityBits.push(`${input.counts.ci} ci`);
  }

  lines.push(
    `Activity: ${activityBits.join(", ")}${input.lastActivityAt ? ` | Last: ${input.lastActivityAt}` : ""}`
  );
  lines.push("");
  lines.push(
    formatAgentCursorHeader({
      previousCursor: input.previousCursor,
    })
  );

  if (input.counts.comments > 0) {
    lines.push(
      `→ fw agent view-comments${input.newCommentCount ? `    # ${input.newCommentCount} new comments` : ""}`
    );
  }
  if (input.hasCi) {
    lines.push("→ fw agent view-ci");
  }
  lines.push(`→ fw view ${input.pr}`);

  return lines.join("\n");
}
