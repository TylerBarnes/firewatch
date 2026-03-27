import {
  buildCursorKey,
  detectRepo,
  getCursor,
  getDatabase,
  getPrForCurrentBranch,
  loadConfig,
  queryEntries,
  setCursor,
  type FirewatchEntry,
} from "@outfitter/firewatch-core";
import { Command } from "commander";

import { ensureRepoCache } from "../query-helpers";
import {
  formatAgentCi,
  formatAgentComments,
  formatAgentCursorHeader,
  formatAgentStatus,
} from "../render/agent";

interface AgentCommonOptions {
  cursor?: string;
}

interface AgentCiOptions extends AgentCommonOptions {
  check?: string;
}

const AGENT_STATUS_COMMAND = "view-status";
const AGENT_COMMENTS_COMMAND = "view-comments";
const AGENT_CI_COMMAND = "view-ci";

function buildReadCursor(lastEntryId: string | null, lastReadAt: string): string {
  return `${lastReadAt}:${lastEntryId ?? "none"}`;
}

function getReplayCursor(
  entries: FirewatchEntry[],
  latest: FirewatchEntry | null
): string | null {
  if (entries.length === 0) {
    return null;
  }

  if (entries.length === 1 || !latest) {
    return null;
  }

  const sorted = [...entries].sort((a, b) => {
    if (a.created_at === b.created_at) {
      return a.id.localeCompare(b.id);
    }
    return a.created_at.localeCompare(b.created_at);
  });
  const previous = sorted[sorted.length - 2] ?? null;
  return previous ? buildReadCursor(previous.id, previous.created_at) : null;
}

function parseReadCursor(cursor: string): { lastReadAt: string; lastEntryId: string | null } {
  const separatorIndex = cursor.lastIndexOf(":");
  if (separatorIndex === -1) {
    throw new Error(`Invalid cursor: ${cursor}`);
  }

  const lastReadAt = cursor.slice(0, separatorIndex);
  const lastEntryId = cursor.slice(separatorIndex + 1);
  return {
    lastReadAt,
    lastEntryId: lastEntryId === "none" ? null : lastEntryId,
  };
}

async function createAgentContext(command: string, overrideCursor?: string) {
  const config = await loadConfig();
  const detected = await detectRepo();
  if (!detected.repo) {
    throw new Error("Could not detect repository from current working directory.");
  }

  const branchPr = await getPrForCurrentBranch();
  if (!branchPr.pr || !branchPr.branch) {
    throw new Error(branchPr.error ?? "No PR found for current branch.");
  }

  await ensureRepoCache(
    detected.repo,
    config,
    detected.repo,
    "open",
    { full: false }
  );

  const db = getDatabase();
  const cursorKey = buildCursorKey(detected.cwd, branchPr.branch);
  const storedCursor = getCursor(db, cursorKey, command);
  const effectiveCursor = overrideCursor
    ? parseReadCursor(overrideCursor)
    : storedCursor
      ? {
          lastReadAt: storedCursor.lastReadAt,
          lastEntryId: storedCursor.lastEntryId,
        }
      : null;

  return {
    config,
    db,
    repo: detected.repo,
    pr: branchPr.pr,
    branch: branchPr.branch,
    cursorKey,
    storedCursor,
    effectiveCursor,
    overrideCursor,
  };
}

function filterEntriesSinceCursor(
  entries: FirewatchEntry[],
  cursor: { lastReadAt: string; lastEntryId: string | null } | null
): FirewatchEntry[] {
  if (!cursor) {
    return entries;
  }

  return entries.filter((entry) => {
    if (entry.created_at > cursor.lastReadAt) {
      return true;
    }
    if (entry.created_at < cursor.lastReadAt) {
      return false;
    }
    if (!cursor.lastEntryId) {
      return true;
    }
    return entry.id !== cursor.lastEntryId;
  });
}

function latestEntry(entries: FirewatchEntry[]): FirewatchEntry | null {
  if (entries.length === 0) {
    return null;
  }

  return [...entries].sort((a, b) => {
    if (a.created_at === b.created_at) {
      return a.id.localeCompare(b.id);
    }
    return a.created_at.localeCompare(b.created_at);
  })[entries.length - 1] ?? null;
}

