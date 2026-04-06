import { Rasgo } from "./trait-types.js"

const clamp = (v:number,min=0,max=1)=>Math.max(min,Math.min(max,v))

interface PropagacionConfig{
  profundidadMax:number
  umbral:number
}

export function propagarCambio(
  origen:Rasgo,
  delta:number,
  mapa:Map<string,Rasgo>,
  config:PropagacionConfig,
  visitados=new Set<string>(),
  profundidad=0
){
  if(profundidad>=config.profundidadMax) return
  if(Math.abs(delta)<config.umbral) return

  visitados.add(origen.id)

  for(const rel of origen.relaciones){
    const destino = mapa.get(rel.destino)
    if(!destino) continue
    if(visitados.has(destino.id)) continue

    const impacto = delta * rel.fuerza * origen.peso

    if(rel.tipo==="refuerza")
      destino.valor += impacto

    else if(rel.tipo==="inhibe")
      destino.valor -= impacto

    else if(rel.tipo==="modula")
      destino.valor *= (1 + impacto)

    destino.valor = clamp(destino.valor)

    propagarCambio(
      destino,
      impacto,
      mapa,
      config,
      visitados,
      profundidad+1
    )
  }
}