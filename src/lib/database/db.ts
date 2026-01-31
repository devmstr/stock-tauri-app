import Database from '@tauri-apps/plugin-sql'

let dbPromise: Promise<Database> | null = null

/**
 * SQLite file is stored under Tauri's AppConfig directory.
 * See Tauri SQL plugin docs for `sqlite:<file>.db` connection strings.
 */
export async function getDb() {
  // Check if we are in a Tauri environment
  const isTauri =
    typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__

  if (!isTauri) {
    throw new Error(
      'Database access is only available within the Tauri application.'
    )
  }

  if (!dbPromise) {
    dbPromise = Database.load('sqlite:exhaust.db')
  }
  return dbPromise
}
