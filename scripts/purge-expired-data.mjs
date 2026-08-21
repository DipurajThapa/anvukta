/**
 * Deletes personal data that has passed the retention period the privacy notice
 * states, and reports what it removed.
 *
 * A retention promise nobody enforces is not a retention policy. This is the
 * code behind the "How long we keep it" section of src/content/privacy.ts, and
 * the two must be changed together.
 *
 * Run it on a schedule. On Windows, Task Scheduler daily; anywhere else, cron:
 *   0 3 * * *  cd /path/to/site && node scripts/purge-expired-data.mjs
 *
 * Usage:
 *   node scripts/purge-expired-data.mjs            delete what is due
 *   node scripts/purge-expired-data.mjs --dry-run  report only, change nothing
 */
import process from "node:process";
import Database from "better-sqlite3";

const DRY_RUN = process.argv.includes("--dry-run");
const DB_FILE = process.env.PURGE_DB ?? "dev.db";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Every rule here matches a sentence in the privacy notice. Enquiries that
 * became engagements are held back deliberately: the notice says those are kept
 * for as long as professional and tax obligations require, which is a judgement
 * a person makes, not a timer.
 */
const RULES = [
  {
    name: "enquiries that went nowhere",
    days: 730,
    sql: `DELETE FROM contact_submissions
          WHERE status IN ('new', 'read', 'closed')
            AND createdAt < ?`,
    countSql: `SELECT COUNT(*) n FROM contact_submissions
               WHERE status IN ('new', 'read', 'closed')
                 AND createdAt < ?`,
  },
  {
    name: "chat conversations",
    days: 365,
    sql: `DELETE FROM chat_conversations WHERE updatedAt < ?`,
    countSql: `SELECT COUNT(*) n FROM chat_conversations WHERE updatedAt < ?`,
  },
  {
    name: "chat conversations nobody ever wrote in",
    days: 7,
    sql: `DELETE FROM chat_conversations
          WHERE id NOT IN (SELECT DISTINCT conversationId FROM chat_messages)
            AND createdAt < ?`,
    countSql: `SELECT COUNT(*) n FROM chat_conversations
               WHERE id NOT IN (SELECT DISTINCT conversationId FROM chat_messages)
                 AND createdAt < ?`,
  },
  {
    name: "expired rate-limit counters",
    days: 0,
    sql: `DELETE FROM rate_limits WHERE expiresAt < ?`,
    countSql: `SELECT COUNT(*) n FROM rate_limits WHERE expiresAt < ?`,
  },
  {
    name: "expired sign-in sessions",
    days: 0,
    sql: `DELETE FROM sessions WHERE expiresAt < ?`,
    countSql: `SELECT COUNT(*) n FROM sessions WHERE expiresAt < ?`,
  },
];

const db = new Database(DB_FILE);
const now = Date.now();
let total = 0;

console.log(
  `${DRY_RUN ? "Checking" : "Purging"} ${DB_FILE} at ${new Date(now).toISOString()}\n`,
);

for (const rule of RULES) {
  const cutoff = now - rule.days * DAY;
  const due = db.prepare(rule.countSql).get(cutoff).n;

  if (due === 0) {
    console.log(`  0        ${rule.name}`);
    continue;
  }

  if (DRY_RUN) {
    console.log(`  ${String(due).padEnd(8)} ${rule.name}  (would delete)`);
  } else {
    const removed = db.prepare(rule.sql).run(cutoff).changes;
    console.log(`  ${String(removed).padEnd(8)} ${rule.name}  (deleted)`);
    total += removed;
  }
}

// Deleting rows leaves the file the same size, which is misleading for anyone
// checking that data really went.
if (!DRY_RUN && total > 0) db.exec("VACUUM");

db.close();

console.log(
  DRY_RUN
    ? "\nNothing was changed. Run without --dry-run to delete."
    : `\n${total} record(s) deleted.`,
);
