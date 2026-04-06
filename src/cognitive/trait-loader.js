export async function cargarRasgosDesdeDB(db, traitSystem){

  const rows = await new Promise(resolve=>{
    db.all(
      `SELECT contenido FROM recuerdos 
       WHERE plazo IN ('meta','largo')`,
      (err,rows)=>resolve(rows||[])
    )
  })

  const crearRasgoBase = (texto)=>({
    id: normalizar(texto),
    valor:0.6,
    peso:0.7,
    estabilidad:0.6,
    fuente:"aprendido",
    relaciones:[],
    ultimaActualizacion:Date.now()
  })

  const normalizar = t =>
    t.toLowerCase()
     .normalize("NFD")
     .replace(/[\u0300-\u036f]/g,"")
     .replace(/[^\w\s]/g,"")
     .trim()

  for(const r of rows){
    const id = normalizar(r.contenido)
    if(traitSystem.obtener(id)) continue
    traitSystem.registrar(crearRasgoBase(r.contenido))
  }

}