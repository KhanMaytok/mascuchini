import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createCharacter, findCharacter, resetCharacters } from "./characters.js";

afterEach(resetCharacters);

test("crea un personaje válido y evita nombres duplicados", () => {
  const character = createCharacter("KhalO", "Dark Knight");

  assert.equal(findCharacter(character.token), character);
  assert.throws(() => createCharacter("khalo", "Fairy Elf"), /nombre ya está en uso/i);
  assert.throws(() => createCharacter("x", "Dark Wizard"), /entre 3 y 16/i);
  assert.throws(() => createCharacter("Valido", "Summoner"), /clase inválida/i);
});

