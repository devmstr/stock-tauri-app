import Database from '@tauri-apps/plugin-sql'

let dbPromise: Promise<Database> | null = null

/**
 * SQLite file is stored under Tauri's AppConfig directory.
 * See Tauri SQL plugin docs for `sqlite:<file>.db` connection strings.
 */
export async function getDb() {
  const isTauri = !!(
    window &&
    ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)
  )

  if (!isTauri) {
    throw new Error(
      'Accès à la base de données impossible : vous semblez être dans un navigateur. Veuillez lancer l\'application via Tauri (pnpm tauri:dev).'
    )
  }

  if (!dbPromise) {
    try {
      dbPromise = Database.load('sqlite:exhaust.db')
      // Await once to catch early connection errors
      await dbPromise
    } catch (err) {
      dbPromise = null
      throw err
    }
  }
  return dbPromise
}
