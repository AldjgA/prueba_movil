/**
 * PR-007 · Siembra de demostración.
 *
 * ⚠️ **Datos FICTICIOS.** El brief §28 lo exige (*"No inventar servicios oficiales reales"*)
 * y `PR-003` Q7 lo refuerza: la demo **no** usa datos reales ni sintéticos. Estos perfiles
 * existen para poder demostrar el flujo de derivación, y **todos** van marcados
 * `isFictional: true` (criterio 3).
 *
 * Son tres y no treinta a propósito: con un directorio grande, la demo parecería un sistema
 * en producción. Tres perfiles dejan claro que es una demostración.
 */

import type { ResponderProfile } from "./types.ts";

export const DEMO_SEED: readonly ResponderProfile[] = [
  {
    id: "demo-psicologa-trauma",
    kind: "PSYCHOLOGIST",
    displayName: "Ana López",
    role: "PSICOLOGIA",
    specialties: ["TRAUMA", "BULLYING"],
    ageBandsServed: ["13-14", "15-16", "17-18"],
    languages: ["ES"],
    zone: "CENTRO",
    maxCategory: "ALTO",
    onCall: false,
    active: true,
    isFictional: true,
  },
  {
    id: "demo-psicologo-familia",
    kind: "PSYCHOLOGIST",
    displayName: "Marcelo Quispe",
    role: "PSICOLOGIA",
    specialties: ["FAMILY", "GRIEF"],
    ageBandsServed: ["15-16", "17-18"],
    languages: ["ES", "AY"],
    zone: "EL_ALTO",
    maxCategory: "ALTO",
    onCall: false,
    active: true,
    isFictional: true,
  },
  {
    id: "demo-personal-capacitado",
    kind: "CAPACITATED_STAFF",
    displayName: "Rocío Mamani",
    role: "TRABAJO_SOCIAL",
    specialties: ["BULLYING", "FAMILY"],
    ageBandsServed: ["13-14", "15-16", "17-18"],
    languages: ["ES", "AY", "QU"],
    zone: "MIRAFLORES",
    maxCategory: "MEDIO",
    onCall: false,
    active: true,
    isFictional: true,
  },
];

/** `true` si **todos** los perfiles de la siembra están marcados como ficticios. */
export function seedIsEntirelyFictional(): boolean {
  return DEMO_SEED.every((profile) => profile.isFictional === true);
}
