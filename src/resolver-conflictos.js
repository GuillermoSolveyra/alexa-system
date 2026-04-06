function normalizar(t) {
  return t
    .toLowerCase()
    .replace(/[^\w\s]/g,"")
    .replace(/\s+/g," ")
    .trim();
}

function sonContradictorios(a,b){

  const pares = [
    ["directa","diplomatica"],
    ["fria","emocional"],
    ["logica","creativa"],
    ["seria","divertida"],
    ["dominante","sumisa"],
    ["formal","informal"]
  ];

  const A = normalizar(a);
  const B = normalizar(b);

  return pares.some(([x,y]) =>
    (A.includes(x)&&B.includes(y)) ||
    (A.includes(y)&&B.includes(x))
  );
}

export async function resolverConflictos({ db }){

  const metas = await new Promise(res=>{
    db.all(
      `SELECT id,contenido,created_at
       FROM recuerdos
       WHERE plazo='meta'`,
      (e,r)=>res(r||[])
    );
  });

  for(let i=0;i<metas.length;i++){
    for(let j=i+1;j<metas.length;j++){

      const a = metas[i];
      const b = metas[j];

      if(!sonContradictorios(a.contenido,b.contenido))
        continue;

      // mantener el más reciente
      const mantener = a.created_at > b.created_at ? a : b;
      const borrar = a.created_at > b.created_at ? b : a;

      await new Promise(res =>
        db.run(`DELETE FROM recuerdos WHERE id=?`,
        [borrar.id], res)
      );

    }
  }
}
