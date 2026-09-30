/**
 * PR-007 · Directorio de respondedores.
 *
 * Dos responsabilidades, y las dos son de seguridad:
 *
 * 1. **Hacer cumplir D5.** Un `CAPACITATED_STAFF` no puede tener `maxCategory = ALTO`, y
 *    `listEligible` con categoría `ALTO` nunca devuelve personal capacitado. No es una
 *    preferencia de UI: es la restricción que impide que un caso rojo acabe donde no debe.
 * 2. **No filtrar datos.** El perfil no tiene campo para documento ni domicilio, y
 *    `projectProfile` **descarta** cualquier clave desconocida que llegue de fuera.
 *
 * Y una decisión explícita: **la carga no se edita**. `ResponderLoad` se lee de una fuente
 * externa (la cola, `PR-009`), nunca se acepta en un `upsert` (criterio 7).
 */

import {
  AGE_BANDS,
  LANGUAGES,
  MAX_CATEGORY_BY_KIND,
  PROFESSIONAL_ROLES,
  SPECIALTIES,
  ZONES,
  categoryAtLeast,
  isResponderKind,
  type ProfessionalCategory,
  type ProfessionalRole,
  type ResponderKind,
  type Specialty,
} from "./vocabulary.ts";
import {
  NOOP_AUDIT_SINK,
  type AuditSink,
  type DirectoryAuditAction,
  type DirectoryAuditEvent,
} from "./audit.ts";
import type {
  Clock,
  EligibilityQuery,
  PublicProfessional,
  ResponderId,
  ResponderLoad,
  ResponderProfile,
} from "./types.ts";

export const DIRECTORY_VERSION = "directory/1.0.0";

export const SYSTEM_CLOCK: Clock = { nowEpochMillis: () => Date.now() };

/** Motivos de rechazo. Explícitos: un rechazo silencioso es un fallo de seguridad. */
export type DirectoryRejection =
  | "MISSING_ID"
  | "MISSING_DISPLAY_NAME"
  | "UNKNOWN_KIND"
  | "UNKNOWN_ROLE"
  | "UNKNOWN_CATEGORY"
  | "UNKNOWN_ZONE"
  | "UNKNOWN_SPECIALTY"
  | "UNKNOWN_LANGUAGE"
  | "UNKNOWN_AGE_BAND"
  /** D5: un `CAPACITATED_STAFF` no puede tener `maxCategory = ALTO`. */
  | "KIND_CATEGORY_MISMATCH"
  | "UNKNOWN_RESPONDER";

export type UpsertResult =
  | { readonly ok: true; readonly profile: ResponderProfile }
  | { readonly ok: false; readonly reason: DirectoryRejection };

export type SetActiveResult =
  | { readonly ok: true; readonly profile: ResponderProfile }
  | { readonly ok: false; readonly reason: DirectoryRejection };

/** Fuente de carga. La implementa `PR-009` (la cola). El directorio solo la lee. */
export interface LoadSource {
  loadFor(responderId: ResponderId): ResponderLoad;
}

export const ZERO_LOAD_SOURCE: LoadSource = {
  loadFor: (responderId) => ({
    responderId,
    openCases: 0,
    casesTakenLast7Days: 0,
    avgAckLatencyMinutes: 0,
  }),
};

/**
 * Proyección por lista blanca.
 *
 * **Criterio 6:** aunque el llamante pase `documento`, `direccion` o cualquier otra clave,
 * aquí se descarta. El perfil solo puede contener lo que este objeto declara.
 */
function projectProfile(raw: Record<string, unknown>): ResponderProfile {
  return {
    id: typeof raw["id"] === "string" ? raw["id"] : "",
    kind: raw["kind"] as ResponderKind,
    displayName: typeof raw["displayName"] === "string" ? raw["displayName"] : "",
    role: raw["role"] as ProfessionalRole,
    specialties: Array.isArray(raw["specialties"]) ? (raw["specialties"] as Specialty[]) : [],
    ageBandsServed: Array.isArray(raw["ageBandsServed"]) ? (raw["ageBandsServed"] as never[]) : [],
    languages: Array.isArray(raw["languages"]) ? (raw["languages"] as never[]) : [],
    zone: raw["zone"] as never,
    maxCategory: raw["maxCategory"] as ProfessionalCategory,
    onCall: raw["onCall"] === true,
    active: raw["active"] !== false,
    isFictional: raw["isFictional"] === true,
  };
}

function allKnown<T extends string>(values: readonly string[], known: readonly T[]): boolean {
  const set = new Set<string>(known);
  return values.every((v) => set.has(v));
}

export class Directory {
  readonly #profiles = new Map<ResponderId, ResponderProfile>();
  readonly #audit: AuditSink;
  readonly #loads: LoadSource;
  readonly #clock: Clock;

  constructor(deps: { audit?: AuditSink; loads?: LoadSource; clock?: Clock } = {}) {
    this.#audit = deps.audit ?? NOOP_AUDIT_SINK;
    this.#loads = deps.loads ?? ZERO_LOAD_SOURCE;
    this.#clock = deps.clock ?? SYSTEM_CLOCK;
  }

  // -------------------------------------------------------------------------
  // Escritura
  // -------------------------------------------------------------------------

