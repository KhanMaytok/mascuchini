# Arquitectura mínima del vertical slice

Investigación para [Fijar la arquitectura mínima del vertical slice](https://github.com/KhanMaytok/mascuchini/issues/3), verificada el 7 de agosto de 2026.

## Decisión propuesta

Usar un único artefacto desplegable de juego: un proceso Node.js sirve el cliente estático, expone las rutas HTTP mínimas y mantiene una sala Colyseus autoritativa por WebSocket. PostgreSQL es el único servicio externo y la única fuente persistente de verdad.

```text
Navegador
  ├─ HTTPS: HTML, JS, GLB y texturas
  ├─ HTTP: autenticación y persistencia mínima
  └─ WSS: intenciones y estado sincronizado
             │
      un proceso Node.js
      ├─ estáticos compilados por Vite
      ├─ una Room Colyseus, máximo 10 clientes
      ├─ simulación y estado vivo en memoria
      └─ un pool pg
             │
        PostgreSQL
```

No añadir Redis, segundo proceso, microservicios, CDN, ORM, framework de UI, ECS, motor de física, bus de eventos ni transporte experimental.

## Versiones verificadas

Fijar versiones exactas y confirmar el árbol completo con `package-lock.json`.

| Componente | Versión |
|---|---:|
| Node.js LTS | `24.18.0` |
| PostgreSQL | `18.4` |
| TypeScript | `7.0.2` |
| Vite | `8.2.1` |
| `@babylonjs/core` | `9.20.0` |
| `@babylonjs/loaders` | `9.20.0` |
| `colyseus` | `0.17.10` |
| `@colyseus/sdk` | `0.17.43` |
| `@colyseus/schema` | `4.0.30` |
| `pg` | `8.22.0` |
| `@colyseus/testing` | `0.17.11` |

`colyseus@0.18.1` está en el canal `next`, no en `latest`; no adoptarlo. Node 24 es LTS y PostgreSQL 18 es la versión estable vigente. Las versiones npm se verificaron con `npm view <paquete> version dist-tags engines`.

## Estructura mínima

Usar npm workspaces, ESM y TypeScript estricto:

```text
apps/client       Babylon.js, Vite, canvas y DOM/CSS
apps/server       Colyseus, HTTP, sala, persistencia y estáticos
packages/protocol versión, mensajes y Schema realmente compartidos
```

`packages/protocol` no debe contener entidades de dominio, acceso a datos ni utilidades generales. El cliente importa módulos ES de Babylon y `@babylonjs/loaders` para GLB/glTF. Vite conserva su objetivo moderno predeterminado y se comprueba WebGL 2 al iniciar; no usar `plugin-legacy`.

## Responsabilidades

- El cliente envía intenciones: destino, objetivo, recoger o equipar. Nunca afirma posición, daño, experiencia o inventario.
- La sala valida sesión, versión de protocolo, forma, rango, frecuencia y estado permitido de cada mensaje.
- Posiciones, vida, monstruo, loot y presencia viven en el `Schema`; efectos puntuales usan mensajes.
- La simulación usa `setSimulationInterval`. Frecuencia e interpolación se decidirán con movimiento y combate.
- Una sala tiene `maxClients = 10`; `LocalPresence`, driver local y el transporte WebSocket predeterminado bastan.
- PostgreSQL guarda cuentas, personajes, progreso e inventario, pero nunca se consulta por tick.
- Operaciones de loot, equipo y progreso usan transacciones y restricciones SQL. Cada transacción conserva el mismo cliente del pool desde `BEGIN` hasta `COMMIT` o `ROLLBACK`.
- Cliente y servidor comparten origen. TLS e ingress pertenecen a la decisión de despliegue.
- El servidor rechaza `protocolVersion` incompatible; `index.html` usa `Cache-Control: no-cache`.

## Alternativas descartadas

- **Hosting estático separado:** añade despliegue, origen y riesgo de desalinear versiones; reconsiderar solo con mediciones.
- **WebSocket propio:** obliga a construir salas, sincronización delta, heartbeat y reconexión.
- **uWebSockets.js o WebTransport:** capacidad innecesaria para diez clientes; WebTransport sigue experimental.
- **Redis o varios procesos:** no existe necesidad actual y complican coordinación y afinidad.
- **ORM:** para pocas tablas, `pg`, SQL versionado y constraints hacen visibles las transacciones críticas.
- **React o Vue:** el slice necesita canvas y una interfaz DOM pequeña.
- **Estado vivo en PostgreSQL:** introduce I/O y jitter en el bucle; la base persiste hitos, no frames.

## Riesgos y controles

- La caída del proceso pierde el estado vivo: persistir operaciones irreversibles y probar reinicio. La reconexión no revive una sala perdida.
- Mantener servidor y SDK Colyseus en la línea estable `0.17` y probar conexión/sincronización antes de actualizar.
- Fijar Babylon/Vite y cargar un GLB representativo al actualizar.
- No esperar SQL ni conversión de datos dentro del tick.
- Rechazar temprano clientes antiguos mediante versión de protocolo.
- Servir assets desde Node es aceptable para diez testers; CDN solo después de medir.
- Antes de aceptar TypeScript 7, compilar un `Schema` mínimo con la configuración oficial de decoradores de Colyseus.

## Verificación previa al contenido

1. Compilar cliente y servidor con Node 24.
2. Conectar diez clientes simulados a una sala.
3. Comprobar sincronización, desconexión, reconexión y rechazo de mensajes inválidos o incompatibles.
4. Cargar un GLB con esqueleto y animación en WebGL 2.
5. Probar commit, rollback y restricción única de una operación de inventario.
6. Reiniciar el proceso y recuperar lo persistido desde PostgreSQL.

## Fuentes oficiales

- [Node.js 24.18.0 LTS](https://nodejs.org/en/blog/release/v24.18.0)
- [Requisitos y navegadores de Vite](https://vite.dev/guide/)
- [Build de producción de Vite](https://vite.dev/guide/build)
- [Conceptos autoritativos de Colyseus](https://docs.colyseus.io/concepts)
- [Sincronización de estado](https://docs.colyseus.io/state)
- [Servidor, driver y presence](https://docs.colyseus.io/server)
- [Transporte WebSocket](https://docs.colyseus.io/server/transport/ws)
- [Migración a Colyseus 0.17](https://docs.colyseus.io/migrating/0.17)
- [Reconexión de Colyseus](https://docs.colyseus.io/room/reconnection)
- [Pruebas de Colyseus](https://docs.colyseus.io/tools/testing)
- [PostgreSQL 18.4](https://www.postgresql.org/docs/release/18.4/)
- [Versionado y soporte de PostgreSQL](https://www.postgresql.org/support/versioning/)
- [Pooling de node-postgres](https://node-postgres.com/features/pooling)
- [Transacciones de node-postgres](https://node-postgres.com/features/transactions)
