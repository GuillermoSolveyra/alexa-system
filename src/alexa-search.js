import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new sqlite3.Database(path.join(__dirname, "memory.db"));

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;
  if (a.length === 0 || b.length === 0) return 0;

  const dot = a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));

  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

export async function buscarSimilares(embeddingConsulta, limite = 5) {
  return new Promise((resolve) => {
    db.all(
      `SELECT r.rol, r.contenido, e.vector
       FROM recuerdos r
       JOIN embeddings e ON r.id = e.recuerdo_id`,
      [],
      (err, rows) => {
        if (err || !rows) return resolve([]);

        const resultados = rows
          .map(r => {
            const vector = JSON.parse(r.vector);
            return {
              rol: r.rol,
              contenido: r.contenido,
              score: cosineSimilarity(embeddingConsulta, vector)
            };
          })
          .filter(r => r.score > 0.25)
          .sort((a, b) => b.score - a.score)
          .slice(0, limite);

        resolve(resultados);
      }
    );
  });
}

