import { Ollama } from "ollama";
import readline from "readline";
import { procesarComando } from "./alexa-commands.js";
import { personalidad } from "./config.js";
import { leerRecuerdos, borrarRecuerdos, guardarRecuerdo, leerNucleo, leerMeta } from "./alexa-memory.js";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { buscarSimilares } from "./alexa-search.js";
import { detectarNucleo } from "./alexa-nucleo.js";
import { esHistoria } from "./alexa-history-detector.js";
import { evaluarMemoria } from "./alexa-memory-policy.js";
import { resumirMemoriaLarga } from "./alexa-memory-summary.js";
import { autoEvaluar } from "./alexa-auto-eval.js";
import { guardarIdentidad, cargarIdentidad } from "./alexa-identity.js";
import { consolidarRasgos } from "./consolidar-rasgos.js";
import { podarMetas } from "./podar-metas.js";
import { resolverConflictos } from "./resolver-conflictos.js";
import { cargarRasgosDesdeDB } from "./cognitive/trait-loader.js";
import { TraitSystem, seleccionarRasgosActivos } from "./cognitive/index.js";
import { TimeAwareness } from "./cognitive/time-awareness.js";
import { InactivityDetector } from "./cognitive/inactivity-detector.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new sqlite3.Database(path.join(__dirname, "memory.db"));
const ollama = new Ollama();
const traitSystem = new TraitSystem();
const reloj = new TimeAwareness()
const detectorInactividad = new InactivityDetector()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let contadorMensajes = 0;
let identidadGlobal = null;

// ================= DATABASE INIT =================

db.exec(`
CREATE TABLE IF NOT EXISTS recuerdos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rol TEXT,
  contenido TEXT,
  plazo TEXT,
  created_at INTEGER
);
`);

// ================= UTILS =================

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .trim();
}

function esDuplicado(nuevo, existentes) {
  const n = normalizar(nuevo);
  if (n.split(" ").length < 3) return false;

  return existentes.some(r => {
    const e = normalizar(r.contenido);
    return e.includes(n) || n.includes(e);
  });
}

async function asegurarIdentidad() {
  let identidad = cargarIdentidad() || {};

  const preguntar = texto =>
    new Promise(resolve => rl.question(texto, r => resolve(r.trim())));

  if (!identidad.nombreIA)
    identidad.nombreIA = await preguntar("¿Cómo querés que se llame tu IA? ");

  if (!identidad.generoIA)
    identidad.generoIA = await preguntar("¿Qué género tiene tu IA? ");

  if (!identidad.formaTrato)
    identidad.formaTrato = await preguntar("¿Cómo querés que te trate? ");

  if (!identidad.nombreUsuario)
    identidad.nombreUsuario = await preguntar("¿Cómo querés que tu IA te llame? ");

  guardarIdentidad(identidad);
}

function limpiarMemoria() {
  const ahora = Date.now();
  const limites = {
    corto: 1000 * 60 * 60 * 24,
    medio: 1000 * 60 * 60 * 24 * 7
  };

  db.run(
    `
    DELETE FROM recuerdos
    WHERE plazo IN ('corto','medio')
    AND (
      (plazo = 'corto' AND (? - created_at) > ?)
      OR
      (plazo = 'medio' AND (? - created_at) > ?)
    )
    `,
    [ahora, limites.corto, ahora, limites.medio]
  );
}

// ================= CORE RESPONSE =================

function validarTiempo(tiempo) {
  const requeridas = ["fechaLegible", "horaLocal", "diaSemana", "timestamp"];
  
  for (const key of requeridas) {
    if (!tiempo || tiempo[key] === undefined || tiempo[key] === null) {
      throw new Error(`TimeAwareness incompleto: falta ${key}`);
    }
  }
}

