# AGENTS.md

## Propósito del repositorio

Mascuchini es un juego web nuevo inspirado en MU Online. No es un port binario ni un cliente compatible con servidores o protocolos existentes.

Antes de trabajar, lee:

1. `plan-mu-online-web.md` para alcance, restricciones y riesgos.
2. [Definir el vertical slice multijugador de Mascuchini](https://github.com/KhanMaytok/mascuchini/issues/1) para el estado canónico de decisiones.
3. El ticket concreto que se te haya asignado.

Si el plan local contradice al mapa, manda el mapa. Corrige el documento local en el mismo cambio cuando corresponda.

## Alcance fijo del primer vertical slice

- Prueba privada para 2–10 testers con cuentas precreadas.
- Solo escritorio moderno con teclado, ratón y WebGL 2.
- Un mapa, un personaje, movimiento por clic y presencia multijugador.
- Un monstruo, ataque básico, daño, muerte, respawn y experiencia.
- Un objeto recogible y equipable, con persistencia mínima.
- Simulación autoritativa en el servidor.

Fuera de alcance: móvil, táctil, navegadores antiguos, registro público, PvP, chat, NPC, comercio, guilds, economía completa, contenido adicional, Redis, escalado horizontal, Kubernetes y microservicios.

## Proceso de planificación

Usa la skill `wayfinder` para el mapa y `ponytail` para evitar trabajo especulativo.

- El mapa es un índice. La respuesta detallada vive una sola vez, en el comentario de resolución del ticket correspondiente.
- Refiérete a issues por su título enlazado, nunca solo por su número.
- Antes de investigar un ticket, comprueba que sea hijo del mapa, esté abierto, sin bloqueos y sin responsable.
- Reclámalo asignándolo al desarrollador antes de trabajar.
- Resuelve como máximo un ticket por sesión, salvo investigaciones independientes permitidas por Wayfinder.
- Publica la decisión como comentario de resolución, cierra el ticket y añade al mapa una línea enlazada en `Decisions so far`.
- Crea nuevos tickets solo cuando una pregunta ya pueda formularse con precisión. Lo aún impreciso permanece en `Not yet specified`.
- Usa relaciones nativas de sub-issues y dependencias de GitHub.
- No conviertas el mapa en un backlog de implementación. La ejecución comienza después de cerrar la especificación final.

Comandos útiles:

```powershell
gh issue view 1 -R KhanMaytok/mascuchini
gh issue list -R KhanMaytok/mascuchini --state open
gh issue edit <issue> -R KhanMaytok/mascuchini --add-assignee "@me"
```

La versión instalada de `gh` puede no exponer todavía las banderas nuevas para sub-issues o dependencias. En ese caso usa `gh api` contra los endpoints REST oficiales; no simules relaciones con listas Markdown.

## Exploración del código con CodeGraph

Cuando exista código y `.codegraph/` esté inicializado, usa primero el servidor MCP de CodeGraph para preguntas estructurales:

- `codegraph_context` y luego una sola llamada a `codegraph_explore` para entender un área.
- `codegraph_search` para localizar definiciones por símbolo.
- `codegraph_trace` para seguir un flujo de origen a destino.
- `codegraph_callers` y `codegraph_callees` para relaciones directas.
- `codegraph_impact` antes de cambiar contratos compartidos.
- `codegraph_files` para explorar el árbol y `codegraph_status` para comprobar el índice.

Confía en el AST de CodeGraph y no repitas la misma búsqueda con `grep`. Usa `rg` para texto literal, comentarios, mensajes y contenido que no sea una relación entre símbolos. El watcher puede tardar unos 500 ms tras una edición. Si `.codegraph/` no existe, pregunta al usuario antes de ejecutar `codegraph init -i`.

## Principios técnicos

- Servidor autoritativo: el cliente solicita acciones; nunca decide posición válida, daño, loot, experiencia ni inventario.
- Estado continuo y visible en el estado sincronizado; eventos puntuales en mensajes.
- PostgreSQL es la fuente de verdad persistente. Usa transacciones y restricciones para invariantes de progreso e inventario.
- El estado vivo de una única sala permanece en memoria. No añadas Redis hasta necesitar más de un proceso de juego medido.
- La línea base decidida es Node.js 24 LTS, PostgreSQL 18, Babylon.js 9, Vite 8 y Colyseus estable 0.17; fija versiones exactas con `package-lock.json`.
- TypeScript con modo estricto en cliente, servidor y contratos compartidos.
- Reutiliza primero plataforma, librerías ya instaladas y código existente. No crees abstracciones para una sola implementación.
- No añadas física general, ECS, bus de eventos, microservicios ni sistemas de plugins sin un requisito actual y medido.
- Mantén compatible el protocolo entre el cliente desplegado y el servidor; rechaza versiones incompatibles de forma explícita.

## Assets

- Trata todos los assets originales como material restringido aunque el repositorio sea público.
- No copies, conviertas, publiques ni confirmes assets hasta cerrar [Confirmar el alcance legal de los assets](https://github.com/KhanMaytok/mascuchini/issues/6).
- Mantén originales fuera de Git por defecto. Documenta su ubicación esperada mediante variables o rutas de entrada ignoradas.
- El pipeline debe ser reproducible: entrada identificable, comando documentado, salida determinista cuando sea posible y validación automática.
- Prefiere glTF/GLB para modelos y formatos web medidos para texturas. Conserva escala, ejes, esqueletos, animaciones, materiales y puntos de anclaje.
- No retoques manualmente una salida sin capturar el paso en el pipeline o documentar claramente la excepción.

## Seguridad y datos

- Nunca confirmes credenciales, tokens, cookies, archivos `.env`, dumps o datos personales de testers.
- Valida todos los mensajes de red en el servidor: esquema, tipo, rango, frecuencia, sesión y estado permitido.
- Usa contraseñas con hash resistente y sesiones revocables; las cuentas privadas no justifican texto plano.
- Aplica rate limiting en autenticación y acciones de juego sensibles.
- Prueba restauraciones, no solo la creación de backups.
- Los logs deben ayudar a reconstruir errores sin incluir secretos ni contraseñas.

## Calidad y verificación

- Todo cambio de lógica no trivial deja el chequeo ejecutable más pequeño que falle ante una regresión.
- Prioriza pruebas deterministas del servidor para movimiento, combate, progreso e inventario.
- No hagas depender las reglas del juego del frame rate del cliente.
- Para networking, prueba al menos conexión, desconexión, reconexión y mensajes inválidos.
- Para persistencia, prueba transacciones fallidas y reintentos además del camino feliz.
- Mide con assets y conexiones representativas antes de optimizar.
- No declares terminado un cambio sin ejecutar los chequeos relevantes y registrar el resultado.

## Git y revisiones

- Conserva cambios ajenos y evita reescribir trabajo no relacionado.
- Commits pequeños, con una intención comprobable y sin assets restringidos.
- En cada PR o entrega incluye: ticket, decisión o comportamiento implementado, validación ejecutada, riesgos conocidos y cualquier migración o rollback.
- Los cambios de esquema incluyen migración hacia adelante y una estrategia explícita de recuperación.
- No mezcles decisiones abiertas de Wayfinder con implementación basada en suposiciones.

## Definición de terminado

Una decisión de planificación está terminada cuando tiene evidencia, alternativas y tradeoffs suficientes; está publicada como comentario, el ticket está cerrado y el mapa enlaza su conclusión.

Una entrega futura estará terminada cuando cumple sus criterios observables, conserva la autoridad del servidor, pasa sus chequeos, documenta operación y rollback, y no amplía el alcance acordado.
