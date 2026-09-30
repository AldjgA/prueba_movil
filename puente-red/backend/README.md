# Backend — Puente Red

**Una API, dos superficies** (`PR-003` §1). Dueños: **A** (`routes/joven`, `shared`, `main`) y
**C** (`routes/profesional`, `core`). Reparto ratificado en `REVISION-C.md` §5.3 y recogido en
`CONTRATO-DE-INTEGRACION.md` §1.1.

## Correr

```bash
cd puente-red/backend
npm install               # hono + @hono/node-server (2 paquetes)
cp .env.example .env      # rellenar en local; .env NO se commitea
npm start                 # http://localhost:8080
npm test                  # 12 pruebas de humo (node:test)
```

## Por qué Node + Hono

`PR-INFRA` §3 recomienda **Go** o **Node/Bun + Hono**. Se eligió **Node 22 + Hono**:

1. **Verificable.** El entorno donde se escribió tiene Node 22, pero **no** Go. Un esqueleto que
   no se puede compilar es una promesa, no un cimiento.
2. **Huella mínima.** Dos dependencias y un framework ligero: el servidor es de **256 MB** y la
   API solo orquesta (la BD, la auth y el LLM viven fuera).
3. **Tipos compartidos con el portal.** El portal es TypeScript; el mismo lenguaje permitirá
   compartir los tipos del contrato más adelante.

> Si el equipo prefiere Go, la **estructura** (`routes/joven`, `routes/profesional`, `core`,
> `shared`) y el **contrato** no cambian: solo el lenguaje.

## Mapa

| Ruta | Dueño | Contenido |
|---|---|---|
| `src/main.js` | **A** | Punto de entrada |
| `src/app.js` | **A** | Monta las dos superficies |
| `src/shared/**` | **A** | Contrato, config, HTTP, middleware, almacén |
| `src/routes/joven.js` | **A** | `PR-004`: registro, ingesta, estado |
| `src/routes/profesional.js` | **C** | Punto de enganche de `PR-010`…`PR-017` |
| `src/core/**` | **C** | Pipeline de triaje (`PR-005`…`PR-009`) |

## Endpoints del esqueleto

| Método | Ruta | Qué |
|---|---|---|
| `GET` | `/health` | Vida y versión del contrato |
| `POST` | `/joven/registro` | Vincula `ProfileId` ↔ sesión. **El `ProfileId` no vuelve a salir.** |
| `POST` | `/joven/casos` | Ingesta del reporte (Contrato A). Exige sesión e `Idempotency-Key`. |
| `GET` | `/joven/casos/:token` | Estado del caso (Contrato B). Solo el caso de esa sesión. |
| `GET` | `/profesional` | Marcador: la superficie está montada y separada. |

## Estado y deudas

- Esqueleto **funcional**: las tres rutas de `PR-004` responden y están cubiertas por pruebas.
- ⚠️ **El almacén es en memoria** — `TODO(TASK-013)`: sustituir por **Supabase** (Postgres + RLS).
  Las tablas previstas están en `PR-004` §4.
- ⚠️ **Sin autenticación real** todavía: la sesión es un token en memoria. La política de
  caducidad y el `deviceKey` del Keystore son de `TASK-013`.
- ⚠️ **`CLASSIFIER_MODE=off`** por defecto: todo entra como `ALTO`. Es lo correcto para la demo
  sin datos (`PR-003` Q7).
