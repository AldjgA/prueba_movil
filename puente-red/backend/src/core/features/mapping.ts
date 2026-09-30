/**
 * PR-006 · Mapeo determinista y redacción de identidad.
 *
 * **Decisión de diseño (importante):** la extracción base es un **mapeo determinista**
 * desde las claves de catálogo del caso (`motivo` del Contrato A y claves del chequeo
 * contextual) hacia el vocabulario cerrado. Eso da tres cosas gratis:
 *
 * - **Criterio 7 (determinismo):** es una tabla, no un modelo. Misma entrada → misma salida.
 * - **Criterio 1 (vocabulario cerrado):** los valores de salida salen de la tabla.
 * - **Auditabilidad:** el clínico puede leer la tabla y corregirla sin tocar código de IA.
 *
 * El LLM (opcional, `extractionPort.ts`) solo **enriquece** desde la nota libre del resumen,
 * y su salida pasa por la misma validación. Si el LLM falla, la extracción base sigue en pie.
 *
 * ⚠️ **ESTADO: PROVISIONAL.** Las claves de la tabla se derivan de las dimensiones que ya
 * están escritas en el repo (brief §9 y resumen ejecutivo §4.1). El clínico las valida en
 * `PR-001` §5. Cuando eso pase, `MAPPING_VERSION` sube de versión.
 */

export const MAPPING_VERSION = "feature-mapping/1.0.0-provisional";

export type FeatureKind = "situation" | "domain" | "signal" | "protective" | "urgency";

export interface FeatureHint {
  readonly kind: FeatureKind;
  readonly value: string;
}

/** Claves de catálogo → características. Sinónimos en español e inglés. */
export const KEY_TO_FEATURES: Readonly<Record<string, readonly FeatureHint[]>> = {
  // === Catálogo CANÓNICO de `motivo` (PR-003 §4.2, hallazgo K2 de B) ==========
  // Estas son las claves que el APK **debe** emitir. Provisional y versionado con
  // `rulesetVersion`: provisional significa lista **cerrada**, no indefinida.
  ideacion_activa: [{ kind: "signal", value: "SELF_HARM" }],
  plan_estructurado: [{ kind: "signal", value: "SELF_HARM" }],
  intento_reciente: [{ kind: "signal", value: "SELF_HARM" }],
  autolesion: [{ kind: "signal", value: "SELF_HARM" }],
  abuso: [
    { kind: "situation", value: "VIOLENCE" },
    { kind: "signal", value: "PHYSICAL_VIOLENCE" },
  ],
  peligro_inmediato: [
    { kind: "situation", value: "VIOLENCE" },
    { kind: "signal", value: "PHYSICAL_VIOLENCE" },
  ],
  violencia_no_inmediata: [
    { kind: "situation", value: "VIOLENCE" },
    { kind: "signal", value: "PHYSICAL_VIOLENCE" },
  ],
  deterioro_escolar: [{ kind: "signal", value: "SCHOOL_IMPACT" }],
  aislamiento_persistente: [{ kind: "signal", value: "ISOLATION" }],

  // === Sinónimos (tolerancia a variantes) ====================================
  // Se conservan por defensa: si llega una variante no canónica, no se pierde la señal.
  //
  // --- Tipo de situación -----------------------------------------------------
  bullying: [{ kind: "situation", value: "BULLYING" }],
  acoso: [{ kind: "situation", value: "BULLYING" }],
  burla: [{ kind: "situation", value: "BULLYING" }],
  violencia: [
    { kind: "situation", value: "VIOLENCE" },
    { kind: "signal", value: "PHYSICAL_VIOLENCE" },
  ],
  violencia_fisica: [
    { kind: "situation", value: "VIOLENCE" },
    { kind: "signal", value: "PHYSICAL_VIOLENCE" },
  ],
  duelo: [{ kind: "situation", value: "GRIEF" }],
  perdida: [{ kind: "situation", value: "GRIEF" }],
  conflicto_familiar: [{ kind: "situation", value: "FAMILY_CONFLICT" }],
  separacion_parental: [{ kind: "situation", value: "FAMILY_CONFLICT" }],
  divorcio: [{ kind: "situation", value: "FAMILY_CONFLICT" }],
  consumo: [{ kind: "situation", value: "SUBSTANCE" }],
  alcohol: [
    { kind: "situation", value: "SUBSTANCE" },
    { kind: "signal", value: "SUBSTANCE_USE" },
  ],

  // --- Señales ---------------------------------------------------------------
  sueno: [{ kind: "signal", value: "SLEEP" }],
  sueno_alterado: [{ kind: "signal", value: "SLEEP" }],
  no_duerme: [{ kind: "signal", value: "SLEEP" }],
  aislamiento: [{ kind: "signal", value: "ISOLATION" }],
  soledad: [{ kind: "signal", value: "ISOLATION" }],
  se_aleja: [{ kind: "signal", value: "ISOLATION" }],
  impacto_escolar: [{ kind: "signal", value: "SCHOOL_IMPACT" }],
  // `deterioro_escolar` ya está en el catálogo canónico: repetirlo aquí lo sobrescribiría en
  // silencio (gana la última clave del literal). Ese duplicado lo detectó `tsc` — el backend no
  // comprueba tipos por sí solo, así que sin esta pasada habría pasado inadvertido.
  evita_recreo: [{ kind: "signal", value: "SCHOOL_IMPACT" }],
  dificultad_para_asistir: [{ kind: "signal", value: "SCHOOL_IMPACT" }],
  ansiedad: [{ kind: "signal", value: "ANXIETY" }],
  preocupacion_constante: [{ kind: "signal", value: "ANXIETY" }],

  // --- Factores protectores --------------------------------------------------
  adulto_de_confianza: [{ kind: "protective", value: "TRUSTED_ADULT" }],
  con_quien_puedes_contar: [{ kind: "protective", value: "TRUSTED_ADULT" }],
  amiga_cercana: [{ kind: "protective", value: "FRIENDSHIP" }],
  amistad: [{ kind: "protective", value: "FRIENDSHIP" }],
  profesor_identificado: [{ kind: "protective", value: "TRUSTED_ADULT" }],
  actividad: [{ kind: "protective", value: "ACTIVITY" }],
  servicio_en_curso: [{ kind: "protective", value: "SERVICE_ENGAGED" }],

  // --- Ámbito ----------------------------------------------------------------
  donde_ocurre_colegio: [{ kind: "domain", value: "SCHOOL" }],
  donde_ocurre_casa: [{ kind: "domain", value: "HOME" }],
  donde_ocurre_comunidad: [{ kind: "domain", value: "COMMUNITY" }],
  donde_ocurre_digital: [{ kind: "domain", value: "DIGITAL" }],

  // --- Urgencia declarada ----------------------------------------------------
  necesita_ayuda_ahora: [{ kind: "urgency", value: "AHORA" }],
  pronto: [{ kind: "urgency", value: "PRONTO" }],
  puede_esperar: [{ kind: "urgency", value: "PUEDE_ESPERAR" }],
};

