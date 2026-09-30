# PR-000 · Arquitectura y ubicación de Puente Red

**Agente:** C — Portal profesional / Puente Red
**Fecha:** 2026-09-30
**Estado:** propuesta de la Fase 0. **Requiere ratificación de A** (§3.0.3 de `PLAN-3-AGENTES.md`)
y revisión de B.
**Plantilla:** la propuesta en `PLAN-TRABAJO-SDD.md` §6, hasta que A publique la definitiva
(`TASK-000`).

---

## 0. Por qué existe este documento

`PLAN-3-AGENTES.md` §9 dice que la primera acción de C es *"redactar las specs de `PR-005` a
`PR-020`"*. Pero hay un vacío previo que ninguna de esas 18 specs puede cerrar por su cuenta:

1. **No está decidido dónde vive Puente Red.** ¿Otro repo? ¿Otro directorio en este repo?
   ¿Otra app dentro del mismo Gradle? El plan solo dice *"comparte marca, no estructura"*.
2. **No está decidido el stack.** El prototipo es React/TypeScript; el APK es Kotlin/Compose.
   El brief §34 pide *desktop-first* y mayor densidad de información.
3. **`P10` (¿web, tablet o ambos?) está abierto y bloquea `PR-010`.** El propio plan lo lista
   como pregunta abierta.

Sin cerrar esto, las 18 specs heredarían supuestos contradictorios. Este documento fija los
supuestos **una vez** y cada spec los referencia.

---

## 1. Decisión propuesta: dónde vive

**Propuesta:** Puente Red vive en **este mismo repositorio**, en un directorio hermano de
`puente-joven-android/`:

```
prueba_movil/
├── puente-joven-android/        ← APK juvenil (A y B). Sin red, sin Puente Red.
├── Propuesta UX_UI Puente Joven/ ← prototipo web (referencia visual de ambos productos)
└── puente-red/                  ← NUEVO. Portal profesional + backend. Dueño: C.
    ├── portal/                  ← aplicación web (desktop-first)
    ├── backend/                 ← servicio de ingesta, clasificación y derivación
    └── deliverables/            ← specs, declaraciones y reportes de C
```

**Por qué en el mismo repo y no en otro:**

| Razón | Detalle |
|---|---|
| El contrato entre productos se versiona junto | `PR-003` (A) es la frontera; tenerla en el mismo repo permite un test de contrato en un solo CI |
| `PR-020` (pruebas de contrato) necesita ambos lados | Un repo aparte obligaría a publicar artefactos versionados antes de poder probar |
| El brief §31 exige diseñar *cómo se conectan* | La conexión es un artefacto del repo, no de la infraestructura |

**Lo que esto NO significa:** que se compile junto. Ver §2.

---

## 2. Frontera de compilación (guardrail #6)

Guardrail #6: *"Ningún contrato de Puente Red se compila en el APK juvenil."*
Y `BACKEND_INTEGRATION.md` §6.5 lo repite como invariante.

| Regla | Verificación |
|---|---|
| `puente-red/` **no** aparece en `settings.gradle.kts` de `puente-joven-android/` | `ModuleGraphGuardTest` sigue verde |
| Ningún módulo `:feature:*` ni `:core:*` del APK importa nada de `puente-red/` | revisión de imports en CI |
| El APK no conoce `caseToken` como tipo de dominio | el `caseToken` vive en el paquete de alerta (TASK-015, de B), no en `:core:model` |

**Consecuencia de diseño:** el paquete de alerta que produce el APK es un **documento
serializado**, no un tipo compartido. B lo produce contra `PR-003`; C lo consume. Ninguno
depende del código del otro.

---

## 3. Decisión propuesta: stack

| Capa | Propuesta | Alternativa descartada | Por qué |
|---|---|---|---|
| **Portal** | **TypeScript + React + Vite** | Compose Multiplatform desktop | El prototipo `Propuesta UX_UI/` **ya es React** con el lenguaje visual completo. El brief §37 prohíbe rediseñar: reutilizar los componentes `Pro*` es el camino de menor riesgo y menor coste |
| **Backend** | **Kotlin + Ktor** | Node/TypeScript | Comparte vocabulario de dominio con el APK (`ShareScopeEntry`, `ConsentRecord`, `AttentionAssessment`) y permite reutilizar `kotlinx.serialization` en el contrato `PR-003` |
| **Persistencia** | PostgreSQL + almacén de objetos | — | Trazabilidad y auditoría (`PR-018`) exigen consultas relacionales; los reportes agregados (`PR-017`) también |
| **LLM** | Proveedor externo con **cláusula de no-reentrenamiento** | modelo local | Decisión D3. El acuerdo contractual es tarea de `PR-005`, no de este documento |

