import { Ollama } from "ollama";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(import.meta.url).split("\\").slice(0, -1).join("\\");
const db = new sqlite3.Database(__dirname + "\\memory.db");
const ollama = new Ollama();

export async function resumirMemoriaLarga() {
  const recuerdos = await new Promise((resolve) => {
    db.all(
      `SELECT contenido FROM recuerdos WHERE plazo = 'largo'`,
      [],
      (_, rows) => resolve(rows || [])
    );
  });

  if (recuerdos.length < 5) return null; // umbral mínimo

  const texto = recuerdos.map(r => `- ${r.contenido}`).join("\n");

  const prompt = `
Resumí los siguientes recuerdos reales del usuario.
Reglas:
- No inventes información
- No agregues opiniones
- Conservá solo hechos y preferencias estables

Recuerdos:
${texto}
`.trim();

  const res = await ollama.chat({
    model: "gemma3:4b",
    messages: [{ role: "system", content: prompt }]
  });

  const resumen = res.message.content.trim();

  db.run(`DELETE FROM recuerdos WHERE plazo = 'largo'`);
  db.run(
    `INSERT INTO recuerdos (rol, contenido, plazo, created_at)
     VALUES (?, ?, 'largo', ?)`,
    ["sistema", resumen, Date.now()]
  );

  return resumen;
}
