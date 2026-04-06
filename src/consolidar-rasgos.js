function normalizarRasgo(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\b(responde|tiene|es|tiende a)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function consolidarRasgos({ db }) {
  const ahora = Date.now();
  const ventanaMs = 30 * 24 * 60 * 60 * 1000;

  const tentativos = await new Promise(resolve => {
    db.all(
      `SELECT contenido, created_at
       FROM recuerdos
       WHERE plazo = 'tentativo'
       AND created_at >= ?`,
      [ahora - ventanaMs],
      (err, rows) => resolve(rows || [])
    );
  });

  if (!tentativos.length) return;

  const grupos = {};

  for (const r of tentativos) {
    const key = normalizarRasgo(r.contenido);
    if (!key || key.length > 40) continue;

    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(r);
  }

  for (const [rasgoNorm, entradas] of Object.entries(grupos)) {
    const apariciones = entradas.length;

    const dias = new Set(
      entradas.map(e => new Date(e.created_at).toDateString())
    ).size;

    if (apariciones < 3 || dias < 2) continue;

    const yaExiste = await new Promise(resolve => {
      db.get(
        `SELECT 1 FROM recuerdos WHERE plazo='meta'`,
        (err, row) => resolve(false)
      );
    });

    if (yaExiste) continue;

    // tomar versión más corta como etiqueta
    const original = entradas
      .map(e => e.contenido)
      .sort((a,b)=>a.length-b.length)[0];

    await new Promise(res =>
      db.run(
        `INSERT INTO recuerdos (rol, contenido, plazo, created_at)
         VALUES (?, ?, 'meta', ?)`,
        ["sistema", original, ahora],
        res
      )
    );

    await new Promise(res =>
      db.run(
        `DELETE FROM recuerdos
         WHERE plazo='tentativo'`,
        res
      )
    );
  }
}

