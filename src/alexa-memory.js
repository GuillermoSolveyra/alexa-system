// alexa-memory.js

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .trim();
}

function esDuplicadoNucleo(db, contenidoNormalizado) {
  return new Promise((resolve) => {
    db.all(
      `SELECT contenido FROM recuerdos WHERE plazo = 'nucleo'`,
      [],
      (err, rows) => {
        if (err || !rows) return resolve(false);

        const duplicado = rows.some(r => {
          const existente = normalizar(r.contenido);
          return (
            existente === contenidoNormalizado ||
            existente.includes(contenidoNormalizado) ||
            contenidoNormalizado.includes(existente)
          );
        });

        resolve(duplicado);
      }
    );
  });
}

export async function guardarRecuerdo(db, rol, contenido, plazo = "medio") {
  const contenidoNorm = normalizar(contenido);

  if (plazo === "nucleo") {
    const yaExiste = await esDuplicadoNucleo(db, contenidoNorm);
    if (yaExiste) return;
  }

  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO recuerdos (rol, contenido, plazo, created_at)
       VALUES (?, ?, ?, ?)`,
      [rol, contenido, plazo, Date.now()],
      err => err ? reject(err) : resolve()
    );
  });
}

export function leerRecuerdos(db, limit = 10) {
  return new Promise((resolve) => {
    db.all(
      `SELECT rol, contenido, plazo
       FROM recuerdos
       ORDER BY id DESC
       LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err || !rows) return resolve([]);
        resolve(rows.reverse());
      }
    );
  });
}

export function borrarRecuerdos(db) {
  return new Promise((resolve, reject) => {
    db.run(
      `
      DELETE FROM recuerdos
      WHERE plazo NOT IN ('nucleo', 'historia', 'historia_resumen')
      `,
      err => err ? reject(err) : resolve()
    );
  });
}

export function leerNucleo(db, limit = 7) {
  return new Promise((resolve) => {
    db.all(
      `SELECT contenido FROM recuerdos
      WHERE plazo = 'nucleo'
      ORDER BY id DESC
      LIMIT ?`,
      [limit],
      (err, rows) => {
      if (err || !rows) return resolve([]);
      resolve(rows.map(r => r.contenido).reverse());
      }
    );
  });
}

export function leerMeta(db, limit = 5) {
  return new Promise(resolve => {
    db.all(
      `SELECT contenido FROM recuerdos
       WHERE plazo = 'meta'
       ORDER BY id DESC
       LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err || !rows) return resolve([]);
        resolve(rows.map(r => r.contenido));
      }
    );
  });
}




