/**
 * Punto de entrada del portal.
 *
 * Las **custom properties de color** se inyectan desde `design/tokens.ts` para que la paleta
 * tenga una sola fuente de verdad: si un token cambia, cambia el CSS y el TS a la vez.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.tsx";
import { SessionProvider } from "./auth/SessionProvider.tsx";
import { cssVariables } from "./design/tokens.ts";
import "./design/global.css";

const contenedor = document.getElementById("root");
if (contenedor === null) {
  throw new Error("Falta el contenedor #root en index.html");
}

for (const [nombre, valor] of Object.entries(cssVariables)) {
  contenedor.style.setProperty(nombre, valor);
}

createRoot(contenedor).render(
  <StrictMode>
    <SessionProvider>
      <App />
    </SessionProvider>
  </StrictMode>,
);
