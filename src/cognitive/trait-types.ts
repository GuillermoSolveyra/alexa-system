export type RelacionTipo = "refuerza" | "inhibe" | "modula"

export interface Relacion {
  destino: string
  tipo: RelacionTipo
  fuerza: number
}

export interface Rasgo {
  id: string
  valor: number
  peso: number
  estabilidad: number
  fuente: "nucleo" | "aprendido" | "meta"
  relaciones: Relacion[]
  ultimaActualizacion: number
}

export interface ContextoEvento {
  relevancia: number
  coherenciaIdentidad: number
  consistenciaHistorica: number
}