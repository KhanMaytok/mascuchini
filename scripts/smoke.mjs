import assert from "node:assert/strict";
import { Client } from "@colyseus/sdk";

const baseUrl = process.env.GAME_URL ?? "http://localhost:2567";
const suffix = Date.now().toString().slice(-8);
const rooms = [];

async function createCharacter(name, characterClass) {
  const response = await fetch(`${baseUrl}/api/characters`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, characterClass }),
  });
  assert.equal(response.status, 201);
  return response.json();
}

async function waitFor(check, message, timeout = 4000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.fail(message);
}

try {
  const knight = await createCharacter(`Knight${suffix}`, "Dark Knight");
  const elf = await createCharacter(`Elf${suffix}`, "Fairy Elf");
  const client = new Client(baseUrl);
  const knightRoom = await client.joinOrCreate("world", { token: knight.token });
  rooms.push(knightRoom);
  const elfRoom = await client.joinOrCreate("world", { token: elf.token });
  rooms.push(elfRoom);

  await waitFor(() => knightRoom.state.players.size === 2, "Los dos jugadores no aparecieron en la sala.");
  knightRoom.send("move", { x: 10, z: 6 });
  await waitFor(
    () => elfRoom.state.players.get(knightRoom.sessionId)?.x > 5,
    "El segundo cliente no recibió el movimiento del primero.",
  );

  console.log("Smoke OK: dos personajes conectados y movimiento sincronizado.");
} finally {
  await Promise.all(rooms.map((room) => room.leave()));
}
