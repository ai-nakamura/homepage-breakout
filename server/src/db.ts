import Sqlite, { type Database } from 'better-sqlite3';

const db: Database = new Sqlite('../scores.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS scores(
   id         INTEGER PRIMARY KEY AUTOINCREMENT,
   name       TEXT    NOT NULL,
   score      INTEGER NOT NULL,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export default db;
