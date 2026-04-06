import { procesarComando } from "./alexa-commands.js";

const pruebas = [
  "/save Hola mundo",
  "/forget usa menos formalidad",
  "/reset",
  "Hola Alexa"
];

for (const p of pruebas) {
  const r = await procesarComando(p);
  console.log(p, "→", r);
}
