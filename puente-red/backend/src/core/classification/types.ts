/**
 * PR-005 · Tipos del dominio del clasificador.
 *
 * Reglas de estilo (plantilla `specs/_PLANTILLA-SPEC.md` §2.1): identificadores en inglés,
 * copy de producto en español. Los valores de los niveles/categorías van en español porque
 * son **valores de contrato** con el APK (`PR-003` §3.1), no nombres de código.
 *
 * Nota técnica: este paquete usa el *type stripping* nativo de Node (>=22.18), así que
 * **no** se pueden usar `enum`, `namespace` ni *parameter properties*. Por eso los
 * "enums" son uniones de literales + objetos `as const`.
 */

/** Nivel de prioridad preliminar calculado por las **reglas** del APK. El LLM no lo produce. */
export type OriginLevel = "VERDE" | "AMARILLO" | "ROJO";

/** Categoría operativa del equipo. Es la salida de `PR-005` (`PR-003` §5). */
export type ProfessionalCategory = "MEDIO" | "ALTO";

/**
 * Clave de catálogo. **Nunca** prosa generada por el modelo: la prosa se renderiza en el
 * portal desde el catálogo versionado (`PR-005` §4).
 */
export type CatalogKey = string;

/** Estados del caso (`PR-003` §3.1). `RESUELTO` y `CERRADO` son distintos (REVISION-C §5.1). */
export type CaseState =
  | "RECIBIDO"
  | "CLASIFICADO"
  | "EN_COLA"
  | "ASIGNADO"
  | "ACEPTADO"
  | "CONTACTO_HABILITADO"
  | "EN_CURSO"
  | "RESUELTO"
  | "CERRADO";

/** Resumen autorizado por el joven. `scope` es CERRADO (`PR-003` §4). */
export interface AuthorizedSummary {
  readonly scope: readonly string[];
  readonly note?: string;
}

/**
 * Entrada del clasificador: el **Contrato A** ya ingerido por `PR-004`.
 * No contiene `ProfileId`, alias ni MAC — solo el `caseToken`.
 */
export interface IngestedReport {
  readonly caseToken: string; // ULID (PR-004 §3)
  readonly contratoVersion: string;
  readonly origenNivel: OriginLevel;
  readonly rulesetVersion: string;
  readonly motivo: readonly CatalogKey[];
  readonly resumenAutorizado: AuthorizedSummary;
  readonly creadoEn: string; // ISO-8601
}

/**
 * Salida: una **propuesta**, no una decisión. La validación humana es el acto de
 * aceptación del profesional (`ACEPTADO`, `PR-003` §3.1).
 */
export interface ClassificationProposal {
  readonly caseToken: string;
  readonly category: ProfessionalCategory;
  readonly rationaleKeys: readonly CatalogKey[];
  readonly modelVersion: string;
  readonly promptVersion: string;
  /** Hash de la entrada. Permite auditar sin retener el prompt (`PR-018`). */
  readonly inputHash: string;
  /** `false` si el origen era `ROJO`: la alarma no se puede desactivar (D2). */
  readonly isDegradable: boolean;
  readonly producedAt: string; // ISO-8601
  /** `true` si se aplicó la política de fallo (timeout, error o clasificador apagado). */
  readonly fallbackApplied: boolean;
}

/** Transición de estado producida por la clasificación. */
export interface CaseTransition {
  readonly from: "RECIBIDO";
  readonly to: "CLASIFICADO";
  readonly at: string;
}

export interface ClassificationOutcome {
  readonly proposal: ClassificationProposal;
  readonly transition: CaseTransition;
}

/** Reloj inyectable: hace demostrables los criterios con timeout y retención. */
export interface Clock {
  nowEpochMillis(): number;
}
