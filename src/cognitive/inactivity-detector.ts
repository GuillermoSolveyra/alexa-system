export class InactivityDetector {

  ultimoMensaje:number
  umbral:number

  constructor(umbralMs=1000*60*5){
    this.umbral=umbralMs
    this.ultimoMensaje=Date.now()
  }

  registrarActividad(){
    this.ultimoMensaje=Date.now()
  }

  obtenerInactividad(){
    return Date.now()-this.ultimoMensaje
  }

  estaInactivo(){
    return this.obtenerInactividad()>this.umbral
  }

}