import { schema } from "@colyseus/schema";

export const PlayerState = schema({
  name: "string",
  characterClass: "string",
  color: "string",
  x: "number",
  z: "number",
});

export const WorldState = schema({
  players: { map: PlayerState },
});
