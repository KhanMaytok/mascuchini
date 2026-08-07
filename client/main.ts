import {
  ArcRotateCamera,
  Camera,
  Color3,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PointerEventTypes,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import { Callbacks, Client, type Room } from "@colyseus/sdk";

type RemotePlayer = {
  name: string;
  characterClass: string;
  color: string;
  x: number;
  z: number;
};

type PlayerVisual = { mesh: Mesh; target: Vector3; player: RemotePlayer };

const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
const form = document.querySelector<HTMLFormElement>("#character-form")!;
const creator = document.querySelector<HTMLElement>("#creator")!;
const hud = document.querySelector<HTMLElement>("#hud")!;
const playerList = document.querySelector<HTMLUListElement>("#players")!;
const errorBox = document.querySelector<HTMLElement>("#error")!;
const engine = new Engine(canvas, true);
const scene = createScene();
const visuals = new Map<string, PlayerVisual>();
let room: Room | undefined;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorBox.textContent = "";
  const button = form.querySelector<HTMLButtonElement>("button")!;
  button.disabled = true;

  try {
    const values = Object.fromEntries(new FormData(form));
    const response = await fetch("/api/characters", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const character = await response.json();
    if (!response.ok) throw new Error(character.error ?? "No se pudo crear el personaje.");

    room = await new Client(window.location.origin).joinOrCreate("world", { token: character.token });
    connectRoom(room);
    creator.hidden = true;
    hud.hidden = false;
  } catch (error) {
    errorBox.textContent = error instanceof Error ? error.message : "No se pudo conectar.";
  } finally {
    button.disabled = false;
  }
});

function createScene(): Scene {
  const result = new Scene(engine);
  result.clearColor.set(0.045, 0.065, 0.04, 1);

  const camera = new ArcRotateCamera("camera", -Math.PI / 4, Math.PI / 3.2, 32, Vector3.Zero(), result);
  camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
  camera.inputs.clear();
  resizeCamera(camera);

  const light = new HemisphericLight("sun", new Vector3(-1, 2, -1), result);
  light.intensity = 0.95;

  const ground = MeshBuilder.CreateGround("Lorencia", { width: 30, height: 30 }, result);
  ground.metadata = { walkable: true };
  const groundMaterial = new StandardMaterial("grass", result);
  groundMaterial.diffuseColor = Color3.FromHexString("#536141");
  groundMaterial.specularColor = Color3.Black();
  ground.material = groundMaterial;

  const plaza = MeshBuilder.CreateGround("plaza", { width: 11, height: 11 }, result);
  plaza.position.y = 0.015;
  plaza.metadata = { walkable: true };
  const plazaMaterial = new StandardMaterial("stone", result);
  plazaMaterial.diffuseColor = Color3.FromHexString("#8c8068");
  plazaMaterial.specularColor = Color3.Black();
  plaza.material = plazaMaterial;

  const gridMaterial = new StandardMaterial("grid", result);
  gridMaterial.emissiveColor = Color3.FromHexString("#2e3828");
  for (let i = -14; i <= 14; i += 2) {
    MeshBuilder.CreateLines(`grid-x-${i}`, { points: [new Vector3(i, .025, -15), new Vector3(i, .025, 15)] }, result).color = gridMaterial.emissiveColor;
    MeshBuilder.CreateLines(`grid-z-${i}`, { points: [new Vector3(-15, .025, i), new Vector3(15, .025, i)] }, result).color = gridMaterial.emissiveColor;
  }

  const wallMaterial = new StandardMaterial("walls", result);
  wallMaterial.diffuseColor = Color3.FromHexString("#574d3d");
  for (const [x, z] of [[-9, -8], [9, -8], [-9, 8], [9, 8]] as const) {
    const pillar = MeshBuilder.CreateBox(`pillar-${x}-${z}`, { width: 1.6, depth: 1.6, height: 3 }, result);
    pillar.position.set(x, 1.5, z);
    pillar.material = wallMaterial;
  }

  result.onPointerObservable.add((event) => {
    if (event.type !== PointerEventTypes.POINTERPICK || !room) return;
    const pick = event.pickInfo;
    if (pick?.pickedPoint && pick.pickedMesh?.metadata?.walkable) {
      room.send("move", { x: pick.pickedPoint.x, z: pick.pickedPoint.z });
    }
  });

  return result;
}

function connectRoom(activeRoom: Room): void {
  const callbacks = Callbacks.get(activeRoom);

  callbacks.onAdd("players", (player: RemotePlayer, sessionId: string) => {
    const mesh = MeshBuilder.CreateSphere(`player-${sessionId}`, { diameter: 1.25, segments: 16 }, scene);
    const material = new StandardMaterial(`player-material-${sessionId}`, scene);
    material.diffuseColor = Color3.FromHexString(player.color);
    material.emissiveColor = material.diffuseColor.scale(0.22);
    mesh.material = material;
    mesh.position.set(player.x, 0.7, player.z);
    visuals.set(sessionId, { mesh, target: mesh.position.clone(), player });

    callbacks.listen(player, "x", (x: number) => { visuals.get(sessionId)!.target.x = x; });
    callbacks.listen(player, "z", (z: number) => { visuals.get(sessionId)!.target.z = z; });
    renderPlayerList(activeRoom.sessionId);
  });

  callbacks.onRemove("players", (_player: RemotePlayer, sessionId: string) => {
    visuals.get(sessionId)?.mesh.dispose();
    visuals.delete(sessionId);
    renderPlayerList(activeRoom.sessionId);
  });
}

function renderPlayerList(mySessionId: string): void {
  playerList.replaceChildren(...[...visuals].map(([sessionId, visual]) => {
    const item = document.createElement("li");
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.color = visual.player.color;
    dot.style.background = visual.player.color;
    item.append(dot, `${visual.player.name} · ${visual.player.characterClass}${sessionId === mySessionId ? " (tú)" : ""}`);
    return item;
  }));
}

function resizeCamera(camera: ArcRotateCamera): void {
  const size = 18;
  const aspect = engine.getRenderWidth() / engine.getRenderHeight();
  camera.orthoTop = size;
  camera.orthoBottom = -size;
  camera.orthoLeft = -size * aspect;
  camera.orthoRight = size * aspect;
}

engine.runRenderLoop(() => {
  for (const visual of visuals.values()) {
    visual.mesh.position = Vector3.Lerp(visual.mesh.position, visual.target, 0.22);
  }
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
  resizeCamera(scene.activeCamera as ArcRotateCamera);
});

