// alexa-memory-policy.js

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function evaluarMemoria(texto) {
  const t = normalizar(texto);

  if (t.length < 20) return "ignorar";

  const palabras = t.split(/\s+/).length;

  // === IDENTIDAD / NÚCLEO FUERTE ===
  // Autodefinición estable
  if (
    /(me llamo|mi nombre es|vivo en|naci en)/.test(t) ||
    /(trabajo como|mi trabajo es|mi profesion es)/.test(t)
  ) {
    return "nucleo";
  }

  // "soy" como identidad (no estados temporales)
  if (
    /soy\s+(un|una)?\s?[\w\s]{1,40}/.test(t) &&
    !/(soy hoy|soy ahora|soy ultimamente|soy estos dias)/.test(t)
  ) {
    return "nucleo";
  }

  // === VALORES / PATRONES ===
  if (
    /(siempre soy|nunca soy|desde chico|desde hace anos)/.test(t)
  ) {
    return "nucleo";
  }

  // === EMOCIÓN RELEVANTE ===
  if (
    /(me siento|me preocupa|me cuesta|tengo miedo|me duele|me angustia)/.test(t)
  ) {
    return "medio";
  }

  // === GUSTOS / RECHAZOS ===
  if (
    /(me gusta|no me gusta|prefiero|odio|amo)/.test(t)
  ) {
    return "medio";
  }

  // === CONTEXTO CONVERSACIONAL ===
  if (palabras >= 8) {
    return "corto";
  }

  return "ignorar";
}

