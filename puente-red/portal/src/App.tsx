/**
 * Portal profesional de Puente Red.
 *
 * Dos estados, y solo dos: **sin sesión** → acceso; **con sesión** → estructura de trabajo.
 * La guardia de verdad está en el servidor (`/profesional/**`); esto es solo presentación.
 *
 * La navegación es un `useState` porque hoy hay **dos** pantallas. Cuando sean nueve (`PR-013`…
 * `PR-017`), tocará una librería de rutas con URLs de verdad — y entonces la decisión tendrá un
 * motivo, no será por adelantarse.
 */

import { useState } from "react";

import { LoginScreen } from "./auth/LoginScreen.tsx";
import { useSession } from "./auth/SessionProvider.tsx";
import { Alerts } from "./alerts/Alerts.tsx";
import { Home } from "./home/Home.tsx";
import { AppShell, type Vista } from "./shell/AppShell.tsx";

export function App() {
  const { estado } = useSession();
  const [vista, setVista] = useState<Vista>("inicio");

  if (estado !== "autenticado") {
    return <LoginScreen />;
  }

  return (
    <AppShell vista={vista} onNavegar={setVista}>
      {vista === "alertas" ? <Alerts /> : <Home />}
    </AppShell>
  );
}