> **Nota de honestidad:** el stack del backend es una decisión de ingeniería que podría tomarse
> al revés (todo TypeScript) sin romper nada del plan. La propuesta prioriza **reutilizar el
> vocabulario del dominio ya modelado** sobre la uniformidad de lenguaje. Si A o B prefieren
> un solo lenguaje, este documento se enmienda antes de `PR-004`.

---

## 4. Resolución propuesta de `P10` (web / tablet / ambos)

El brief §34 pide *desktop-first*; `ProSidebar.tsx` es una barra lateral de escritorio;
`PLAN-PUENTE-RED.md` §6 P10 lo deja abierto.

**Propuesta:** **web responsive, desktop-first**, con un ancho mínimo soportado de **1024 px**.
No se construye app nativa de tablet en el MVP.

**Por qué:** el caso de uso real (un psicólogo revisando cola de alertas, una ficha de 7
secciones y un observatorio) es de escritorio. Un panel en móvil obligaría a rediseñar la
navegación y a recortar densidad de información, que es exactamente lo que el brief §34 pide
**no** hacer.

**Consecuencia sobre `PR-010`:** la autenticación profesional se especifica para navegador;
sin biometría, sin sesión de dispositivo.

---

## 5. Mapa de propiedad de archivos (Agente C)

C es dueño exclusivo de todo lo que esté bajo `puente-red/`. C **no toca** nada del APK.

| Ruta | Dueño |
|---|---|
| `puente-red/portal/**` | **C** |
| `puente-red/backend/**` | **C** |
| `puente-red/deliverables/**` | **C** |
| `puente-joven-android/**` | **A y B** — C solo lee |
| `core/designsystem/**` | congelado (A). C **no** lo reutiliza: el portal tiene su propio lenguaje (brief §34) |
| `settings.gradle.kts`, `app/build.gradle.kts`, `PuenteJovenNavHost.kt`, `Repositories.kt`, `LocalPuenteRepository.kt` | **A** — C nunca los edita |

**Nota sobre el design system:** el brief §34 dice que ambos productos *"deben compartir marca,
colores, tipografía y lenguaje visual, pero NO la misma estructura"*. C extrae los tokens
(color, tipografía, espaciado) del prototipo a `puente-red/portal/src/design/tokens` y **no**
importa `:core:designsystem`, que es Android/Compose y además está congelado.

---

## 6. Declaración de necesidades a A

<!-- puente-red/deliverables/PR-000/NECESIDADES.md -->

## Contratos de A que C consume (bloqueantes)

| Necesidad | Tarea de A | Bloquea a C |
|---|---|---|
| Plantilla de spec definitiva | `TASK-000` | forma de las 18 specs de C |
| Contrato de integración (5 archivos + mecanismo de declaración) | `TASK-00A` | cómo C declara y cómo A integra |
| **Contrato de datos Joven ↔ Red, versionado** | `PR-003` | `PR-004`, `PR-020` |
| Ingesta del reporte y **emisión de `caseToken`** + tabla de correspondencia con auditoría | `PR-004` | todo el backend de C |
| Modelo de amenaza de privacidad (contexto de divorcio) | `TASK-021` | qué se guarda y qué se comparte (`PR-018`) |
| Multi-perfil | `TASK-025` | el vínculo `caseToken ↔ ProfileId` asume 1 perfil por instalación hoy |

## Cambios que C pide a A en archivos de A

**Ninguno por ahora.** Toda la Fase 0 de C son documentos. Si `PR-003` acaba exigiendo un tipo
nuevo en `:core:model`, C lo declarará aquí y **no** lo editará.

---

## 7. Guardrails vinculantes para todo `puente-red/`

Heredados de `PLAN-PUENTE-RED.md` §7 y `PR-001-PROTOCOLO-DE-CRISIS.md` §2:

