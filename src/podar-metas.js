export async function podarMetas({ db, max = 20 }) {

  const metas = await new Promise(resolve => {
    db.all(
      `SELECT id, contenido, created_at
       FROM recuerdos
       WHERE plazo='meta'`,
      (err, rows) => resolve(rows || [])
    );
  });

  if (metas.length <= max) return;

  const ahora = Date.now();

  const conScore = metas.map(m => {
    const dias = (ahora - m.created_at) / (1000*60*60*24);

    let bonus = 0;
    if (dias < 3) bonus = 3;
    else if (dias < 7) bonus = 2;
    else if (dias < 15) bonus = 1;

    return {
      ...m,
      score: bonus
    };
  });

  conScore.sort((a,b)=>b.score-a.score);

  const borrar = conScore.slice(max);

  for (const m of borrar) {
    await new Promise(res =>
      db.run(`DELETE FROM recuerdos WHERE id=?`, [m.id], res)
    );
  }
}
