/**
 * Portal profesional de Puente Red.
 *
 * Dos estados, y solo dos: **sin sesión** → acceso; **con sesión** → estructura de trabajo.
 * La guardia de verdad está en el servidor (`/profesional/**`); esto es solo presentación.
 */

import { LoginScreen } from "./auth/LoginScreen.tsx";
import { useSession } from "./auth/SessionProvider.tsx";
import { Pendiente } from "./pages/Pendiente.tsx";
import { AppShell } from "./shell/AppShell.tsx";

export function App() {
  const { estado } = useSession();

  if (estado !== "autenticado") {
    return <LoginScreen />;
  }

  return (
    <AppShell activo="Inicio">
      <Pendiente />
    </AppShell>
  );
}
