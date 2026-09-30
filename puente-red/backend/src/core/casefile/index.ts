/**
 * PR-013 · API pública del paquete `casefile`.
 */

export {
  CASE_FILE_SECTIONS,
  ENCUADRE_KEY,
  NUNCA_AUTORIZADO,
  NO_DISPONIBLE,
  TITULO_KEY,
  buildCaseFicha,
} from "./caseFile.ts";
export type {
  BuildCaseFichaParams,
  CaseFicha,
  CaseFileSection,
  ConsentimientoEstado,
  FichaEvento,
  FichaSeccion,
} from "./caseFile.ts";
