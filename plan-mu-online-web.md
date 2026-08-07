# Mascuchini: plan para un MMORPG web inspirado en MU Online

> Estado: mapa de decisiones abierto, 7 de agosto de 2026.
> Fuente canónica: [Definir el vertical slice multijugador de Mascuchini](https://github.com/KhanMaytok/mascuchini/issues/1).

## Destino

Producir una especificación lista para implementar de un juego nuevo inspirado en MU Online. El primer vertical slice será una prueba privada para 2–10 testers y tendrá:

- cuentas precreadas por invitación;
- un personaje y un mapa;
- movimiento por clic;
- presencia de otros jugadores en tiempo real;
- un monstruo, ataque básico, daño, muerte y respawn;
- experiencia y subida de nivel;
- un objeto que se pueda recoger y equipar;
- persistencia mínima del personaje.

No se busca replicar todo MU Online ni ser compatible con sus clientes, servidores o protocolo.

## Restricciones decididas

- Solo navegadores modernos de escritorio, de forma permanente.
- Teclado, ratón y WebGL 2; no habrá móvil ni controles táctiles.
- La prueba será privada y no tendrá registro público.
- Los assets originales están disponibles, pero deben pasar por un pipeline de conversión reproducible.
- El servidor decidirá el estado válido del juego; el cliente representará y suavizará ese estado.
- Un solo desarrollador trabajará a tiempo parcial. El alcance manda sobre las fechas.

## Fuera del vertical slice

- PvP, chat, NPC, comercio, guilds y economía completa.
- Más mapas, clases, monstruos, objetos o habilidades.
- Recuperación de contraseña, OAuth y autoservicio de cuentas.
- Redis, escalado horizontal, Kubernetes y microservicios.
- Compatibilidad con navegadores antiguos.
- Lanzamiento o registro público.

## Arquitectura mínima decidida

La decisión registrada en [Fijar la arquitectura mínima del vertical slice](https://github.com/KhanMaytok/mascuchini/issues/3) es:

- cliente TypeScript con Babylon.js y Vite;
- un único proceso Node.js que sirve el cliente, el HTTP mínimo y una sala Colyseus;
- PostgreSQL para cuentas, personajes e inventario;
- estado de la partida en memoria dentro de una sala autoritativa;
- npm workspaces con `apps/client`, `apps/server` y un `packages/protocol` mínimo;
- despliegue aislado de la infraestructura SaaS existente.

Colyseus encaja porque el servidor es la única parte que muta el estado sincronizado y los clientes envían solicitudes de acción. Su presencia local basta para un único proceso; Redis se necesita al distribuir salas entre procesos o máquinas, algo fuera de este destino. Véanse [State Synchronization](https://docs.colyseus.io/state), [Core Concepts](https://docs.colyseus.io/concepts) y [Presence](https://docs.colyseus.io/server/presence).

Vite se usará con su objetivo moderno predeterminado; no se añadirá soporte heredado. La matriz exacta de navegadores se fijará antes del playtest según su [documentación de producción](https://vite.dev/guide/build).

La línea base verificada es Node.js `24.18.0` LTS, PostgreSQL `18.4`, TypeScript `7.0.2`, Vite `8.2.1`, Babylon.js `9.20.0` y Colyseus estable `0.17`. Las versiones de paquetes y sus controles están documentados en [Arquitectura mínima del vertical slice](https://github.com/KhanMaytok/mascuchini/blob/research/architecture-minima/research/architecture-minima.md). La implementación deberá fijarlas con `package-lock.json` y comprobar primero un `Schema` mínimo con TypeScript 7.

## Mapa de decisiones

La planificación vive en GitHub. Cada ticket responde una pregunta; todavía no representa una tarea de implementación.

### Frontera inicial

Al crear el mapa, estas decisiones quedaron sin bloqueos. Consulta GitHub antes de reclamarlas porque la frontera cambia al cerrar o asignar tickets:

- [Fijar la arquitectura mínima del vertical slice](https://github.com/KhanMaytok/mascuchini/issues/3)
- [Confirmar el alcance legal de los assets](https://github.com/KhanMaytok/mascuchini/issues/6)
- [Inventariar los assets disponibles](https://github.com/KhanMaytok/mascuchini/issues/10)

### Decisiones posteriores

GitHub muestra sus dependencias y las desbloqueará al cerrar lo anterior:

- [Definir el modelo autoritativo de movimiento y combate](https://github.com/KhanMaytok/mascuchini/issues/4)
- [Delimitar identidad y persistencia del prototipo](https://github.com/KhanMaytok/mascuchini/issues/5)
- [Elegir el pipeline de conversión de assets](https://github.com/KhanMaytok/mascuchini/issues/2), después de inventariar los archivos reales
- [Definir despliegue, recuperación y observabilidad](https://github.com/KhanMaytok/mascuchini/issues/7)
- [Fijar criterios de aceptación y presupuestos técnicos](https://github.com/KhanMaytok/mascuchini/issues/8)
- [Sintetizar la especificación lista para implementar](https://github.com/KhanMaytok/mascuchini/issues/9)

## Ruta probable después de las decisiones

Esta secuencia es orientativa. Solo se convertirá en entregas de implementación cuando se cierre el mapa:

1. Probar el pipeline con un mapa, personaje animado, monstruo y objeto.
2. Demostrar conexión remota y movimiento de 2–10 avatares en una sala.
3. Añadir el ciclo autoritativo de selección, ataque, daño, muerte, respawn y experiencia.
4. Añadir cuentas privadas, guardado de personaje y un objeto recogible/equipable.
5. Validar reconexión, concurrencia, rendimiento, backups y restauración.
6. Congelar una versión cliente-servidor y ejecutar el playtest privado.

Cada paso deberá terminar en una demostración ejecutable y en el chequeo mínimo que detecte una regresión. No se construirán sistemas “para después”.

## Riesgos que gobiernan el orden

1. **Conversión de assets:** formatos propietarios, esqueletos, animaciones, materiales, escala y coordenadas pueden exigir herramientas nuevas o trabajo manual.
2. **Permisos:** la autorización debe cubrir transformación, distribución a testers y alojamiento; los assets no entrarán al repositorio hasta confirmarlo.
3. **Sensación de movimiento:** click-to-move autoritativo necesita navegación, interpolación y tolerancia a latencia sin ceder autoridad al cliente.
4. **Rendimiento web:** los presupuestos de triángulos, texturas, memoria y draw calls dependen de medir assets convertidos reales.
5. **Persistencia:** inventario y progreso requieren transacciones y restricciones para impedir duplicación o pérdida.
6. **Tiempo parcial:** no se publicarán fechas antes de medir la velocidad con el primer vertical slice técnico.

## Criterio de salida de la planificación

El mapa termina cuando todos sus tickets están cerrados, no queda niebla relevante y [Sintetizar la especificación lista para implementar](https://github.com/KhanMaytok/mascuchini/issues/9) contiene una especificación aceptada. Solo entonces se crearán issues de implementación, pruebas y despliegue.
