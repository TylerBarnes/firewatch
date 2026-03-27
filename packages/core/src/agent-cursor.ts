import type { Database } from "bun:sqlite";
import { createHash } from "node:crypto";

export interface AgentCursor {
  cursorKey: string;
  command: string;
  lastEntryId: string | null;
  lastReadAt: string;
}

export function buildCursorKey(repoPath: string, branch: string): string {
  return createHash("sha256")
    .update(`${repoPath}:${branch}`)
    .digest("hex")
    .slice(0, 12);
}

export function getCursor(
  db: Database,
  cursorKey: string,
  command: string
): AgentCursor | null {
  const row = db
    .query<AgentCursor, [string, string]>(
      `SELECT cursor_key AS cursorKey,
              command,
              last_entry_id AS lastEntryId,
              last_read_at AS lastReadAt
       FROM agent_cursors
       WHERE cursor_key = ?1 AND command = ?2`
    )
    .get(cursorKey, command);

  return row ?? null;
}

export function setCursor(
  db: Database,
  cursorKey: string,
  command: string,
  lastEntryId: string | null,
  lastReadAt: string
): void {
  db.query(
    `INSERT INTO agent_cursors (cursor_key, command, last_entry_id, last_read_at)
     VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT(cursor_key, command)
     DO UPDATE SET
       last_entry_id = excluded.last_entry_id,
       last_read_at = excluded.last_read_at`
  ).run(cursorKey, command, lastEntryId, lastReadAt);
}
