# PR-006 · Extracción de características del caso

**Agente:** C · **Ola:** R1 · **Depende de:** `PR-001` §5–6, `PR-004`
**Bloquea a:** `PR-008` (el motor de derivación empareja por características)
**Reconciliado:** 2026-09-30 — sin cambios estructurales. La entrada es el **Contrato A** (`PR-003` §4): `motivo` ya viene como **claves de catálogo**, no texto libre, lo que encaja con el vocabulario cerrado de esta spec. `promptVersion` obligatorio (ya estaba). Sin nomenclatura de estados que corregir.

---

## Contexto

Clasificar en medio/alto dice **cuánta urgencia** tiene un caso. No dice **con quién** debe
emparejarse. Eso exige convertir el reporte autorizado en un vector de características
estructuradas que el motor de derivación pueda comparar contra el perfil de un profesional
(`PR-007`).

Sin esta pieza, *"derivar al psicólogo más apropiado"* (`PLAN-PUENTE-RED.md` §3.3) es una caja
negra. Aquí se abre: se declara **qué atributos** del caso se extraen y con qué vocabulario
controlado.

**Este servicio no interpreta ni diagnostica.** Extrae características observables del
contenido autorizado, con un vocabulario cerrado.

---

## Alcance

### Dentro

- Extraer del `authorizedSummary` un conjunto de `CaseFeature` con vocabulario controlado:
  - **tipo de situación** (bullying, violencia, duelo, conflicto familiar, adicciones, otro);
  - **ámbito** (colegio, casa, comunidad, digital);
  - **señales presentes** (sueño alterado, aislamiento, impacto escolar, consumo, autolesión);
  - **factores protectores** (adulto de confianza, amistad, actividad, servicio ya en curso);
  - **banda de edad** (13-14 / 15-16 / 17-18) — la única característica demográfica admitida;
  - **urgencia percibida por el joven** (si el resumen la declara).
- Marcar cada característica como **`extracted`** (del texto) o **`declared`** (el joven la
  afirmó explícitamente), para que el profesional sepa su procedencia.
- Registrar `extractorVersion` + `promptVersion` en cada extracción.

### Fuera

- **Nunca** extraer nombre, edad exacta, colegio concreto, dirección, barrio ni ningún dato
  que reidentifique. Prohibido por diseño (`PLAN-PUENTE-RED.md` §2.3).
- No puntuar gravedad ni riesgo.
- No decidir la derivación.
- No extraer nada del chat no autorizado. Solo del `authorizedSummary`.
- No inferir características no declaradas (p. ej. "probable depresión"). Solo vocabulario
  cerrado y observable.

---

## Módulo y propiedad

- Módulo: `puente-red/backend/features`
- Dueño: **C**. Ningún archivo compartido con el APK.

```
extract(IngestedReport) -> CaseFeatureSet
```

---

## Contratos de datos

```kotlin
/** Vocabulario CERRADO. Añadir un valor es una decisión de producto, no de código. */
enum class SituationType { BULLYING, VIOLENCE, GRIEF, FAMILY_CONFLICT, SUBSTANCE, OTHER }
enum class Domain { SCHOOL, HOME, COMMUNITY, DIGITAL }
enum class SignalTag { SLEEP, ISOLATION, SCHOOL_IMPACT, SUBSTANCE_USE, SELF_HARM, ANXIETY }
enum class ProtectiveFactor { TRUSTED_ADULT, FRIENDSHIP, ACTIVITY, SERVICE_ENGAGED }

enum class Provenance { EXTRACTED, DECLARED }

data class CaseFeature<T>(
    val value: T,
    val provenance: Provenance,
    val confidenceBand: ConfidenceBand, // LOW | MEDIUM | HIGH — banda, NO probabilidad clínica
)

data class CaseFeatureSet(
    val caseToken: CaseToken,
    val situation: CaseFeature<SituationType>,
    val domains: List<CaseFeature<Domain>>,
    val signals: List<CaseFeature<SignalTag>>,
    val protectiveFactors: List<CaseFeature<ProtectiveFactor>>,
    val ageBand: AgeBand,
    val extractorVersion: String,
    val promptVersion: String,
    val extractedAtEpochMillis: Long,
)
```

**Nota de diseño:** `ConfidenceBand` es una **banda cualitativa**, no un porcentaje. Un
porcentaje invitaría a leerlo como probabilidad clínica, que es exactamente lo que el brief §15
prohíbe mostrar.

---

## Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Todo `CaseFeatureSet` contiene solo valores de los enums cerrados | prueba de esquema |
| 2 | Ninguna característica contiene texto libre del reporte | prueba: la salida serializada no comparte subcadenas largas con la entrada |
| 3 | La extracción nunca produce nombre, edad exacta ni institución | prueba con reportes que los contienen: deben descartarse |
| 4 | `provenance` distingue correctamente lo declarado de lo extraído | prueba con casos etiquetados a mano |
| 5 | Toda extracción lleva `extractorVersion` y `promptVersion` | aserción de esquema |
| 6 | Con `authorizedSummary` vacío, el resultado es un conjunto vacío, no un error | prueba de borde |
| 7 | El resultado es determinista para la misma entrada y versión | prueba de repetibilidad |

---

## Guardrails aplicables

- #1 — las características son **observables**, no valoración clínica.
- #2 — alimenta una propuesta de emparejamiento; no decide.
- #5 — el chat completo nunca entra. Criterio 6 y alcance.
- #6 — el extractor nunca ve identidad.
- Brief §15 — no scores ni probabilidades clínicas. `ConfidenceBand` es cualitativa.

---

## Referencia visual

`ProCaseScreen.tsx` — bloque **"SEÑALES REGISTRADAS"** y **"FACTORES PROTECTORES"**.
`ProCaseFichaScreen.tsx` — secciones 3 (señales) y 4 (factores protectores).

---

## Dependencias

- **Bloqueado por:** `PR-001` §5–6 (vocabulario y alcance de lo extraíble).
- **Bloqueado por:** `PR-004` (ingesta).
- **Bloquea a:** `PR-008` (emparejamiento), `PR-013` (ficha de caso, secciones 3 y 4).

---

## Preguntas abiertas

| # | Pregunta | Impacto |
|---|---|---|
| P6 | ¿Qué atributos pesan en "el más apropiado"? | define qué debe extraerse realmente |
| — | ¿El vocabulario cerrado lo valida el clínico? | propuesta: sí, junto con `PR-001` §5 |
| — | ¿Se admite `SUBSTANCE_USE` en el piloto o es sensible para la competencia? | resumen §4.1 lo marca prioritario; conviene confirmarlo |
