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
| `PR-011` | Home profesional | ⏳ |
| `PR-012` | Centro de alertas | ⏳ |
| `PR-013` | Ficha de caso (7 secciones) | ⏳ |
| `PR-014` | «Organizado por Puente» / «valoración profesional» | ⏳ |
| `PR-015` | Timeline y seguimiento | ⏳ |
| `PR-016` | Derivaciones y directorio | ⏳ |
| `PR-017` | Observatorio y reportes | ⏳ |

Lo que existe hoy es **acceso + estructura**. Los destinos de la barra lateral muestran la tarea
que los implementa, para que nadie confunda una maqueta con un producto.

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
  shell/
    AppShell.tsx     barra lateral (brief §33)
  pages/
    Pendiente.tsx    declara qué falta y de quién es
  App.tsx
  main.tsx
```

---

## Dependencias

Es el **primer paquete del proyecto con dependencias reales**: el backend funciona sin ninguna
(Node ejecuta `.ts` con type stripping). `react`, `react-dom`, `vite`, `typescript` y tipos.

El registro npm es alcanzable, y el `package-lock.json` está commiteado para que la instalación
sea reproducible (`npm ci`).
