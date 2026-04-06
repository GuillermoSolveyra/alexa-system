export async function resumirMemoriaLarga(db, ollama) {
  const recuerdos = await new Promise((resolve) => {
    db.all(
      `SELECT id, contenido FROM recuerdos 
       WHERE rol = 'usuario' AND plazo = 'historia'
       ORDER BY created_at ASC`,
      (err, rows) => resolve(rows || [])
    );
  });

  if (recuerdos.length < 20) return;

  const texto = recuerdos.map(r => `- ${r.contenido}`).join("\n");

  const prompt = `
    Resumí estos hechos importantes del usuario.
    Sé factual, estable y claro.
    No interpretes ni juzgues.

    ${texto}
    `.trim();

  const res = await ollama.chat({
    model: "gemma3:4b",
    messages: [{ role: "system", content: prompt }]
  });

  const resumen = res.message.content.trim();

  db.run(
    `INSERT INTO recuerdos (rol, contenido, plazo, created_at)
     VALUES (?, ?, ?, ?)`,
    ["sistema", resumen, "historia_resumen", Date.now()]
  );

}
