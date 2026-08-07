import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import express from "express";
import { CHARACTER_CLASSES, createCharacter } from "./characters.js";
import { GameRoom } from "./game-room.js";

const port = Number(process.env.PORT ?? 2567);
const clientDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../client");
const app = express();

app.use(express.json({ limit: "8kb" }));
app.get("/api/classes", (_request, response) => response.json(CHARACTER_CLASSES));
app.post("/api/characters", (request, response) => {
  try {
    response.status(201).json(createCharacter(request.body?.name, request.body?.characterClass));
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : "Solicitud inválida." });
  }
});
app.use(express.static(clientDirectory));

const httpServer = createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});
gameServer.define("world", GameRoom);

await gameServer.listen(port);
console.log(`Mascuchini disponible en http://localhost:${port}`);
