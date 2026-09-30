/**
 * PR-011 · Siembra de casos **ficticios** para demostrar el tablero.
 *
 * ⚠️ **Opt-in y apagada por defecto.** `PR-003` Q7 es explícito: *"nada de datos de verdad;
 * pero no cargar datos sintéticos aún"*. Por eso:
 *
 * - **Por defecto el tablero está VACÍO**, y ese estado vacío es el correcto (criterio 4).
 * - Solo se siembra si `PUENTE_DEMO_CASOS=on`, y entonces el tablero se marca `demoData: true`
 *   para que el portal pueda decirlo.
 *
 * Un tablero con casos inventados que no se anuncia es peor que un tablero vacío: haría creer
 * que hay trabajo real pendiente.
 */

import { Directory, DEMO_SEED as DIRECTORIO_DEMO } from "../directory/index.ts";
import { CaseQueue } from "../queue/index.ts";
import { SYSTEM_ACTOR } from "../queue/index.ts";

const MINUTO = 60_000;

export interface DemoCaseSpec {
  readonly caseToken: string;
  readonly originLevel: string;
  readonly category: "MEDIO" | "ALTO";
  readonly minutosDesdeRecepcion: number;
  /** Si se indica, el caso se asigna a este respondedor del directorio ficticio. */
  readonly asignarA?: string;
}

/**
 * Tres casos, elegidos para que el tablero **demuestre el orden**:
 *
 * 1. `ALTO` sin responsable y con el acuse vencido → severidad 0 (primero).
 * 2. `MEDIO` asignado y con el SLA en riesgo → severidad 4.
 * 3. `MEDIO` recién llegado y sin responsable, dentro de plazo → severidad 5.
 */
export const CASOS_DEMO: readonly DemoCaseSpec[] = [
  {
    caseToken: "DEMO-ALTO-SIN-RESPONSABLE",
    originLevel: "ROJO",
    category: "ALTO",
    minutosDesdeRecepcion: 40,
  },
  {
    caseToken: "DEMO-MEDIO-ASIGNADO",
    originLevel: "AMARILLO",
    category: "MEDIO",
    minutosDesdeRecepcion: 210,
    asignarA: DIRECTORIO_DEMO[2]?.id ?? "demo-personal-capacitado",
  },
  {
    caseToken: "DEMO-MEDIO-NUEVO",
    originLevel: "AMARILLO",
    category: "MEDIO",
    minutosDesdeRecepcion: 10,
  },
];

export interface SeedDemoOptions {
  readonly queue: CaseQueue;
  readonly directory: Directory;
  readonly nowEpochMillis: number;
}

/**
 * Siembra los casos ficticios. **No** siembra el directorio: eso lo hace quien construye el
 * directorio, porque el directorio ficticio ya existe para otros fines.
 */
export function seedDemoCases(options: SeedDemoOptions): number {
  let sembrados = 0;

  for (const spec of CASOS_DEMO) {
    const recibido = options.nowEpochMillis - spec.minutosDesdeRecepcion * MINUTO;

    const alta = options.queue.enqueue(
      {
        caseToken: spec.caseToken,
        originLevel: spec.originLevel,
        rulesetVersion: "demo",
        category: null,
        receivedAtEpochMillis: recibido,
      },
      `demo-${spec.caseToken}`,
    );
    if (!alta.ok) continue;

    options.queue.markClassified(spec.caseToken, spec.category);
    options.queue.enqueueForRouting(spec.caseToken);

    if (spec.asignarA !== undefined) {
      options.queue.assign(spec.caseToken, spec.asignarA, SYSTEM_ACTOR);
    }

    sembrados += 1;
  }

  return sembrados;
}
