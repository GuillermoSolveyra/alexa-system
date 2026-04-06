export async function autoEvaluar({ respuesta, contexto, ollama, db, traitSystem }) {

  const prompt = `
Analizá la respuesta de la IA dentro de su contexto.

Contexto conversación:
"""${contexto}"""

Respuesta IA:
"""${respuesta}"""

Tarea:
Determiná si la respuesta revela un rasgo ESTABLE de personalidad.

Reglas:
- Si NO hay rasgo estable → respondé EXACTAMENTE: NADA
- Si SÍ hay rasgo → respondé SOLO este JSON:

{
  "rasgo": "frase corta",
  "confianza": 0.0 a 1.0
}

Condiciones:
- Sé conservador
- No inventes rasgos
- No expliques nada
`.trim();


  const res = await ollama.chat({
    model: "gemma3:4b",
    messages: [{ role: "system", content: prompt }]
  });

  const salida = res.message.content.trim();
  if (salida === "NADA") return;

  const match = salida.match(/\{[\s\S]*\}/);
  if (!match) return;

  let data;
  try {
    data = JSON.parse(match[0]);
  } catch {
    return;
  }

  if (
    !data ||
    typeof data.rasgo !== "string" ||
    typeof data.confianza !== "number"
  ) return;

  const normalizar = t =>
    t.toLowerCase()
     .normalize("NFD")
     .replace(/[\u0300-\u036f]/g, "")
     .replace(/[^\w\s]/g, "")
     .trim();

  const rasgo = data.rasgo.trim();
  const rasgoNorm = normalizar(rasgo);
  let confianza = Number(data.confianza);
  if (Number.isNaN(confianza)) return;

  confianza = Math.min(1, Math.max(0, confianza));
  if (confianza < 0.7) return;

  const existentes = await new Promise(resolve => {
    db.all(
      `SELECT contenido FROM recuerdos WHERE plazo IN ('meta','tentativo')`,
      (err, rows) => resolve(rows || [])
    );
  });

  for (const r of existentes) {
    if (normalizar(r.contenido) === rasgoNorm) return;
  }

  // guardar recuerdo tentativo
  db.run(
    `INSERT INTO recuerdos (rol, contenido, plazo, created_at)
     VALUES (?, ?, ?, ?)`,
    ["sistema", rasgo, "tentativo", Date.now()]
  );


// =========================
// HOOK COGNITIVO
// =========================

if (traitSystem?.procesarEvaluacion) {

  const snapshot = traitSystem.snapshot?.() || [];
  const rasgosValidos = snapshot.map(r => r.id);

  if (!rasgoNorm) return;
  if (!rasgosValidos.includes(rasgoNorm)) return;

  const resultadoEvaluacion = {
    rasgosAfectados: [rasgoNorm],
    resultado: true,
    confianza
  };

  traitSystem.procesarEvaluacion(resultadoEvaluacion);
}

}