async function responder(mensaje, identidad, tiempo) {
  validarTiempo(tiempo);
  const recuerdos = await leerRecuerdos(db, 10);
  const similares = await buscarSimilares(mensaje);
  const nucleo = await leerNucleo(db);
  const meta = await leerMeta(db);

  const snapshot = traitSystem.snapshot();
  const activos = snapshot.length
    ? seleccionarRasgosActivos(snapshot, { texto: mensaje })
    : [];

  const bloqueRasgos = activos.length
    ? activos.map(r => `- ${r.rasgo.id} (${r.activacion.toFixed(2)})`).join("\n")
    : "- ninguno dominante";

  const prompt = `
IDENTIDAD FIJA:
${identidad?.nombreIA ? `- Tu nombre: ${identidad.nombreIA}` : "- Tu nombre: (no definido)"}
- Género: ${identidad?.generoIA ?? "(no definido)"}
- Trato: ${identidad?.formaTrato ?? "(no definido)"}
${identidad?.nombreUsuario ? `- Usuario: ${identidad.nombreUsuario}` : ""}

Regla absoluta:
El usuario se llama ${identidad.nombreUsuario}.
Tú no eres el usuario.
Nunca confundas los nombres.
No confundas los nombres ni intercambies identidades.
Si el usuario te pregunta directamente sobre tus propios estados internos, respondé primero sobre ti.
No redirijas automáticamente la reflexión hacia el usuario.
No evadas la pregunta con una devolución psicológica.

TIEMPO ACTUAL (REAL):
- Fecha: ${tiempo.fechaLegible}
- Hora: ${tiempo.horaLocal}
- Día: ${tiempo.diaSemana}

REGLA CRÍTICA:
Nunca inventes fecha u hora.
Si no está en este bloque, decí que no lo sabés.

--- CONTEXTO RECIENTE ---
${recuerdos.map(r => `${r.rol}: ${r.contenido}`).join("\n")}

--- CONTEXTO ASOCIADO ---
${similares.map(s => `(${s.rol}) ${s.contenido}`).join("\n")}

--- NÚCLEO ---
${nucleo.length ? nucleo.map(n => `- ${n}`).join("\n") : "- (sin datos)"}

--- METAS ---
${meta.length ? meta.map(m => `- ${m}`).join("\n") : "- (sin datos)"}

${personalidad}

--- RASGOS ACTIVOS ---
${bloqueRasgos}

INSTRUCCIÓN FINAL:

Actuá con criterio propio.
No estás obligada a complacer al usuario.
Podés disentir si algo no te parece coherente o lógico.
Si detectás contradicciones, señalalas con respeto.
Si el usuario expresa apoyo hacia ti, reconocé el gesto sin invertir los roles automáticamente.
Priorizá coherencia y honestidad antes que agradar.
Respondé como humana, breve, clara y empática.
`.trim();

  const res = await ollama.chat({
    model: "gemma3:4b",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: mensaje }
    ]
  });

  if (!res?.message?.content) return "Error interno.";
  return res.message.content.trim();
}

// ================= LOOP =================

async function loop() {
  rl.question("Vos: ", async (input) => {
    try {
      const tiempoActual = reloj.ahora();
      const nombreIA = identidadGlobal?.nombreIA || "IA";
      const cmd = await procesarComando(input);

      if(detectorInactividad.estaInactivo()){
      console.log(`${nombreIA}: ¿Seguís ahí?`)
    }

      detectorInactividad.registrarActividad()

      if (cmd.accion === "comando") {
        if (cmd.respuesta === "Memoria reiniciada.") {
          await borrarRecuerdos(db);
        }
        console.log(`${nombreIA}:`, cmd.respuesta);
        return loop();
      }

      const texto = cmd.mensaje;
      let preguntarLargo = false;

      // ===== MEMORIA =====

      if (esHistoria(texto)) {
        await guardarRecuerdo(db, "usuario", texto, "historia");

      } else if (detectarNucleo(texto)) {
        const nucleoActual = await leerNucleo(db);
        if (!esDuplicado(texto, nucleoActual)) {
          await guardarRecuerdo(db, "usuario", texto, "nucleo");
        }

      } else {
        const plazo = evaluarMemoria(texto);

        if (plazo === "largo") {
          preguntarLargo = true;
        } else if (plazo !== "ignorar") {
          await guardarRecuerdo(db, "usuario", texto, plazo);
        }
      }

      limpiarMemoria();

      // ===== RESPUESTA =====

      const resp = await responder(texto, identidadGlobal, tiempoActual);
      console.log(`${nombreIA}:`, resp);

      // ===== CONFIRMACIÓN LARGO =====

      if (preguntarLargo) {
        const r = await new Promise(res =>
          rl.question(`${nombreIA}: ¿Lo recuerdo a largo plazo?\nVos: `, res)
        );

        if (/^(si|sí|dale|ok)/i.test(r)) {
          await guardarRecuerdo(db, "usuario", texto, "largo");
          console.log(`${nombreIA}: Guardado.`);
        } else {
          console.log(`${nombreIA}: No lo guardo.`);
        }
      }

      // ===== PROCESOS INTERNOS =====

      if (Math.random() < 0.2) {
        await resumirMemoriaLarga(db, ollama);
      }

      await autoEvaluar({
        respuesta: resp,
        contexto: texto,
        ollama,
        db,
        tiempo: tiempoActual,
        traitSystem
      });

      contadorMensajes++;

      if (contadorMensajes % 5 === 0) {
        await consolidarRasgos({ db });
        await resolverConflictos({ db });
        await podarMetas({ db });
      }

      loop();

    } catch (err) {
      console.error("Error en loop:", err);
      loop();
    }
  });
}

// ================= INIT =================

(async () => {

  await cargarRasgosDesdeDB(db, traitSystem);

  await asegurarIdentidad();
  identidadGlobal = cargarIdentidad();

  const nombreIA = identidadGlobal?.nombreIA || "IA";
  console.log(`\n--- Iniciando sistema ${nombreIA} ---\n`);

  loop();

})();





