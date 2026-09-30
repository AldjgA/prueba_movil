/**
 * Tokens de diseño del portal.
 *
 * **De dónde salen:** extraídos del prototipo `Propuesta UX_UI Puente Joven/`
 * (`ProLoginScreen.tsx`, `ProSidebar.tsx`). El brief §37 es explícito: *"NO rediseñar las
 * pantallas que ya tienen una buena dirección estética. EXTENDER el lenguaje visual
 * existente."* Por eso los valores están **copiados**, no reinventados.
 *
 * **Por qué no se importa `:core:designsystem`:** es Compose (Android) y está congelado
 * (`CONTRATO-DE-INTEGRACION.md` §1). El brief §34 lo dice: ambos productos comparten
 * **marca, colores y tipografía**, pero **no** estructura.
 */

/** Superficies. El portal es **oscuro** por diseño del prototipo, no por preferencia. */
export const surface = {
  /** Fondo de página. */
  page: "#0D0F1A",
  /** Tarjeta / panel. */
  raised: "#141622",
  /** Estado de foco o hover sobre un campo. */
  overlay: "#1C1F33",
} as const;

/** Marca. */
export const brand = {
  primary: "#5B5CF0",
  primaryDeep: "#4338CA",
  primarySoft: "#818CF8",
  /** Acento del portal (el joven usa otro): el brief §34 pide compartir marca, no acento. */
  accent: "#14B8A6",
  accentSoft: "#5EEAD4",
  violet: "#A78BFA",
} as const;

/** Texto. */
export const text = {
  primary: "#E8EAFF",
  /** Texto secundario, etiquetas y metadatos. */
  muted: "#6B7899",
  onBrand: "#FFFFFF",
} as const;

/**
 * Semánticos. **Regla del proyecto:** el color **nunca** es la única información
 * (`PR-001` §2, brief §13). Siempre va con texto e icono.
 */
export const semantic = {
  danger: "#EF4444",
  warning: "#F59E0B",
  success: "#22C55E",
} as const;

export const radius = {
  field: "1rem",
  card: "1rem",
} as const;

/**
 * Tokens de color en formato CSS custom property, para el `global.css`.
 * Se generan desde los objetos de arriba: **una sola fuente de verdad**.
 */
export const cssVariables: Record<string, string> = {
  "--surface-page": surface.page,
  "--surface-raised": surface.raised,
  "--surface-overlay": surface.overlay,
  "--brand": brand.primary,
  "--brand-deep": brand.primaryDeep,
  "--brand-soft": brand.primarySoft,
  "--accent": brand.accent,
  "--accent-soft": brand.accentSoft,
  "--violet": brand.violet,
  "--text": text.primary,
  "--text-muted": text.muted,
  "--danger": semantic.danger,
  "--warning": semantic.warning,
  "--success": semantic.success,
  "--radius": radius.field,
};