  /**
   * Crea o actualiza un respondedor. `actorId = null` solo para la siembra de la demo.
   *
   * Rechaza si el perfil es inconsistente. En particular, **D5**: un `CAPACITATED_STAFF`
   * con `maxCategory = ALTO` se rechaza — no se "corrige" en silencio.
   */
  upsert(input: Record<string, unknown>, actorId: string | null = null): UpsertResult {
    const profile = projectProfile(input);

    const rejection = validate(profile);
    if (rejection !== null) return { ok: false, reason: rejection };

    const existed = this.#profiles.has(profile.id);
    this.#profiles.set(profile.id, profile);

    this.#emit(
      existed ? "RESPONDER_UPDATED" : "RESPONDER_CREATED",
      profile.id,
      actorId,
      { kind: profile.kind, maxCategory: profile.maxCategory },
    );

    return { ok: true, profile };
  }

  setActive(
    responderId: ResponderId,
    active: boolean,
    actorId: string | null = null,
  ): SetActiveResult {
    const current = this.#profiles.get(responderId);
    if (current === undefined) return { ok: false, reason: "UNKNOWN_RESPONDER" };

    const updated: ResponderProfile = { ...current, active };
    this.#profiles.set(responderId, updated);

    this.#emit(active ? "RESPONDER_ACTIVATED" : "RESPONDER_DEACTIVATED", responderId, actorId, {});
    return { ok: true, profile: updated };
  }

  // -------------------------------------------------------------------------
  // Lectura
  // -------------------------------------------------------------------------

  get(responderId: ResponderId): ResponderProfile | null {
    return this.#profiles.get(responderId) ?? null;
  }

  /** Todos los perfiles, ordenados por id (determinista). */
  list(): ResponderProfile[] {
    return [...this.#profiles.values()].sort((a, b) => a.id.localeCompare(b.id));
  }

  /**
   * Respondedores elegibles para una categoría (**D5** + filtros de emparejamiento).
   *
   * Un `CAPACITATED_STAFF` **nunca** aparece si la categoría es `ALTO`. Un respondedor
   * inactivo **nunca** aparece. La salida va ordenada por id: `PR-008` puntúa encima, y el
   * orden base debe ser reproducible.
   */
  listEligible(query: EligibilityQuery): ResponderProfile[] {
    return this.list().filter((profile) => {
      if (!profile.active) return false;
      if (!categoryAtLeast(profile.maxCategory, query.category)) return false;
      if (query.specialties !== undefined && query.specialties.length > 0) {
        if (!query.specialties.some((s) => profile.specialties.includes(s))) return false;
      }
      if (query.ageBand !== undefined && !profile.ageBandsServed.includes(query.ageBand)) {
        return false;
      }
      if (query.languages !== undefined && query.languages.length > 0) {
        if (!query.languages.some((l) => profile.languages.includes(l))) return false;
      }
      if (query.zone !== undefined && profile.zone !== query.zone) return false;
      return true;
    });
  }

  /** Carga operativa. Se **lee** de la fuente externa; no se almacena ni se edita. */
  load(responderId: ResponderId): ResponderLoad {
    return this.#loads.loadFor(responderId);
  }

  /**
   * **Contrato C**: lo único que el joven ve del profesional, y solo desde `ACEPTADO`
   * (la decisión de cuándo lo hace `PR-009`, no este módulo).
   *
   * Devuelve exactamente tres campos. Ni el `id`, ni la `zone`, ni la `maxCategory`, ni la
   * `kind` salen de aquí.
   *
   * Los valores de `rol` y `especialidad` son los **canónicos de `PR-003` §6.1** (minúsculas):
   * **no hay tabla de conversión** porque el vocabulario interno **es** el del contrato
   * (hallazgo **K6** de B).
   */
  publicView(responderId: ResponderId): PublicProfessional | null {
    const profile = this.#profiles.get(responderId);
    if (profile === undefined) return null;

    return {
      nombreVisible: profile.displayName,
      rol: profile.role,
      especialidad: profile.specialties[0] ?? "",
    };
  }

  // -------------------------------------------------------------------------
  // Interno
  // -------------------------------------------------------------------------

  #emit(
    action: DirectoryAuditAction,
    targetId: ResponderId,
    actorId: string | null,
    metadata: Record<string, string>,
  ): void {
    const event: DirectoryAuditEvent = {
      action,
      targetId,
      actorId,
      at: new Date(this.#clock.nowEpochMillis()).toISOString(),
      metadata,
    };
    this.#audit.record(event);
  }
}

/** Valida un perfil ya proyectado. Devuelve `null` si es válido. */
function validate(profile: ResponderProfile): DirectoryRejection | null {
  if (profile.id.trim() === "") return "MISSING_ID";
  if (profile.displayName.trim() === "") return "MISSING_DISPLAY_NAME";
  if (!isResponderKind(profile.kind)) return "UNKNOWN_KIND";
  if (!(PROFESSIONAL_ROLES as readonly string[]).includes(profile.role)) return "UNKNOWN_ROLE";
  if (!allKnown(profile.specialties, SPECIALTIES)) return "UNKNOWN_SPECIALTY";
  if (!allKnown(profile.ageBandsServed, AGE_BANDS)) return "UNKNOWN_AGE_BAND";
  if (!allKnown(profile.languages, LANGUAGES)) return "UNKNOWN_LANGUAGE";
  if (!(ZONES as readonly string[]).includes(profile.zone)) return "UNKNOWN_ZONE";
  if (
    profile.maxCategory !== "MEDIO" &&
    profile.maxCategory !== "ALTO"
  ) {
    return "UNKNOWN_CATEGORY";
  }

  // --- D5: la restricción dura ---------------------------------------------
  const allowedMax = MAX_CATEGORY_BY_KIND[profile.kind];
  if (!categoryAtLeast(allowedMax, profile.maxCategory)) {
    return "KIND_CATEGORY_MISMATCH";
  }

  return null;
}
