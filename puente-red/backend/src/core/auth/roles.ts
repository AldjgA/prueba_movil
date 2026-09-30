/**
 * PR-010 · Roles y matriz de autorización.
 *
 * **La autenticación no es una pantalla de login: es la raíz de la trazabilidad.** Sin
 * identidad de profesional fiable, `PR-018` (*"quién vio qué y cuándo"*) no puede cumplirse y
 * el guardrail #9 se cae.
 *
 * La matriz está **en un solo sitio** y es **datos**, no una cadena de `if`. Eso permite
 * probarla por tabla (se recorre cada acción contra cada rol) y evita que una comprobación
 * suelta en un endpoint se olvide.
 *
 * Los cuatro roles son los del brief §20. La matriz es una **propuesta** a ratificar por la
 * ONG: `orientador` queda restringida a lo no clínico por prudencia, y eso es una decisión
 * de producto, no técnica.
 *
 * ⚠️ **Forma canónica de `PR-003` §6.1** (hallazgo **K6** de B): claves **cerradas en
 * minúsculas**, las mismas que el Contrato C entrega al APK. Antes había dos vocabularios
 * (`PSICOLOGIA`, una disciplina, frente a `psicologo`, un rol) y el APK habría mostrado claves
 * de enum a un adolescente. El **copy visible** vive en el APK (`strings.xml`).
 */

export const PROFESSIONAL_ROLES = [
  "psicologo",
  "trabajador_social",
  "orientador",
  "supervisor",
] as const;

export type ProfessionalRole = (typeof PROFESSIONAL_ROLES)[number];

export const PORTAL_ACTIONS = [
  "VIEW_ALERTS",
  "VIEW_CASE_SUMMARY",
  "VIEW_PROFESSIONAL_NOTES",
  "TAKE_CASE",
  "WRITE_PROFESSIONAL_NOTES",
  "CREATE_REFERRAL",
  "VIEW_AGGREGATED_REPORTS",
  "MANAGE_DIRECTORY",
  "VIEW_AUDIT_LOG",
] as const;

export type PortalAction = (typeof PORTAL_ACTIONS)[number];

/**
 * Acciones que **escriben**. El modo demo no puede ejecutarlas (`PR-003` Q7: la demo no usa
 * datos reales ni sintéticos).
 */
export const WRITE_ACTIONS: readonly PortalAction[] = [
  "TAKE_CASE",
  "WRITE_PROFESSIONAL_NOTES",
  "CREATE_REFERRAL",
  "MANAGE_DIRECTORY",
];

/**
 * Matriz de autorización: acción → roles que pueden ejecutarla.
 *
 * **Lectura:** si un rol no aparece, no puede. No hay herencia ni comodines: una lista
 * explícita es auditable y no sorprende a nadie.
 */
export const AUTHORIZATION_MATRIX: Readonly<Record<PortalAction, readonly ProfessionalRole[]>> = {
  VIEW_ALERTS: ["psicologo", "trabajador_social", "orientador", "supervisor"],
  VIEW_CASE_SUMMARY: ["psicologo", "trabajador_social", "orientador", "supervisor"],
  VIEW_PROFESSIONAL_NOTES: ["psicologo", "trabajador_social", "supervisor"],
  TAKE_CASE: ["psicologo", "trabajador_social", "supervisor"],
  WRITE_PROFESSIONAL_NOTES: ["psicologo", "trabajador_social", "supervisor"],
  CREATE_REFERRAL: ["psicologo", "trabajador_social", "orientador", "supervisor"],
  VIEW_AGGREGATED_REPORTS: ["psicologo", "trabajador_social", "supervisor"],
  MANAGE_DIRECTORY: ["supervisor"],
  VIEW_AUDIT_LOG: ["supervisor"],
};

export function isProfessionalRole(value: string): value is ProfessionalRole {
  return (PROFESSIONAL_ROLES as readonly string[]).includes(value);
}

export function isPortalAction(value: string): value is PortalAction {
  return (PORTAL_ACTIONS as readonly string[]).includes(value);
}

/** ¿El rol puede ejecutar la acción, según la matriz? */
export function roleCan(role: ProfessionalRole, action: PortalAction): boolean {
  return AUTHORIZATION_MATRIX[action].includes(role);
}

export function isWriteAction(action: PortalAction): boolean {
  return WRITE_ACTIONS.includes(action);
}
