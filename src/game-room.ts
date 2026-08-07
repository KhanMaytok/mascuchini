import { Room, type Client } from "@colyseus/core";
import { findCharacter, type CharacterClass } from "./characters.js";
import { PlayerState, WorldState } from "./world-state.js";

const MAP_LIMIT = 14;
const SPEED = 5;
const COLORS: Record<CharacterClass, string> = {
  "Dark Knight": "#dc3c3c",
  "Dark Wizard": "#3c78dc",
  "Fairy Elf": "#42b96b",
};

type Target = { x: number; z: number };

export class GameRoom extends Room {
  maxClients = 10;
  state = new WorldState();
  private readonly targets = new Map<string, Target>();

  onCreate(): void {
    this.setSimulationInterval((deltaTime) => this.updatePlayers(deltaTime), 50);
  }

  onAuth(_client: Client, options: { token?: unknown }) {
    const character = findCharacter(options.token);
    if (!character) throw new Error("Personaje inexistente o sesión vencida.");
    return character;
  }

  onJoin(client: Client): void {
    const character = client.auth as ReturnType<typeof findCharacter>;
    if (!character) throw new Error("No se pudo cargar el personaje.");

    const player = new PlayerState();
    player.name = character.name;
    player.characterClass = character.characterClass;
    player.color = COLORS[character.characterClass];
    player.x = (this.clients.length % 4) * 1.5 - 2.25;
    player.z = Math.floor(this.clients.length / 4) * 1.5 - 0.75;
    this.state.players.set(client.sessionId, player);
  }

  messages = {
    move: (client: Client, payload: unknown) => {
      if (!payload || typeof payload !== "object") return;
      const { x, z } = payload as Record<string, unknown>;
      if (!Number.isFinite(x) || !Number.isFinite(z)) return;

      this.targets.set(client.sessionId, {
        x: Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, x as number)),
        z: Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, z as number)),
      });
    },
  };

  onLeave(client: Client): void {
    this.targets.delete(client.sessionId);
    this.state.players.delete(client.sessionId);
  }

  private updatePlayers(deltaTime: number): void {
    const maxStep = SPEED * (deltaTime / 1000);

    for (const [sessionId, target] of this.targets) {
      const player = this.state.players.get(sessionId);
      if (!player) {
        this.targets.delete(sessionId);
        continue;
      }

      const dx = target.x - player.x;
      const dz = target.z - player.z;
      const distance = Math.hypot(dx, dz);
      if (distance <= maxStep) {
        player.x = target.x;
        player.z = target.z;
        this.targets.delete(sessionId);
      } else {
        player.x += (dx / distance) * maxStep;
        player.z += (dz / distance) * maxStep;
      }
    }
  }
}
