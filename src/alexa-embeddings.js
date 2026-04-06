import sqlite3 from "sqlite3";
import { Ollama } from "ollama";
import { fileURLToPath } from "url";

const ollama = new Ollama();
const __dirname = fileURLToPath(import.meta.url).split("\\").slice(0, -1).join("\\");
const db = new sqlite3.Database(__dirname + "\\memory.db");

db.exec(`CREATE TABLE IF NOT EXISTS embeddings (id INTEGER PRIMARY KEY, vector BLOB);`);

export async function generarEmbedding(id, texto) {
  const res = await ollama.embeddings({ model: "nomic-embed-text", prompt: texto });
  const vector = JSON.stringify(res.embedding);
  db.run(`INSERT OR REPLACE INTO embeddings (id, vector) VALUES (?, ?)`, [id, vector]);
}

export async function buscarSimilar(texto) {
  const res = await ollama.embeddings({ model: "nomic-embed-text", prompt: texto });
  const queryVector = JSON.stringify(res.embedding);

  return new Promise((resolve) => {
    db.all(`SELECT id, vector FROM embeddings`, (err, rows) => {
      if (err || !rows) return resolve(null);

      let mejor = null;
      let mejorScore = -1;

      for (const r of rows) {
        const v = JSON.parse(r.vector);
        const q = JSON.parse(queryVector);
        const score = v.reduce((acc, val, i) => acc + val * q[i], 0);
        if (score > mejorScore) {
          mejorScore = score;
          mejor = r.id;
        }
      }
      resolve(mejor);
    });
  });
}
