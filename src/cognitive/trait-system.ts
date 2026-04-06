import { Rasgo, ContextoEvento } from "./trait-types.js"
import { aplicarDeltaRasgo, ajustarPeso } from "./trait-weight-engine.js"
import { propagarCambio } from "./trait-interaction-engine.js"
import { ResultadoEvaluacion } from "./evaluation-types.js"
import { detectarConflictos } from "./contradiction-engine.js"

export class TraitSystem {

  mapa = new Map<string,Rasgo>()

  configPropagacion = {
    profundidadMax:4,
    umbral:0.01
  }

  registrar(r:Rasgo){
  if(this.mapa.has(r.id)) return
  this.mapa.set(r.id,{...r, relaciones:[...r.relaciones]})
}

  obtener(id:string){
    return this.mapa.get(id)
  }

  aplicarEvento(rasgoId:string, delta:number, contexto:ContextoEvento){

  const rasgo = this.mapa.get(rasgoId)
  if(!rasgo) return

  const deltaReal = aplicarDeltaRasgo(rasgo,delta,contexto)

  if(Math.abs(deltaReal)<0.0001) return

  propagarCambio(
    rasgo,
    deltaReal,
    this.mapa,
    this.configPropagacion
  )
}

  feedback(rasgoId:string,positivo:boolean){
    const r = this.mapa.get(rasgoId)
    if(!r) return
    ajustarPeso(r,positivo,Math.min(r.estabilidad,0.95))
  }

  snapshot(){
  return Array.from(this.mapa.values()).map(r=>({
    ...r,
    relaciones: r.relaciones.map((rel)=>({...rel}))
  }))
}

  detectarConflictos(){
  return detectarConflictos(
    Array.from(this.mapa.values()).filter(r=>r.peso>0.2)
  )
}

    procesarEvaluacion(ev:ResultadoEvaluacion){

  if(!ev.rasgosAfectados?.length) return

  for(const id of ev.rasgosAfectados){

    const r = this.mapa.get(id)
    if(!r) continue

    const intensidad = ev.confianza * 0.02 * (1 + r.peso)
    const ajuste = (ev.resultado ? 1 : -1) * intensidad * (1 - r.estabilidad)

    r.peso = Math.max(0,Math.min(1,r.peso + ajuste))
    r.ultimaActualizacion = Date.now()
  }
}

debug(){
  return Array.from(this.mapa.values())
    .sort((a,b)=>b.peso-a.peso)
    .map(r=>`${r.id}:${r.peso.toFixed(2)}`)
}

}