1. Verde/amarillo/rojo es **prioridad preliminar de revisión**, nunca diagnóstico. La ficha
   profesional repite el encuadre.
2. **La IA no diagnostica ni decide sola.** El LLM propone; el psicólogo **acepta**. Ese acto
   es la validación humana obligatoria.
3. El joven **nunca** ve la identidad del profesional; el profesional **nunca** ve la identidad
   del joven salvo decisión explícita en `P3`.
4. **Las notas internas profesionales no llegan al joven** (brief §25).
5. **El chat completo nunca entra en el reporte.** Solo lo autorizado.
6. **El rojo lo determinan reglas, nunca el LLM** (D2). El LLM solo puede subir categoría.
7. Toda decisión de prioridad es **trazable**: `rulesetVersion` en el APK, `modelVersion` +
   `promptVersion` en el backend.
8. **No se recomiendan tratamientos farmacológicos** (resumen §5).
9. **Todo acceso a un caso queda auditado**: quién vio qué y cuándo (`PR-018`).

---

## 8. Preguntas abiertas que este documento NO puede cerrar

| # | Pregunta | Bloquea | Quién |
|---|---|---|---|
| P7 | ¿Cuántos profesionales reales hay detrás del piloto? | `PR-007`, `PR-008` | ONG |
| P8 | ¿Existe guardia 24/7 o el servicio tiene horario? | `PR-009`, cobertura del rojo | ONG |
| P9 | ¿Qué ocurre con un caso ALTO fuera de horario? | `PR-009` | clínico |
| Q12 | ¿Con quién se contrata el LLM y bajo qué acuerdo de no-reentrenamiento? | `PR-005` | ONG / legal |
| P11 | ¿Quién es el responsable legal del tratamiento de datos de menores en Bolivia? | `PR-018` | legal |
| P12 | ¿La revocación elimina lo que el profesional ya leyó? | `PR-019` | legal |
| Q8 | ¿La ONG es el único operador del panel? | `PR-010`, `PR-018` | ONG |

---

## 9. Orden de las 18 specs

| Orden | Spec | Ola | Depende de |
|---|---|---|---|
| 1 | `PR-005` Clasificador LLM | R1 | `PR-001` §5–6 |
| 2 | `PR-006` Extracción de características | R1 | `PR-001` §5–6 |
| 3 | `PR-007` Directorio de profesionales | R1 | `PR-001` §7 |
| 4 | `PR-008` Motor de derivación escalonado | R1 | `PR-006`, `PR-007` |
| 5 | `PR-009` Cola de asignación, SLA y trazabilidad | R1 | `PR-008` |
| 6 | `PR-010` Autenticación profesional y roles | R2 | `PR-000` §4 |
| 7 | `PR-011` Home profesional | R2 | `PR-009`, `PR-012` |
| 8 | `PR-012` Centro de alertas | R2 | `PR-009` |
| 9 | `PR-013` Ficha de caso (7 secciones) | R2 | `PR-014` |
| 10 | `PR-014` Separación «organizado por Puente» / «valoración profesional» | R2 | — |
| 11 | `PR-015` Timeline y seguimiento | R2 | `PR-013` |
| 12 | `PR-016` Derivaciones | R2 | `PR-008`, `PR-013` |
| 13 | `PR-017` Observatorio y reportes agregados | R2 | `PR-012`, `PR-015` |
| 14 | `PR-018` Auditoría y cumplimiento | R3 | `PR-010` |
| 15 | `PR-019` Consentimiento y revocación cross-producto | R3 | `PR-003` |
| 16 | `PR-020` Pruebas de contrato entre productos | R3 | `PR-003`, todo lo anterior |
| 17 | `TASK-019` Apoyo humano breve telefónico | R3 | `PR-001` §7 |
| 18 | `TASK-020` Marco de evaluación de 7 dimensiones | R3 | `PR-017`, `PR-018` |

---

## 10. Fuera del alcance de C

- Todo el APK juvenil (A y B).
- La firma clínica de `PR-001` (persona).
- El co-diseño con adolescentes, `TASK-022` (persona / ONG).
- La decisión sobre el proveedor del LLM (ONG / legal, aunque C redacta el requisito).
