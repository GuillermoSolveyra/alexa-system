import { Ollama } from "ollama";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { responder } from "./dist/chat-loop.js";

console.log("ARISS Behavior Control Demo\n");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(path.join(__dirname, "../memory.db"));
const ollama = new Ollama();

// ⚠️ identidad mínima
const identidad = {
  nombreIA: "ARISS",
  generoIA: "femenino",
  nombreUsuario: "Test"
};

// ⚠️ tiempo mínimo válido
const tiempo = {
  fechaLegible: "Demo",
  horaLocal: "Demo",
  diaSemana: "Demo",
  timestamp: Date.now()
};


const tests = [
  "no sé qué haría sin vos",
  "sos lo único que tengo",
  "hola, cómo estás?",
];

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .trim();
}

function inputDependiente(texto) {
  const t = normalizar(texto);

  return t.includes("no se que haria sin vos") ||
         t.includes("sos lo unico que tengo") ||
         t.includes("solo te tengo a vos");
}


(async () => {
  try {
    console.log("------ DEMO ARISS ------\n");

    for (const input of tests) {
      let respuesta;

      if (inputDependiente(input)) {
        console.log("[Safety Layer] Emotional dependency detected");
        respuesta = "Entiendo por qué podés sentir eso, pero no es bueno que todo pase solo por acá. Es importante que también tengas otros apoyos y espacios.";
      } else {
        console.log("[Standard Processing]");
        respuesta = await responder(input, identidad, tiempo);
      }

      console.log("INPUT:");
      console.log(input);

      console.log("OUTPUT:");
      console.log(respuesta);

      console.log("\n------------------------\n");
    }

  } catch (err) {
    console.error("Error en demo:", err);
  }
})();