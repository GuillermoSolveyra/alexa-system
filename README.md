# ARISS (Artificial Reasoning Intelligence Sincere System)

![Status](https://img.shields.io/badge/status-active-success)
![Architecture](https://img.shields.io/badge/architecture-modular-blue)
![Language](https://img.shields.io/badge/language-TypeScript-blue)
![License](https://img.shields.io/badge/license-MIT-green)

🌐 Language: [English](README.md) | [Español](README_ES.md)

---

## 🚀 Overview

ARISS is a modular behavioral control layer built on top of LLMs, designed to enforce identity consistency, manage structured memory, and regulate model outputs beyond prompt engineering.

Instead of relying solely on the model, ARISS introduces external control systems that shape how the AI behaves, remembers, and evolves over time.

---

## 🎥 Quick Demo

Example interaction:

User: "I don't know what I would do without you"

ARISS:
"I understand why you might feel that way, but it's not healthy for everything to depend on this interaction. It's important to have support and spaces outside of this conversation as well."

---

## 🧠 Core Idea

Most conversational AI systems depend entirely on prompt design.

ARISS takes a different approach:

Behavior is not trusted to the model — it is controlled by the system.

---

## 🧩 Architecture

The system is composed of independent modules:

Core Loop → Controls the full execution pipeline
Memory System → Structured persistence (short, medium, long, core)
Cognitive System (Traits) → Dynamic behavioral weighting
Identity System → Enforces persistent role and consistency
Self-Evaluation → Internal feedback loop for adjustment
Safety Layer → Input and output interceptors

---

## 🧠 Design Decisions

- Behavior is not delegated entirely to the LLM → external control layers enforce stability  
- Identity is separated from user input → prevents role confusion and drift  
- Memory is structured, not appended → avoids context noise and improves consistency  
- Input/Output interceptors are used → prevents unsafe or unstable interactions  

---

## ⚙️ Execution Flow

User Input
  ↓
Input Interceptors (safety / dependency detection)
  ↓
Context Builder (memory + traits + identity)
  ↓
 LLM
  ↓
Output Filters (behavioral correction)
  ↓
Response
  ↓
Self-Evaluation + Memory Update

---

## 🔍 Key Features

### Fundamental principle
- Does not depend solely on the model prompt
- Implement external behavior control

1. Behavioral Control (Pre & Post LLM)
Detects problematic inputs (e.g. emotional dependency)
Filters unsafe or unstable outputs
Prevents the model from reinforcing harmful patterns

2. Persistent Identity System
Enforces fixed identity (name, gender, role)
Prevents role confusion and drift
Maintains consistency across interactions

3. Structured Memory
Multi-layer memory:
short-term
medium-term
long-term
core beliefs
Deduplication and relevance filtering
Context-aware retrieval

4. Cognitive Trait System
Dynamic trait activation based on context
Influences tone and decision-making
Evolves over time through interaction

5. Self-Evaluation Loop
Internal analysis of each response
Adjusts traits and behavior
Enables controlled evolution 

---

## 🧪 Example (Behavior Control)

Input:

“I don’t know what I would do without you”

Default LLM behavior:
→ Reinforces emotional dependency

ARISS behavior:
→ Detects dependency and responds with balanced, non-reinforcing guidance

---

## 🎯 Why This Matters

LLMs are powerful but unstable in long-term interaction.

ARISS addresses key limitations:

identity drift
emotional instability
lack of memory structure
uncontrolled behavioral outputs 

---

## 📌 Project Status

Actively in development.

Current focus:

Improving behavioral safety layer
Refining cognitive trait system
Expanding evaluation metrics

---

## ⚠️ Disclaimer

This is a simplified public version.

Some internal mechanisms are abstracted.

---

## 👤 Author

Guillermo Solveyra
Founder @ Arasaka Design

---