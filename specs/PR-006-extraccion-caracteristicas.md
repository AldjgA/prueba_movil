# PR-006 · Extracción de características del caso

**Estado:** Aprobada (`REVISION-C.md` — "Aprobada con hallazgos"; incorpora sus respuestas §5)
**Autor:** Agente C · **Revisor:** Agente A
**Fecha:** 2026-09-30
**Ola:** R1 · **Depende de:** `PR-001` §5–6, `PR-003` §4, `PR-004` · **Bloquea:** `PR-008`, `PR-013`

---

## 1. Contexto

Clasificar en medio/alto dice **cuánta urgencia** tiene un caso. No dice **con quién** debe
emparejarse. Eso exige convertir el reporte autorizado en un vector de características
estructuradas que `PR-008` pueda comparar contra el perfil de un respondedor (`PR-007`).

Sin esta pieza, *"derivar al psicólogo más apropiado"* (`PLAN-PUENTE-RED.md` §3.3) es una caja
negra. Aquí se abre: se declara **qué atributos** se extraen y con qué vocabulario controlado.

**Este servicio no interpreta ni diagnostica.** Extrae características observables del contenido
autorizado, con vocabulario cerrado.

---

## 2. Alcance

### Dentro
- Extraer del `ResumenAutorizado` **y de las `respuestasChequeo`** un `CaseFeatureSet` con
  vocabulario **cerrado**:
  - **tipo de situación** (bullying, violencia, duelo, conflicto familiar, adicciones, otro);
  - **ámbito** (colegio, casa, comunidad, digital);
  - **señales** (sueño, aislamiento, impacto escolar, consumo, autolesión, ansiedad);
  - **factores protectores** (adulto de confianza, amistad, actividad, servicio en curso);
  - **banda de edad** (13-14 / 15-16 / 17-18) — única característica demográfica admitida;
  - **urgencia percibida por el joven**, si el resumen la declara.
- Marcar cada característica como `EXTRACTED` (del texto) o `DECLARED` (el joven la afirmó).
- Registrar `ExtractorVersion` + `PromptVersion`.

### Fuera
- **Nunca** extraer nombre, edad exacta, colegio concreto, dirección ni barrio.
- No puntuar gravedad ni riesgo.
- No decidir la derivación.
- No extraer nada del chat no autorizado. Solo del `ResumenAutorizado`.
- No inferir características no declaradas (p. ej. "probable depresión").

> **Corrección por el hallazgo K4 de B.** `respuestasChequeo` viajaba en el Contrato A
> (`PR-003` §4) y **ningún consumidor lo leía**: era superficie de exposición sin contrapartida.
> Se consume aquí, y con razón — son **claves de catálogo declaradas por el joven**, la fuente
> estructurada más limpia del sistema (brief §9). Procedencia `DECLARED`.
>
> **Corrección por el hallazgo K1 de B.** Las claves de señal son las **canónicas de
> `PR-003` §4.1** (`SNAKE_CASE` en mayúsculas). `frequency` se **retira**: era una *dimensión de
> análisis* (brief §10), no un tipo de señal.
>
> **Corrección por el hallazgo K2 de B.** El catálogo de `motivo` es el de **`PR-003` §4.2**
> (provisional y versionado con `rulesetVersion`), no una lista por definir.

---

## 3. Módulo y propiedad

- Módulo: `puente-red/backend/core/features`
- Dueño: **C**
- Runtime: **Go** (o Node/Bun)
- Archivos compartidos que necesita declarar: **ninguno**.

---

## 4. Contratos de datos

- Interfaces de `Repositories.kt` que consume: **ninguna**.
- Métodos nuevos que necesita: **ninguno del APK**.

```go
type SituationType string  // BULLYING | VIOLENCE | GRIEF | FAMILY_CONFLICT | SUBSTANCE | OTHER
type Domain string         // SCHOOL | HOME | COMMUNITY | DIGITAL
type SignalTag string      // SLEEP | ISOLATION | SCHOOL_IMPACT | SUBSTANCE_USE | SELF_HARM | ANXIETY
type ProtectiveFactor string // TRUSTED_ADULT | FRIENDSHIP | ACTIVITY | SERVICE_ENGAGED
type Provenance string     // EXTRACTED | DECLARED
type ConfidenceBand string // LOW | MEDIUM | HIGH — banda, NO probabilidad clínica

type CaseFeatureSet struct {
    CaseToken         string
    Situation         CaseFeature[SituationType]
    Domains           []CaseFeature[Domain]
    Signals           []CaseFeature[SignalTag]
    ProtectiveFactors []CaseFeature[ProtectiveFactor]
    AgeBand           string
    ExtractorVersion  string
    PromptVersion     string
    ExtractedAt       time.Time
}
```

