import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(import.meta.url).split("\\").slice(0, -1).join("\\");
const db = new sqlite3.Database(__dirname + "\\memory.db");

db.exec(`CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY, tag TEXT);`);

export function agregarTag(id, tag) {
  db.run(`INSERT INTO tags (id, tag) VALUES (?, ?)`, [id, tag]);
}

export function leerTags(id) {
  return new Promise((resolve) => {
    db.all(`SELECT tag FROM tags WHERE id = ?`, [id], (err, rows) => {
      resolve(rows ? rows.map(r => r.tag) : []);
    });
  });
}
