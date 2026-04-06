import { Ollama } from "ollama";
const ollama = new Ollama();

const res = await ollama.chat({
  model: "gemma3:4b",
  messages: [{ role: "user", content: "Decime hola como una asistente humana breve." }]
});

console.log(res.message.content);