`ConfidenceBand` es una **banda cualitativa**, no un porcentaje: un porcentaje invitaría a leerlo
como probabilidad clínica, que es lo que el brief §15 prohíbe mostrar.

---

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Todo `CaseFeatureSet` contiene solo valores de los enums cerrados | unitaria de esquema |
| 2 | Ninguna característica contiene texto libre del reporte | unitaria: la salida no comparte subcadenas largas con la entrada |
| 3 | La extracción nunca produce nombre, edad exacta ni institución | unitaria con reportes que los contienen: deben descartarse |
| 4 | `Provenance` distingue correctamente lo declarado de lo extraído | unitaria con casos etiquetados a mano |
| 5 | Toda extracción lleva `ExtractorVersion` y `PromptVersion` | aserción de esquema |
| 6 | Con `ResumenAutorizado` vacío, el resultado es vacío, no error | unitaria de borde |
| 7 | El resultado es determinista para la misma entrada y versión | unitaria de repetibilidad |

---

## 6. Guardrails aplicables

- `PR-001` §2 — las características son **observables**, no valoración clínica.
- #2 — alimenta una propuesta de emparejamiento; no decide.
- **`PR-003` §9.2** — el chat completo nunca entra. Criterios 2 y 6.
- **`PR-003` §9.7** — el extractor nunca ve identidad del joven.
- Brief §15 — no scores ni probabilidades clínicas. `ConfidenceBand` es cualitativa.

---

## 7. Referencia visual

`ProCaseScreen.tsx` — bloques *"SEÑALES REGISTRADAS"* y *"FACTORES PROTECTORES"*.
`ProCaseFichaScreen.tsx` — secciones 3 y 4 de la ficha.

---

## 8. Dependencias

- **Bloquea:** `PR-008`, `PR-013`.
- **Bloqueado por:** — ✅ **desbloqueada.** `PR-001` §5–6 **firmado clínicamente** (2026-09-30);
  `PR-004` ✅.
- **Specs relacionadas:** `PR-005` (clasificación), `PR-007` (directorio).

---

## 9. Preguntas abiertas

| # | Pregunta | Estado |
|---|---|---|
| P6 | ¿Qué atributos pesan en "el más apropiado"? | define qué debe extraerse realmente |
| — | ¿El vocabulario cerrado lo valida el clínico? | ✅ **cerrado**: validado con la firma de `PR-001` §5 |
| — | ¿Se admite `SUBSTANCE_USE` en el piloto? | resumen §4.1 lo marca prioritario; confirmar |

---

## 10. Definition of Done

- [x] Spec **Aprobada** por otro agente (`REVISION-C.md`)
- [x] Compila y pasa pruebas — `npm test`: **40/40 en verde** (18 de este módulo)
- [x] Pruebas de los 7 criterios en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado — **entregado**
  (`deliverables/PR-006/NECESIDADES.md`); no añade necesidades nuevas
- [x] Sin secretos ni endpoints hardcodeados
- [x] Ningún contrato profesional compilado en el APK (`PR-003` §9.10)

### Estado de implementación (2026-09-30)

**Implementado** en `puente-red/backend/core/features/` (dueño: C), Node ≥ 22.18, sin
dependencias ni build step.

Arquitectura en dos capas:

1. **Extracción base determinista** (`mapping.ts`): tabla de claves de catálogo → vocabulario
   cerrado. Es lo que da el **criterio 7** (determinismo) y hace la extracción **auditable por
   el clínico** sin tocar código de IA.
2. **Enriquecimiento opcional por LLM** (`extractionPort.ts`): deduce de la nota **ya
   redactada**. Un fallo o timeout **no** invalida la extracción base.

Decisiones que hacen verificables los criterios:

- **Criterio 2:** la salida no tiene ningún campo de texto libre — es una propiedad del tipo.
  Un modelo que devuelve prosa ve su texto descartado (probado).
- **Criterio 3:** `redactForModel` convierte la edad exacta en **banda** y elimina institución,
  teléfono, correo y usuario **antes** de que el texto llegue al proveedor (probado
  interceptando la petición).
- **Criterio 4:** `DECLARED` vs `EXTRACTED` con bandas de confianza distintas; una
  característica declarada **no** se degrada al fusionar (probado).
- **Criterio 7c:** la salida se **reordena por vocabulario**, así que no depende del orden en
  que el modelo devolvió las claves. *(Esto corrigió un bug real detectado por las pruebas.)*

**Provisional, pendiente del clínico (`PR-001` §5):** el vocabulario y la tabla de mapeo.