/**
 * Normaliza una clave para buscarla en la tabla: minúsculas, sin espacios sobrantes y
 * **sin diacríticos**. Así `sueño`, `SUEÑO` y `sueno` son la misma clave, y no hay que
 * mantener dos entradas por cada palabra acentuada.
 */
export function normalizeKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/**
 * Mapea claves de catálogo a características.
 * Devuelve una lista vacía si ninguna clave es conocida — **nunca** lanza.
 */
export function hintsForKeys(keys: readonly string[]): FeatureHint[] {
  const hints: FeatureHint[] = [];
  for (const key of keys) {
    const found = KEY_TO_FEATURES[normalizeKey(key)];
    if (found !== undefined) {
      hints.push(...found);
    }
  }
  return hints;
}

// ---------------------------------------------------------------------------
// Redacción de identidad (criterio 3)
// ---------------------------------------------------------------------------

/**
 * Patrones que **no** deben llegar al modelo ni salir en el resultado.
 * No pretenden ser exhaustivos: son una barrera adicional, no la única.
 */
const EXACT_AGE = /\b(\d{1,2})\s*(años?|anos?)\b/gi;
const INSTITUTION = /\b(colegio|escuela|unidad educativa|instituto|liceo)\s+([\p{L}][\p{L}\s.'-]{1,40})/giu;
const PHONE = /\b(\+?591[\s-]?)?\d{3}[\s-]?\d{3}[\s-]?\d{2,4}\b/g;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]{2,}/g;
const HANDLE = /@[\w.]{2,}/g;

/**
 * Redacta el texto **antes** de enviarlo al proveedor.
 *
 * La edad exacta se convierte en banda; la institución, el teléfono, el correo y el
 * identificador social se sustituyen por marcadores. El objetivo no es anonimizar
 * perfectamente: es que un dato de identificación **no tenga un camino fácil** hacia el
 * modelo ni hacia la ficha del profesional.
 */
export function redactForModel(text: string): string {
  return text
    .replace(EXACT_AGE, (_match, age: string) => `[banda_edad:${ageToBand(Number(age))}]`)
    .replace(INSTITUTION, "[institucion_redactada]")
    .replace(EMAIL, "[correo_redactado]")
    .replace(PHONE, "[telefono_redactado]")
    .replace(HANDLE, "[usuario_redactado]");
}

function ageToBand(age: number): string {
  if (Number.isNaN(age)) return "desconocida";
  if (age <= 14) return "13-14";
  if (age <= 16) return "15-16";
  if (age <= 18) return "17-18";
  return "fuera_de_rango";
}

/**
 * Comprueba que un valor de salida no contiene un patrón de identidad.
 *
 * Con un vocabulario cerrado esto debería ser imposible, pero se ejecuta igual: es la
 * prueba de que el criterio 3 se cumple **en la salida**, no solo en el tipo.
 */
export function containsIdentityPattern(value: string): boolean {
  // Se reconstruyen las expresiones para evitar el estado de `lastIndex` de /g.
  return (
    /\b\d{1,2}\s*(años?|anos?)\b/i.test(value) ||
    /\b(colegio|escuela|unidad educativa|instituto|liceo)\s+\p{L}/iu.test(value) ||
    /[\w.+-]+@[\w-]+\.[\w.]{2,}/.test(value)
  );
}
