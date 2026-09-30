/**
 * PR-007 · Tipos del directorio.
 *
 * **Criterio 6, garantizado por el tipo:** el perfil **no tiene** campo para documento,
 * domicilio ni ningún dato personal del profesional. No es que se omita al serializar: el
 * tipo no lo admite, y `projectProfile` descarta cualquier clave desconocida.
 */

import type {
  AgeBand,
  Language,
  ProfessionalCategory,
  ProfessionalRole,
  ResponderKind,
  Specialty,
  Zone,
} from "./vocabulary.ts";

/** Identificador del respondedor. **Mapea a `auth.users.id` de Supabase Auth** (`PR-003` Q9). */
export type ResponderId = string;

export interface ResponderProfile {
  readonly id: ResponderId;
  readonly kind: ResponderKind;
  readonly displayName: string;
  readonly role: ProfessionalRole;
  readonly specialties: readonly Specialty[];
  readonly ageBandsServed: readonly AgeBand[];
  readonly languages: readonly Language[];
  readonly zone: Zone;
  /** Nivel máximo que puede tomar (D5). Restricción dura, validada en `upsert`. */
  readonly maxCategory: ProfessionalCategory;
  /** Participa en guardia. Hoy siempre `false`: no hay guardia 24/7 (`PR-003` §15). */
  readonly onCall: boolean;
  readonly active: boolean;
  /** `true` en los perfiles de demostración (brief §28, `PR-003` Q7). */
  readonly isFictional: boolean;
}

/**
 * Carga operativa. **Se deriva de la cola, no se edita** (criterio 7): por eso vive en un
 * tipo aparte y no forma parte de `ResponderProfile`.
 */
export interface ResponderLoad {
  readonly responderId: ResponderId;
  readonly openCases: number;
  readonly casesTakenLast7Days: number;
  readonly avgAckLatencyMinutes: number;
}

/**
 * **Contrato C** (`PR-003` §6.1): lo **único** que el joven ve del profesional.
 *
 * Los valores de `rol` van en minúscula y en español porque son **valores de contrato**,
 * no nombres de código. La conversión desde `ProfessionalRole` la hace
 * `toPublicProfessional`.
 */
export interface PublicProfessional {
  readonly nombreVisible: string;
  readonly rol: string; // psicologo | trabajador_social | orientador | supervisor
  readonly especialidad: string;
}

export interface Clock {
  nowEpochMillis(): number;
}

/** Criterio de elegibilidad que consume `PR-008`. */
export interface EligibilityQuery {
  readonly category: ProfessionalCategory;
  readonly specialties?: readonly Specialty[];
  readonly ageBand?: AgeBand;
  readonly languages?: readonly Language[];
  readonly zone?: Zone;
}
