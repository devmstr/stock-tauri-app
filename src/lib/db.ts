import Database from "@tauri-apps/plugin-sql"

let dbPromise: Promise<Database> | null = null

/**
 * SQLite file is stored under Tauri's AppConfig directory.
 * See Tauri SQL plugin docs for `sqlite:<file>.db` connection strings.
 */
export function getDb() {
  if (!dbPromise) {
    dbPromise = Database.load("sqlite:exhaust.db")
  }
  return dbPromise
}
