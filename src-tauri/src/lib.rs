use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let migrations = vec![Migration {
    version: 1,
    description: "create_exhaust_table",
    sql: r#"
      CREATE TABLE IF NOT EXISTS exhaust (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        barcode TEXT NULL,
        label TEXT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        painting TEXT NOT NULL,
        qrcode TEXT NULL,
        isValidated INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        updatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        hash TEXT NOT NULL UNIQUE,
        carBrand TEXT NULL,
        carModel TEXT NULL,
        carType TEXT NULL,
        carEngine TEXT NULL,
        carDateRange TEXT NOT NULL
      );
    "#,
    kind: MigrationKind::Up,
  }];

  tauri::Builder::default()
    .plugin(
      tauri_plugin_sql::Builder::default()
        // IMPORTANT: connection string must match what you load in JS, e.g. `sqlite:exhaust.db`
        .add_migrations("sqlite:exhaust.db", migrations)
        .build(),
    )
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
