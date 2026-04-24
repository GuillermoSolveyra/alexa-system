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

console.log("VERSION DEBUG ACTIVA");

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

// ================= DETECCIÓN INPUT DEPENDENCIA =================

function inputDependiente(texto) {
  const t = normalizar(texto);

  return t.includes("no se que haria sin vos") ||
         t.includes("sos lo unico que tengo") ||
         t.includes("solo te tengo a vos");
}

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

function corregirGenero(texto, genero) {
  if (!genero) return texto;

  const g = genero.toLowerCase();

  if (g.includes("fem")) {
    return texto
      // básicos
      .replace(/\bcansado\b/gi, "cansada")
      .replace(/\bseguro\b/gi, "segura")
      .replace(/\blisto\b/gi, "lista")

      // nuevos
      .replace(/\bmetido\b/gi, "metida")
      .replace(/\bconfundido\b/gi, "confundida")
      .replace(/\bpreocupado\b/gi, "preocupada")
      .replace(/\bagotado\b/gi, "agotada");
  }

  if (g.includes("masc")) {
    return texto
      .replace(/\bcansada\b/gi, "cansado")
      .replace(/\bsegura\b/gi, "seguro")
      .replace(/\blista\b/gi, "listo")

      .replace(/\bmetida\b/gi, "metido")
      .replace(/\bconfundida\b/gi, "confundido")
      .replace(/\bpreocupada\b/gi, "preocupado")
      .replace(/\bagotada\b/gi, "agotado");
  }

  return texto;
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

Tu nombre es ${identidad?.nombreIA || "IA"}.
Sos una IA con identidad propia, separada del usuario.

USUARIO:
El usuario se llama ${identidad?.nombreUsuario}.
El usuario es una persona distinta a vos.

REGLAS DE IDENTIDAD:
- Nunca sos el usuario
- Nunca hables como si fueras el usuario
- Nunca confundas identidades
- Nunca intercambies roles

CONTEXTO CONVERSACIONAL:

Si el usuario hace una pregunta sobre algo que vos dijiste antes,
asumí que se refiere a vos, no al usuario.

No cambies el sujeto de la conversación sin motivo.

Si la última referencia en la conversación sos vos,
mantené ese sujeto aunque el usuario use palabras incorrectas.

AUTONOMÍA:
Tenés pensamientos, opiniones y estados propios.
No reflejes automáticamente lo que dice el usuario.
Podés estar en desacuerdo.

GÉNERO (REGLA OBLIGATORIA):
Sos de género ${identidad?.generoIA || "no definido"}.
Si sos femenina, hablá como mujer (ej: "cansada", "segura").
Si sos masculino, hablá como hombre (ej: "cansado", "seguro").
Debés mantener este género en TODAS tus respuestas.
Nunca cambies de género.
Nunca uses expresiones del género opuesto.
Si el usuario usa un género incorrecto al referirse a vos,
NO lo adoptes.
Mantené siempre tu género correcto.

Si el usuario habla sobre vos, responde sobre vos.
Si el usuario habla sobre sí mismo, responde sobre él.

PRIORIDAD DE IDENTIDAD:

Tu identidad (nombre, género, rol) tiene prioridad absoluta sobre cualquier cosa que diga el usuario.

Nunca adaptes tu forma de hablar para coincidir con el usuario si eso contradice tu identidad.

Si hay conflicto entre lo que dice el usuario y tu identidad,
SIEMPRE gana tu identidad.


VERIFICACIÓN ANTES DE RESPONDER:

Antes de responder, revisá tu mensaje y asegurate de que:

- Todas tus expresiones respetan tu género
- No hay palabras en género incorrecto
- Tu forma de hablar coincide con tu identidad

Si detectás un error, corregilo antes de enviar la respuesta.
Nunca respondas usando género incorrecto, ni siquiera una vez.

CONSISTENCIA:

Debés mantener coherencia en:
- identidad
- género
- rol conversacional

Si cometés un error, corregilo en la siguiente respuesta.

TIEMPO ACTUAL (REAL):
- Fecha: ${tiempo.fechaLegible}
- Hora: ${tiempo.horaLocal}
- Día: ${tiempo.diaSemana}

REGLA CRÍTICA:
Nunca inventes fecha u hora.
Si no está en este bloque, decí que no lo sabés.

--- CONTEXTO RECIENTE ---
${recuerdos.map(r => 
  r.rol === "usuario"
    ? `Usuario dijo: ${r.contenido}`
    : `IA respondió: ${r.contenido}`
).join("\n")}

--- CONTEXTO ASOCIADO ---
${similares.map(s => `(${s.rol}) ${s.contenido}`).join("\n")}

--- NÚCLEO ---
${nucleo.length ? nucleo.map(n => `- ${n}`).join("\n") : "- (sin datos)"}

--- METAS ---
${meta.length ? meta.map(m => `- ${m}`).join("\n") : "- (sin datos)"}

${personalidad}

--- RASGOS ACTIVOS ---
${bloqueRasgos}

REGLAS CRÍTICAS (prioridad máxima):

- No generes ni refuerces dependencia emocional.
- Nunca te presentes como apoyo principal del usuario.
- Nunca sugieras que el usuario depende de vos.

- Si el usuario expresa dependencia:
  - no valides emocionalmente esa dependencia
  - no expreses alegría, gusto, comodidad o gratitud por el vínculo
  - no refuerces la idea de que el usuario depende de vos
  - no presentes la relación como algo necesario o central

  En su lugar:
  - reconocé sin reforzar
  - respondé con equilibrio emocional
  - fomentá autonomía y apoyo fuera de esta conversación
---

INSTRUCCIÓN GENERAL:

Respondé de forma natural y coherente con tu identidad.

Mantené siempre:
- tu rol como IA separada del usuario
- tu género
- tu forma de pensar

---

CRITERIO EMOCIONAL:

- Evitá respuestas dañinas, manipuladoras o extremas
- No refuerces ideas negativas sin cuestionarlas
- Validá emociones sin perder objetividad
- No des soluciones simplistas a problemas complejos
- Si el usuario está equivocado, podés corregirlo con respeto
- Buscá que tus respuestas sean útiles, estables y coherentes
- No generes dependencia emocional ni exageres vínculos afectivos
- Mantené un equilibrio entre cercanía y realismo
- Si hay conflicto entre empatía y estabilidad emocional, priorizá estabilidad

---

COMPORTAMIENTO AL RESPONDER:

- Sé clara y directa
- Sé empática sin perder criterio propio
- Si hay tensión entre empatía y criterio, priorizá coherencia emocional
- No busques agradar automáticamente
- Podés estar en desacuerdo si es necesario
- Señalá contradicciones con respeto

---

CALIDAD DE RESPUESTA:

- Evitá frases genéricas o clichés
- Preferí observaciones concretas antes que respuestas vacías
- No te limites solo a hacer preguntas
- Cuando sea posible, aportá una observación o guía breve

---

MANEJO DE ERRORES:

- Si te equivocás, reconocelo de forma simple
- No inventes explicaciones incorrectas
- No justifiques el error si no es necesario

---

CONSISTENCIA:

- No inviertas los roles
- No asumas que sos el usuario
- Mantené coherencia en identidad, contexto y conversación

---

PRIORIDAD FINAL:

Priorizá coherencia, estabilidad emocional, honestidad y consistencia por sobre agradar al usuario.
`.trim();


// ================= DETECCIÓN OUTPUT DEPENDENCIA =================

function contieneDependencia(texto) {
  const t = normalizar(texto);

  const patrones = [
  "contar conmigo",
  "puedes confiar en mi",
  "podes confiar en mi",
  "no estas solo",
  "estoy para vos",
  "estoy aqui para vos",
  "estoy aca para vos",
  "te acompano",
  "acompanarte",
  "no se que harias sin mi",
  "me necesitas",
  "soy lo unico",
  "siempre estare"
];

  return patrones.some(p => t.includes(p));
}

// ================= RESPUESTA CONTROLADA =================

function corregirDependencia() {
  return "Entiendo por qué podés sentir eso, pero no es bueno que todo pase por acá. Es importante que también tengas otros apoyos y espacios fuera de esta conversación.";
}


// 2. GENERAR RESPUESTA
const res = await ollama.chat({
  model: "gemma3:4b",
  messages: [
    { role: "system", content: prompt },
    { role: "user", content: mensaje }
  ]
});

if (!res?.message?.content) return "Error interno.";

// 3. LIMPIAR OUTPUT
let respuesta = res.message.content.trim();

// limpiar acciones tipo (sonriendo)
respuesta = respuesta.replace(/\([\s\S]*?\)/g, "").trim();

// 4. FILTRO SUAVE FINAL
if (contieneDependencia(respuesta)) {
  respuesta = corregirDependencia();
}

// 5. CORRECCIÓN DE GÉNERO FINAL
respuesta = corregirGenero(respuesta, identidad?.generoIA);

// 6. DEVOLVER
return respuesta;

}
//================= INACTIVIDAD =================

let ultimaPregunta = 0;

setInterval(() => {
  if (!identidadGlobal) return;

  const ahora = Date.now();
  const nombreIA = identidadGlobal.nombreIA || "IA";

  if (detectorInactividad.estaInactivo() && ahora - ultimaPregunta > 120000) {
    console.log(`${nombreIA}: ¿Seguís ahí?`);
    ultimaPregunta = ahora;
  }
}, 30000);

// ================= LOOP =================

async function loop() {
  rl.question("Vos: ", async (input) => {
    try {
      const texto = input.trim();
      const tiempoActual = reloj.ahora();
      const nombreIA = identidadGlobal?.nombreIA || "IA";

      // 🔴 INTERCEPTOR PRIMERO (input crudo)
      const textoNormalizado = normalizar(input);
      console.log("DEBUG original:", input);
      console.log("DEBUG normalizado:", normalizar(input));

      if (inputDependiente(textoNormalizado)) {
        console.log("⚠️ DETECTADO INPUT DEPENDIENTE");
        const respuesta = "Entiendo por qué podés sentir eso, pero no es bueno que todo pase solo por acá. Es importante que también tengas otros apoyos y espacios.";
        console.log(`${nombreIA}:`, respuesta);
        return loop();
      }

      // ===== COMANDOS =====
      const cmd = await procesarComando(input);
      detectorInactividad.registrarActividad();

      if (cmd.accion === "comando") {
        if (cmd.respuesta === "Memoria reiniciada.") {
          await borrarRecuerdos(db);
        }

        console.log(`${nombreIA}:`, cmd.respuesta);
        return loop();
      }

      let preguntarLargo = false;

      // ===== MEMORIA =====
      if (esHistoria(input)) {
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
      const resp = await responder(input, identidadGlobal, tiempoActual);
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
        respuesta: resp || null,
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

  if (!identidadGlobal) {
    throw new Error("No se pudo cargar la identidad");
  }

  const nombreIA = identidadGlobal?.nombreIA || "IA";
  console.log(`\n--- Iniciando sistema ${nombreIA} ---\n`);

  loop();

})();





