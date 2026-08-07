import { randomUUID } from "node:crypto";

export const CHARACTER_CLASSES = ["Dark Knight", "Dark Wizard", "Fairy Elf"] as const;
export type CharacterClass = (typeof CHARACTER_CLASSES)[number];

export type Character = {
  token: string;
  name: string;
  characterClass: CharacterClass;
};

const characters = new Map<string, Character>();
const names = new Set<string>();

export function createCharacter(nameInput: unknown, classInput: unknown): Character {
  const name = typeof nameInput === "string" ? nameInput.trim() : "";

  if (!/^[\p{L}\p{N}_ -]{3,16}$/u.test(name)) {
    throw new Error("El nombre debe tener entre 3 y 16 letras, números, espacios, _ o -.");
  }
  if (!CHARACTER_CLASSES.includes(classInput as CharacterClass)) {
    throw new Error("Clase inválida.");
  }

  const normalizedName = name.toLocaleLowerCase("es");
  if (names.has(normalizedName)) {
    throw new Error("Ese nombre ya está en uso.");
  }

  const character = { token: randomUUID(), name, characterClass: classInput as CharacterClass };
  names.add(normalizedName);
  characters.set(character.token, character);
  return character;
}

export function findCharacter(token: unknown): Character | undefined {
  return typeof token === "string" ? characters.get(token) : undefined;
}

export function resetCharacters(): void {
  characters.clear();
  names.clear();
}

