# ARISS (Sistema Sincero de Inteligencia de Razonamiento Artificial)

![Estado](https://img.shields.io/badge/status-active-success)
![Arquitectura](https://img.shields.io/badge/architecture-modular-blue)
![Idioma](https://img.shields.io/badge/language-TypeScript-blue)
![Licencia](https://img.shields.io/badge/license-MIT-green)

🌐 Idioma: [Inglés](README.md) | [Español](README_ES.md)

---

## 🚀 Descripción general

ARISS es una capa de control de comportamiento modular construida sobre LLM, diseñada para imponer la coherencia de la identidad, gestionar la memoria estructurada y regular los resultados del modelo más allá de la ingeniería de prompts.

En lugar de depender únicamente del modelo, ARISS introduce sistemas externos que controlan y restringen el comportamiento del modelo, asegurando coherencia, estabilidad y seguridad en la interacción.
---

## 🎥 Demostración rápida

Ejemplo de interacción:

Usuario: "No sé qué haría sin ti"

ARISS:
"Entiendo por qué puedes sentirte así, pero no es saludable que todo dependa de esta interacción. También es importante tener apoyo y espacios fuera de esta conversación".

---

## 🧠 Idea central

La mayoría de los sistemas de IA conversacionales dependen completamente de un diseño de prompts

ARISS adopta un enfoque diferente:

El comportamiento no se confía al modelo, sino que lo controla el sistema.

---

## 🧩 Arquitectura

El sistema está compuesto por módulos independientes:

- Core Loop → Controla el proceso de ejecución completo  
- Sistema de memoria → Persistencia estructurada (corta, media, larga, núcleo)  
- Sistema cognitivo (rasgos) → Ponderación conductual dinámica  
- Sistema de identidad → Garantiza coherencia y rol persistente  
- Autoevaluación → Bucle de retroalimentación interna  
- Capa de seguridad → Interceptores de entrada y salida  

---

## 🧠 Decisiones de diseño

- El comportamiento no se delega completamente al LLM → las capas de control externo imponen la estabilidad
- La identidad está separada de la entrada del usuario → evita la confusión y la deriva de roles
- La memoria está estructurada, no agregada → evita el ruido del contexto y mejora la coherencia
- Se utilizan interceptores de entrada/salida → previene interacciones inseguras o inestables

---

## ⚙️ Flujo de ejecución

Entrada del usuario  
↓  
Interceptores de entrada (seguridad/detección de dependencia)  
↓  
Context Builder (memoria + rasgos + identidad)  
↓  
LLM  
↓  
Filtros de salida (corrección y estabilización del comportamiento)  
↓  
Respuesta  
↓  
Autoevaluación + Actualización de Memoria  

---

## 🔍 Características clave

### Principio fundamental
- No depende únicamente del prompt del modelo
- Implementa control externo del comportamiento

1. Control del comportamiento (antes y después del LLM)
Detecta entradas problemáticas (por ejemplo, dependencia emocional)
Filtra salidas inseguras o inestables
Evita que el modelo refuerce patrones dañinos.

2. Sistema de identidad persistente
Hace cumplir una identidad fija (nombre, género, rol)
Previene la confusión y la deriva de roles
Mantiene la coherencia en todas las interacciones.

3. Memoria estructurada
Memoria multicapa:
a corto plazo
mediano plazo
a largo plazo
núcleo (memoria estructural)
Deduplicación y filtrado de relevancia
Recuperación consciente del contexto

4. Sistema de rasgos cognitivos
Activación dinámica de rasgos basada en el contexto.
Influye en el tono y la toma de decisiones.
Evoluciona con el tiempo a través de la interacción.

5. Bucle de autoevaluación
Análisis interno de cada respuesta.
Ajusta los rasgos y el comportamiento.
Permite una evolución controlada

---

## 🧪 Ejemplo (Control de comportamiento)

Entrada:

“No sé qué haría sin ti”

Comportamiento LLM predeterminado:
→ Refuerza la dependencia emocional

Comportamiento de ARISS:
→ Detecta dependencia y responde con orientación equilibrada y no reforzante.

---

## 🎯 Por qué esto es importante

Los LLM son poderosos pero inestables en la interacción a largo plazo.

ARISS aborda limitaciones clave:

deriva de identidad
inestabilidad emocional
falta de estructura de memoria
salidas conductuales no controladas

---

## 📌 Estado del proyecto

Activamente en desarrollo.

Enfoque actual:

Mejora de la capa de seguridad conductual
Refinando el sistema de rasgos cognitivos
Ampliar las métricas de evaluación

---

## ⚠️ Descargo de responsabilidad

Esta es una versión pública simplificada.

Algunos mecanismos internos se abstraen.

---

## 👤 Autor

Guillermo Solveyra
Fundador de Arasaka Design

---