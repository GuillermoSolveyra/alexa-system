import { borrarRecuerdos, guardarRecuerdo } from "./alexa-memory.js";

export async function procesarComando(texto) {
  const msg = texto.toLowerCase().trim();

  // Reset por lenguaje natural
  if (msg.includes("reinicia memoria")) {
    await borrarRecuerdos();
    return { accion: "comando", respuesta: "Memoria reiniciada." };
  }

  // Guardado manual (override humano)
  if (msg.startsWith("/save ")) {
    const contenido = texto.slice(6);
    await guardarRecuerdo("usuario", contenido, "largo");
    return { accion: "comando", respuesta: "Listo, lo guardo." };
  }

  // Reset explícito
  if (msg === "/reset") {
    await borrarRecuerdos();
    return { accion: "comando", respuesta: "Memoria reiniciada." };
  }

  // Mensaje normal
  return { accion: "mensaje", mensaje: texto };
}

