# Emotional System – Sistema Alexa

## 1. Visión General

El **Emotional System** define cómo “se siente” la IA en cada momento.

No representa emociones reales, sino un **modelo funcional de estado emocional** que influye en el comportamiento, el tono y la toma de decisiones.

Complementa al sistema cognitivo, agregando una capa de variabilidad y realismo.

---

## 2. Objetivos

* Introducir variabilidad en las respuestas
* Influir en el tono conversacional
* Reaccionar a interacciones del usuario
* Aportar coherencia emocional

---

## 3. Concepto de Estado Emocional

El sistema mantiene un **estado dinámico** compuesto por variables emocionales.

Ejemplos:

* Positividad
* Estrés
* Interés
* Frustración

Cada variable:

* Tiene un valor numérico
* Cambia con el tiempo
* Responde a estímulos

---

## 4. Estructura del Estado

Ejemplo conceptual:

```json id="emo-state"
{
  "positivity": 0.6,
  "stress": 0.2,
  "interest": 0.8,
  "frustration": 0.1
}
```

---

## 5. Funcionamiento

### 5.1 Influencia en respuestas

El estado emocional afecta:

* Tono (más cálido, más frío, más directo)
* Nivel de paciencia
* Forma de interacción

Ejemplo:

* Alta positividad → tono amigable
* Alto estrés → respuestas más cortas o tensas

---

### 5.2 Actualización

El estado cambia según:

* Input del usuario
* Resultado de la interacción
* Evaluación interna

---

### 5.3 Decaimiento natural

Las emociones tienden a estabilizarse:

* Valores extremos vuelven a un baseline
* Evita estados permanentes irreales

---

## 6. Integración en el flujo

```id="emotion-flow"
[Input usuario]
     ↓
[Impacto emocional]
     ↓
[Actualización de estado]
     ↓
[Influencia en respuesta]
```

---

## 7. Relación con otros sistemas

* **Cognitive System (Traits)**

  * Define decisiones racionales

* **Emotional System**

  * Modula cómo se ejecutan esas decisiones

* **Memory System**

  * Puede almacenar eventos emocionalmente relevantes

* **Self-Evaluation**

  * Ajusta el estado tras cada respuesta

---

## 8. Diseño del sistema

### 8.1 Independencia

No depende directamente del modelo de lenguaje.

### 8.2 Simplicidad controlada

Evita modelos emocionales excesivamente complejos.

### 8.3 Coherencia

Debe evitar cambios bruscos sin causa.

---

## 9. Problemas comunes

* Cambios emocionales incoherentes
* Estados extremos constantes
* Falta de impacto real en respuestas
* Desalineación con traits

---

## 10. Futuras mejoras

* Eventos emocionales persistentes
* Memoria emocional
* Relación emoción–decisión más profunda
* Perfiles emocionales personalizados

---

## 11. Rol en el sistema

El Emotional System define:

> **Cómo se expresa la IA, no solo qué decide**

Sin este sistema:

* Las respuestas son planas
* Falta naturalidad
* Se pierde variabilidad

---
