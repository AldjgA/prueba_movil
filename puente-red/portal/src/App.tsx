/**
 * Portal profesional de Puente Red.
 *
 * Dos estados, y solo dos: **sin sesión** → acceso; **con sesión** → estructura de trabajo.
 * La guardia de verdad está en el servidor (`/profesional/**`); esto es solo presentación.
 *
 * La navegación es un `useState` con una **unión discriminada**, porque hoy hay tres vistas y una
 * de ellas lleva parámetro (la ficha de caso). Cuando sean nueve (`PR-014`… `PR-017`), tocará una
 * librería de rutas con URLs de verdad — y entonces la decisión tendrá un motivo.
 */

import { useState } from "react";

import { LoginScreen } from "./auth/LoginScreen.tsx";
import { useSession } from "./auth/SessionProvider.tsx";
import { Alerts } from "./alerts/Alerts.tsx";
import { CaseFile } from "./case/CaseFile.tsx";
import { Home } from "./home/Home.tsx";
import { AppShell, type Destino } from "./shell/AppShell.tsx";

type Vista =
  | { readonly tipo: "inicio" }
  | { readonly tipo: "alertas" }
  | { readonly tipo: "ficha"; readonly caseToken: string };

export function App() {
  const { estado } = useSession();
  const [vista, setVista] = useState<Vista>({ tipo: "inicio" });

  if (estado !== "autenticado") {
    return <LoginScreen />;
  }

  const abrirCaso = (caseToken: string): void => setVista({ tipo: "ficha", caseToken });
  // La ficha se abre **desde** alertas, así que la barra marca Alertas como activo.
  const activo: Destino = vista.tipo === "ficha" ? "alertas" : vista.tipo;

  return (
    <AppShell activo={activo} onNavegar={(destino) => setVista({ tipo: destino })}>
      {vista.tipo === "inicio" && <Home onAbrirCaso={abrirCaso} />}
      {vista.tipo === "alertas" && <Alerts onAbrirCaso={abrirCaso} />}
      {vista.tipo === "ficha" && (
        <CaseFile caseToken={vista.caseToken} onVolver={() => setVista({ tipo: "alertas" })} />
      )}
    </AppShell>
  );
}
