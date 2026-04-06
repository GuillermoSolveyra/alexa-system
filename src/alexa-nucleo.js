// alexa-nucleo.js

export function detectarNucleo(texto) {
  const t = texto.toLowerCase();

  // Frases directas (una basta)
  const fuertes = [
    "para mi es muy importante",
    "esto define quien soy",
    "nunca podria aceptar",
    "no quiero volver a pasar",
    "confio en vos",
    "esto es parte de mi",
    "no quiero que vuelva a pasar"
  ];

  if (fuertes.some(f => t.includes(f))) {
    return true;
  }

  // Señales combinadas (2 o más)
  let señales = 0;

  if (t.includes("siempre") || t.includes("nunca")) señales++;
  if (t.includes("me siento") || t.includes("me duele") || t.includes("me marco")) señales++;
  if (t.includes("soy asi") || t.includes("mi forma de ser")) señales++;

  return señales >= 2;
}
