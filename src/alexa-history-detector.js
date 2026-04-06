export function esHistoria(texto) {
  const t = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  let puntos = 0;

  // Longitud
  if (t.length > 280) puntos++;

  // Tiempo / pasado
  if (
    t.includes("cuando") ||
    t.includes("hace") ||
    t.includes("antes") ||
    t.includes("después") ||
    t.includes("en esa epoca") ||
    t.includes("anos")
  ) puntos++;

  // Personas cercanas
  if (
    t.includes("mi padre") ||
    t.includes("mi madre") ||
    t.includes("mi familia") ||
    t.includes("mi ex") ||
    t.includes("mi pareja") ||
    t.includes("mi novio") ||
    t.includes("mi novia") ||
    t.includes("mi amiga") ||
    t.includes("mi amigo") ||
    t.includes("mi abuelo") ||
    t.includes("mi abuela")
  ) puntos++;

  //eventos personales largos
  if (
    t.includes("me paso") ||
    t.includes("me ocurrió") ||
    t.includes("fue una etapa")
  ) puntos++;

  return puntos >= 2;
}

