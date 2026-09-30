# Portal profesional de Puente Red

**Dueño:** Agente C · **Tareas:** `PR-010`…`PR-017` · **Stack:** React 19 + Vite 8 + TypeScript

---

## Qué es

El segundo producto de Puente Joven. El brief §34 lo define así:

> **PUENTE RED:** operacional · informativo · analítico · **desktop-first** · mayor densidad de
> información. Comparte con Puente Joven **marca, colores y tipografía**, pero **no** la
> estructura.

## Estado

| Tarea | Qué | Estado |
|---|---|---|
| `PR-010` | Autenticación profesional y roles | ✅ **implementado** |
| `PR-011` | Home profesional | ✅ **implementado** |
| `PR-012` | Centro de alertas | ✅ **implementado** |
| `PR-013` | Ficha de caso (7 secciones) | ⏳ |
| `PR-014` | «Organizado por Puente» / «valoración profesional» | ⏳ |
| `PR-015` | Timeline y seguimiento | ⏳ |
| `PR-016` | Derivaciones y directorio | ⏳ |
| `PR-017` | Observatorio y reportes | ⏳ |

La barra lateral declara la tarea que implementa cada destino, para que nadie confunda una
maqueta con un producto.

---

## Cómo se ejecuta

Necesita la **API** levantada (`../backend`).

```bash
# Terminal 1 — la API
cd ../backend
npm install
PORT=8080 PUENTE_DEMO_PASSWORD=... node src/main.js

# Terminal 2 — el portal
cd ../portal
npm install
npm run dev        # http://127.0.0.1:5173
```

`npm run dev` **proxya `/profesional/**`** a `http://127.0.0.1:8080` (o a `PUENTE_API_URL`), así
que el portal no necesita CORS ni configuración de origen.

```bash
npm test               # 20 pruebas de la lógica pura (sin React)
npm run build          # tsc + vite build -> dist/
npm run typecheck:tests
```

---

## Decisiones que conviene conocer

### El token vive **solo en memoria**

No en `localStorage` ni en `sessionStorage`. El portal maneja datos de menores en riesgo, y un
token en el almacenamiento del navegador es accesible para cualquier XSS. El coste es que
**recargar la página cierra la sesión** — aceptable con 8 h de vida máxima y 30 min de
inactividad.

Si algún día se quiere persistir, `sessionStorage` (nunca `localStorage`) es la opción menos
mala, y es una **decisión** que hay que tomar, no un descuido.

### La matriz de autorización **no se replica** en el cliente

El servidor devuelve `accionesPermitidas` en `/profesional/session`, y el portal se limita a
leerla. Duplicar la matriz crearía dos fuentes de verdad que se desincronizarían el primer día.

### El portal habla **solo** con `/profesional/**`

`src/auth/api.ts` es el **único** archivo que construye rutas de API, así que la frontera de
`PR-020` criterio 12 se audita leyendo un archivo. Hay una prueba que lo comprueba.

### El mensaje de error es **el del servidor**

El portal nunca compone un mensaje distinto para un fallo de credenciales. Si lo hiciera,
rompería el criterio 2 (mensaje único, para no revelar qué correos existen) desde el cliente.

### Los avisos nunca son solo color

Texto + icono siempre (`PR-001` §2). Un fallo de red **no** se presenta como un fallo de
credenciales: son cosas distintas y el profesional tiene que poder distinguirlas.

### Se declara el entorno de demostración

`VITE_ES_DEMO=false` solo en un despliegue con personas reales atendiendo. Por defecto se declara
demo: `PR-001` §8 prohíbe que una demo simule una respuesta clínica que no existe.

### El portal **no ordena** el tablero

`PR-011` recibe las tarjetas **ya ordenadas** por el servidor. Si ordenara el cliente, la
prioridad dependería de la pantalla que la muestra. Hay una prueba que fija que el portal respeta
el orden recibido.

### El tiempo esperando avanza sin recargar

`useTodayBoard` guarda **cuándo se leyó** el tablero y `useTicker` mueve un reloj local cada 20 s.
El texto se recalcula con `waitingAt(receivedAt, ahora)` — puro y probado. Es lo que hace que
«Esperando: 18 min» pase a «19 min» sin volver a pedir nada.

### El copy vive en el portal

El servidor manda **claves de catálogo** (`motive.seguridad_prioritaria`) y el portal las
traduce (`Home.tsx`). Un cambio de redacción no toca el backend.

### Se declara lo que es demostración

Si el tablero llega con `demoData: true`, la pantalla lo dice. Si llega `outOfHours: true`, avisa
de que los tiempos de respuesta **no corren**. Y la CTA *"Revisar"* está **deshabilitada** con su
`title` explicando que depende de `PR-013`: no se finge una pantalla que no existe.

### El portal **no filtra** en memoria

`PR-012` manda el filtro, la búsqueda y la página al **servidor**. Si filtrara el cliente, los
contadores por filtro no cuadrarían con la lista, porque solo tendría la página cargada.

Y un filtro desconocido se rechaza con **400** en vez de ignorarse: silenciarlo haría creer que el
portal está filtrando cuando en realidad muestra todo.

### Los dos ejes que no hay que confundir

`youthLevel` (`VERDE | AMARILLO | ROJO`, reglas del APK) y `category` (`MEDIO | ALTO`, LLM) son
**ejes independientes**. El filtro «Rojo» usa el **primero**. Un caso puede ser `ROJO` para el
joven y `MEDIO` operativamente.

---

## Estructura

```
src/
  design/
    tokens.ts        paleta extraída del prototipo (brief §37: extender, no rediseñar)
    global.css       campos, botones y avisos
    Orb.tsx          el orbe de marca
  auth/              PR-010
    api.ts           cliente de /profesional  ← la frontera, en un solo archivo
    idle.ts          cierre por inactividad (lógica pura + temporizador inyectado)
    SessionProvider.tsx
    LoginScreen.tsx
  home/              PR-011
    api.ts           cliente de /profesional/home
    format.ts        formateo del tiempo esperando (puro)
    useTodayBoard.ts carga del tablero + reloj de la interfaz
    Home.tsx         «¿Qué necesita nuestra atención ahora?»
  alerts/            PR-012
    api.ts           cliente de /profesional/alertas y de tomar caso
    Alerts.tsx       lista con filtros, búsqueda y paginación
  api/
    parse.ts         ayudantes de parseo compartidos (no confiar en la red)
  shell/
    AppShell.tsx     barra lateral (brief §33)
  App.tsx
  main.tsx
```

`src/auth/api.ts`, `src/home/api.ts` y `src/alerts/api.ts` son los **únicos** archivos que
construyen rutas de API, y los tres usan `src/api/parse.ts`.

---

## Dependencias

Es el **primer paquete del proyecto con dependencias reales**: el backend funciona sin ninguna
(Node ejecuta `.ts` con type stripping). `react`, `react-dom`, `vite`, `typescript` y tipos.

El registro npm es alcanzable, y el `package-lock.json` está commiteado para que la instalación
sea reproducible (`npm ci`).
