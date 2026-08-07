# Mascuchini — prototipo multijugador

Prototipo web para crear un personaje y mover hasta diez jugadores sobre un mapa isométrico compartido. Los personajes son esferas: Dark Knight rojo, Dark Wizard azul y Fairy Elf verde.

## Ejecutar con Docker

```bash
docker compose up --build
```

Abre <http://localhost:2567> en dos navegadores o en una ventana normal y otra de incógnito. Crea un personaje distinto en cada una y haz clic sobre el mapa para moverlo.

Para detenerlo:

```bash
docker compose down
```

## Ejecutar con Node.js 24

```bash
npm ci
npm test
npm run build
npm start
```

## Límites intencionales

- Los personajes se guardan en memoria y desaparecen al reiniciar el servidor.
- No hay cuentas, contraseña, combate, navegación alrededor de obstáculos ni assets originales.
- Una sala y un proceso son suficientes para este experimento de 2–10 jugadores.

