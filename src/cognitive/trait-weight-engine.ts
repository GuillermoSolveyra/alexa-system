import { Rasgo, ContextoEvento } from "./trait-types.js"

const clamp = (v:number,min=0,max=1)=>Math.max(min,Math.min(max,v))

export function calcularPesoContextual(
  rasgo:Rasgo,
  ctx:ContextoEvento
){
  return (
    rasgo.peso *
    ctx.relevancia *
    ctx.coherenciaIdentidad *
    ctx.consistenciaHistorica
  )
}

export function aplicarDeltaRasgo(
  rasgo:Rasgo,
  delta:number,
  ctx:ContextoEvento
){
  const pesoCtx = calcularPesoContextual(rasgo,ctx)
  const deltaFinal = delta * (1 - rasgo.estabilidad) * pesoCtx

  rasgo.valor = clamp(rasgo.valor + deltaFinal)
  rasgo.ultimaActualizacion = Date.now()

  return deltaFinal
}

export function ajustarPeso(
  rasgo:Rasgo,
  resultado:boolean,
  alpha=0.02,
  beta=0.015
)
{
  rasgo.peso += resultado ? alpha : -beta
  rasgo.peso = clamp(rasgo.peso)
}