async function handleViewComments(options: AgentCommonOptions): Promise<void> {
  const ctx = await createAgentContext(AGENT_COMMENTS_COMMAND, options.cursor);
  const entries = await queryEntries({
    filters: {
      repo: ctx.repo,
      pr: ctx.pr,
      type: "comment",
    },
  });

  const freshEntries = filterEntriesSinceCursor(entries, ctx.effectiveCursor);
  const latest = latestEntry(entries);
  console.log(
    formatAgentCursorHeader({
      previousCursor: getReplayCursor(entries, latest),
      activeCursor: options.cursor ?? null,
      isReplay: Boolean(options.cursor),
    })
  );
  console.log("");
  console.log(formatAgentComments(freshEntries, ctx.repo));

  setCursor(
    ctx.db,
    ctx.cursorKey,
    AGENT_COMMENTS_COMMAND,
    latest?.id ?? null,
    latest?.created_at ?? new Date().toISOString()
  );
}

async function handleViewCi(options: AgentCiOptions): Promise<void> {
  const ctx = await createAgentContext(AGENT_CI_COMMAND, options.cursor);
  const entries = await queryEntries({
    filters: {
      repo: ctx.repo,
      pr: ctx.pr,
      type: "ci",
    },
  });

  const freshEntries = filterEntriesSinceCursor(entries, ctx.effectiveCursor);
  const latest = latestEntry(entries);
  console.log(
    formatAgentCursorHeader({
      previousCursor: getReplayCursor(entries, latest),
      activeCursor: options.cursor ?? null,
      isReplay: Boolean(options.cursor),
    })
  );
  console.log("");
  console.log(formatAgentCi(freshEntries, { check: options.check }));

  setCursor(
    ctx.db,
    ctx.cursorKey,
    AGENT_CI_COMMAND,
    latest?.id ?? null,
    latest?.created_at ?? new Date().toISOString()
  );
}

async function handleViewStatus(options: AgentCommonOptions): Promise<void> {
  const ctx = await createAgentContext(AGENT_STATUS_COMMAND, options.cursor);
  const entries = await queryEntries({
    filters: {
      repo: ctx.repo,
      pr: ctx.pr,
    },
  });

  if (entries.length === 0) {
    throw new Error(`PR #${ctx.pr} not found in cache.`);
  }

  const latest = latestEntry(entries);
  const currentCursor = buildReadCursor(
    latest?.id ?? null,
    latest?.created_at ?? new Date().toISOString()
  );
  const freshCommentEntries = filterEntriesSinceCursor(
    entries.filter((entry) => entry.type === "comment"),
    ctx.effectiveCursor
  );

  const prEntry = entries[0]!;
  const reviewers = new Map<string, string>();
  for (const entry of entries) {
    if (entry.type === "review" && entry.state) {
      reviewers.set(entry.author, entry.state.toLowerCase());
    }
  }

  console.log(
    formatAgentStatus({
      pr: ctx.pr,
      title: prEntry.pr_title,
      state: prEntry.pr_state,
      author: prEntry.pr_author,
      branch: prEntry.pr_branch,
      labels: prEntry.pr_labels ?? [],
      reviewers,
      counts: {
        comments: entries.filter((entry) => entry.type === "comment").length,
        reviews: entries.filter((entry) => entry.type === "review").length,
        commits: entries.filter((entry) => entry.type === "commit").length,
        ci: entries.filter((entry) => entry.type === "ci").length,
      },
      lastActivityAt: latest?.created_at,
      previousCursor: getReplayCursor(entries, latest),
      currentCursor,
      newCommentCount: freshCommentEntries.length,
      hasCi: entries.some((entry) => entry.type === "ci"),
    })
  );

  setCursor(
    ctx.db,
    ctx.cursorKey,
    AGENT_STATUS_COMMAND,
    latest?.id ?? null,
    latest?.created_at ?? new Date().toISOString()
  );
}

const viewCommentsSubcommand = new Command("view-comments")
  .description("View new comments for the current branch PR")
  .option("--cursor <cursor>", "Replay from an earlier cursor")
  .action(handleViewComments);

const viewCiSubcommand = new Command("view-ci")
  .description("View CI status for the current branch PR")
  .option("--cursor <cursor>", "Replay from an earlier cursor")
  .option("--check <name>", "Show details for one check")
  .action(handleViewCi);

const viewStatusSubcommand = new Command("view-status")
  .description("View status summary for the current branch PR")
  .option("--cursor <cursor>", "Replay from an earlier cursor")
  .action(handleViewStatus);

export const agentCommand = new Command("agent")
  .description("Agent-optimized commands with cursor tracking")
  .addCommand(viewCommentsSubcommand)
  .addCommand(viewCiSubcommand)
  .addCommand(viewStatusSubcommand);
