export interface TiempoInterno {
  timestamp: number
  fechaISO: string
  horaLocal: string
  fechaLegible: string
  diaSemana: string
}

export class TimeAwareness {

  ahora(): TiempoInterno {
    const d = new Date()

    return {
      timestamp: d.getTime(),
      fechaISO: d.toISOString(),
      horaLocal: d.toLocaleTimeString(),
      fechaLegible: d.toLocaleDateString(),
      diaSemana: d.toLocaleDateString(undefined, { weekday: "long" })
    }
  }

  diferenciaMs(a: number, b: number) {
    return Math.abs(a - b)
  }

  pasaronHoras(ts: number, horas: number) {
    return Date.now() - ts > horas * 3600000
  }

  pasaronDias(ts: number, dias: number) {
    return Date.now() - ts > dias * 86400000
  }
}