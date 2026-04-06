import { Rasgo } from "./trait-types.js"

export interface Conflicto {
  rasgoA:Rasgo
  rasgoB:Rasgo
  intensidad:number
}

export function detectarConflictos(
  rasgos:Rasgo[],
  umbralPeso=0.5
):Conflicto[]{

  const conflictos:Conflicto[]=[]

  const mapa=new Map(rasgos.map(r=>[r.id,r]))

  for(const a of rasgos){

    if(a.peso<umbralPeso) continue

    for(const rel of a.relaciones){

      if(rel.tipo!=="inhibe") continue

      const b=mapa.get(rel.destino)
      if(!b) continue
      if(b.peso<umbralPeso) continue

      conflictos.push({
        rasgoA:a,
        rasgoB:b,
        intensidad:rel.fuerza*Math.min(a.peso,b.peso)
      })
    }
  }

  return conflictos
}