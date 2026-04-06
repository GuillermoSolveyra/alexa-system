import { Rasgo } from "./trait-types.js"

export interface ContextoCognitivo{
  texto:string
  intencion?:string
  emocion?:string
  topicos?:string[]
}

export interface RasgoActivo{
  rasgo:Rasgo
  activacion:number
}

const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v))

function similitud(a:string,b:string){
  a=a.toLowerCase()
  b=b.toLowerCase()
  if(a===b) return 1
  if(a.includes(b)||b.includes(a)) return 0.7
  return 0
}

export function seleccionarRasgosActivos(
  rasgos:Rasgo[],
  contexto:ContextoCognitivo,
  limite=6
):RasgoActivo[]{

  const texto=contexto.texto.toLowerCase()

  const activados = rasgos.map(r=>{

    let score=0

    // coincidencia directa con texto
    if(texto.includes(r.id))
      score+=0.6

    // coincidencia con tópicos
    if(contexto.topicos){
      for(const t of contexto.topicos)
        score+=similitud(r.id,t)*0.4
    }

    // emoción relevante
    if(contexto.emocion){
      score+=similitud(r.id,contexto.emocion)*0.5
    }

    // intención relevante
    if(contexto.intencion){
      score+=similitud(r.id,contexto.intencion)*0.5
    }

    // peso interno
    score+=r.peso*0.3

    // valor actual
    score+=r.valor*0.2

    return {
      rasgo:r,
      activacion:clamp(score)
    }
  })

  return activados
    .filter(r=>r.activacion>0.15)
    .sort((a,b)=>b.activacion-a.activacion)
    .slice(0,limite)
}