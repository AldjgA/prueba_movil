# Plan de trabajo SDD — Puente Red

**Fecha:** 2026-09-29
**Alcance:** portal profesional, backend de triaje y derivación
**Relación:** producto hermano de `puente-joven-android`. Ver `puente-joven-android/deliverables/PLAN-TRABAJO-SDD.md`
**Estado:** propuesta para revisión. Nace del protocolo de alerta roja decidido el 2026-09-29.
**Actualizado:** 2026-09-30 — guardrails revisados según `PR-003`. El APK juvenil deja de ser
"sin red" (habla con la **API Joven** del backend compartido); el contrato Joven↔Red vive en `PR-003`.

---

## 0. Por qué existe este documento

Puente Red estaba **declarado fuera de alcance** por guardrail #6
(*"La app Android solo contiene Puente Joven. Ninguna pantalla referencia ni navega a un
panel profesional"*), y `BACKEND_INTEGRATION.md` listaba sus decisiones como **DIFERIDAS**.

La decisión del protocolo de alerta roja lo convierte en **necesario para que el MVP juvenil
tenga sentido**: sin alguien al otro lado que reciba, clasifique y derive, el nivel rojo no
es más que un color.

Este documento planifica ese segundo producto. **El APK juvenil cambia (2026-09-30):** deja de
ser "sin red" y habla con la **API Joven** del backend compartido (ver `PR-003` §10); sigue sin
conocer ni navegar al panel profesional.

---

## 1. Flujo decidido (2026-09-29)

```
JOVEN (APK)                         PUENTE RED
─────────────                       ──────────────────────────────────
prioridad preliminar = ROJA
        │
        ├─► genera paquete de alerta
        │   (reporte SIN identidad)
        │
        └──────────►  ingesta del reporte
                              │
                              ├─► LLM clasifica: MEDIO | ALTO
                              │
                              ├─► extracción de características
                              │
                              ├─► motor de derivación
                              │   (empareja con el psicólogo adecuado)
                              │
                              └─► el psicólogo ACEPTA el caso
                                        │
                                        └─► coordina con el paciente
                                                    │
JOVEN (APK) ◄───────────────────────  estado del caso
   muestra el estado; tras la aceptación, los datos del psicólogo (nunca su identidad privada)
```

---

## 2. Modelo de identidad y anonimato

### 2.1 Lo decidido

- El joven se identifica con un **`ProfileId` opaco**; alias + PIN son solo **desbloqueo local**.
  **La MAC no se usa** (§2.2).
- El reporte que ve el profesional **no contiene información de identificación**: solo el
  reporte anónimo.
- El psicólogo, en Puente Red, **acepta** el caso y **coordina** con el paciente a través de la
  app — **solo si decide comunicarse** (`PR-003` §6).

### 2.2 Problema bloqueante: la MAC del dispositivo no se puede usar

Esto **no es una preferencia de diseño, es una imposibilidad técnica**:

| Vía | Comportamiento real |
|---|---|
| `WifiInfo.getMacAddress()` | Deprecada en API 23. Desde API 23 devuelve el valor fijo `02:00:00:00:00:00` |
| `NetworkInterface.getHardwareAddress()` | Devuelve `null` para apps sin root desde API 24 |
| `ACCESS_FINE_LOCATION` | Necesario en versiones antiguas y **aun así no entrega la MAC real** |

Además, tres problemas de fondo:

1. **Es dato personal.** La MAC es un identificador hardware persistente; tratarla como
   identificador de menores es un riesgo legal, no solo técnico.
2. **Es falsificable.** MAC spoofing es trivial.
3. **Es inestable.** Android 10+ usa MAC aleatoria por red por defecto.

### 2.3 Sustituto recomendado

| Necesidad | Mecanismo correcto | Por qué |
|---|---|---|
| Identificar al joven en su dispositivo | `ProfileId` opaco (ya existe en `:core:model`) | Ya está modelado; es opaco por diseño |
| Atar la sesión al dispositivo | **UUID generado en el primer arranque, guardado en `SecureLocalStore`** (ya existe, cifrado con Keystore) | Sin permisos, sin PII, se destruye con `deleteAllLocalContent()` |
| Señal de dispositivo si hiciera falta | `Settings.Secure.ANDROID_ID` | Estable por app+firma+usuario, sin permisos. Se resetea al reinstalar |
| Vínculo joven ↔ caso en el backend | `caseToken` emitido por el servidor, **distinto** del `ProfileId` | Permite coordinar sin exponer identidad |
| Autenticación del joven | Alias + PIN (ya implementado, PBKDF2) | El proyecto usa PIN, no contraseña. Ver §6 P1 |

**Regla derivada:** el backend **nunca** debe recibir el `ProfileId` junto al contenido del
reporte. Recibe el `caseToken`; la correspondencia vive en una tabla separada con acceso
restringido. Así "anónimo para el profesional" es verificable, no una promesa.

### 2.4 La contradicción, resuelta (2026-09-30)

> **Resuelto en `PR-003` §6–§7:** el canal de retorno es **mensajería in-app** (opción A), y se
> abre **solo si el psicólogo decide comunicarse** (R1). El joven permanece seudónimo. Se
> conserva el análisis de opciones que sigue, por trazabilidad.

*"Reporte anónimo"* y *"el psicólogo coordina con el paciente"* exigen un **canal de retorno**.
Sin él, coordinar es imposible. Las opciones reales:

| Opción | Cómo funciona | Coste |
|---|---|---|
| **A. Seudónimo con canal** | El profesional no ve identidad; escribe en el caso; el joven lo lee en la app | Reutiliza `SupportRequest` (ya existe) |
| **B. Anónimo real** | El joven nunca sabe nada más | Rompe "Mi recorrido" y contradice la coordinación |
| **C. Identidad revelada al aceptar** | El psicólogo ve el alias al aceptar el caso | Deja de ser anónimo, pero hace la coordinación trivial |

**Recomendación: opción A**, reutilizando el contrato que ya existe. Inventar un segundo
mecanismo de compartición rompería la invariante `consent.scope ⊆ summary.scope` que el
proyecto protege con pruebas (`LocalContentEncryptionTest`, `ShareScope.kt`).

### 2.5 Resuelto el 2026-09-29: por qué se pedía la MAC

El requisito real era: *"puede ser que existan personas con el mismo nombre y clave"*. El
problema **no era el dispositivo** — era que alias y PIN se estaban tratando como identidad.

**La MAC no resolvía nada y además no se puede leer** (§2.2). La solución es la que el propio
código ya insinúa: `YouthAlias` es un tipo distinto de `ProfileId` precisamente para que nadie
los confunda.

| Necesidad | Mecanismo definitivo |
|---|---|
| Identidad única de la persona | `ProfileId` opaco (UUID) |
| Desbloqueo local en el dispositivo | Alias + PIN (comodidad, **no** identidad) |
| Vínculo reporte ↔ persona | `caseToken`; la tabla `caseToken ↔ ProfileId` vive aparte, con acceso restringido y auditoría |

Dos adolescentes con el mismo alias y el mismo PIN **son personas distintas**. El alias no
entra nunca en el reporte, así que la desambiguación ocurre en el backend por `caseToken`, no
por nombre.

**Lo que esto cambia en este plan:**
- `PR-002` queda **desbloqueado**.
- `PR-004` (ingesta) debe emitir el `caseToken` y mantener la tabla de correspondencia con
  auditoría.
- **Hallazgo nuevo:** el APK soporta un solo perfil por instalación. En un piloto con
  dispositivos compartidos (hermanos, laboratorio escolar, centro comunitario) eso es un fallo
  de privacidad. Se añade `TASK-025` (multi-perfil) al plan juvenil, en Ola 1.

---

## 3. Pipeline de clasificación y derivación

### 3.1 Decidido

- El reporte lo revisa **un LLM con una metodología**, que lo clasifica en **dos categorías:
  medio y alto**.
- Después se **identifican características**.
- Se **deriva al psicólogo más apropiado** para esas características.

### 3.2 Tensión con el guardrail #3

El guardrail dice *"La IA NO diagnostica. La IA NO sustituye al psicólogo."*

Un LLM que clasifica en medio/alto desde texto libre es **triaje automático**. No es
necesariamente incompatible —priorizar no es diagnosticar— pero exige cerrar por escrito:

1. **Qué significa exactamente "medio" y "alto"** (¿urgencia? ¿complejidad? ¿riesgo?).
2. **Qué NO puede hacer el LLM**: no diagnostica, no decide sola una derivación, no cierra
   un caso, no se comunica con el joven.
3. **Quién responde si el LLM falla**, tarda o da un resultado absurdo.
4. **Trazabilidad**: el proyecto ya exige `rulesetVersion` en `AttentionAssessment`. El
   clasificador necesita el equivalente: `modelVersion` + `promptVersion` en cada resultado.
5. **Punto humano obligatorio**: el psicólogo **acepta** el caso. Ese acto es la validación
   humana que el guardrail exige. El LLM propone, la persona decide.

### 3.3 "El más apropiado" no está definido

Emparejar caso ↔ profesional exige un modelo de perfil:

- especialidad (trauma, duelo, bullying, familia, adicciones)
- franja de edad que atiende
- carga actual (casos abiertos) y disponibilidad
- idioma y zona geográfica (La Paz)
- criterios de equidad (que la carga no se concentre en dos personas)

Sin esto, "el más apropiado" es una caja negra. Es una decisión de producto y gobernanza.

---

## 4. Contrato entre los dos productos

Este es el punto más delicado del proyecto: **es la frontera entre dos aplicaciones que no
deben conocerse.**

| Elemento | Joven (APK) | Puente Red |
|---|---|---|
| Permisos de red | **Ninguno** (guardrail) | Sí |
| Conoce la existencia del otro | **No** (solo ve "tu caso") | Sí, recibe de él |
| Identidad del joven | `ProfileId` + alias local | Solo `caseToken` |
| Contenido del reporte | Lo genera desde el chat cifrado | Lo recibe ya anonimizado |
| Consentimiento | `ConsentRecord` + `ShareableSummary` | Lo consume, no lo crea |

**Regla de oro:** el contrato se define **una vez** y se versiona en `PR-003`. El APK juvenil
habla **solo** con la **API Joven** (no con el panel profesional), así que la separación se
garantiza por contrato y por superficie de API, no por ausencia de red.

---

## 5. Tareas propuestas

### Ola R0 — Gobernanza y especificación (bloqueante)

| ID | Tarea | Entregable |
|---|---|---|
| **PR-001** | **Especificación y validación clínica del protocolo de crisis** | Documento firmado: qué es medio/alto, qué puede y qué no puede hacer el LLM, quién responde, SLAs |
| **PR-002** | **Modelo de identidad, anonimato y seudonimato** | Resuelve §2.4 y sustituye la MAC (§2.3) |
| **PR-003** | **Contrato de datos Joven ↔ Red** | Esquema versionado del paquete de alerta y del estado de caso |

### Ola R1 — Backend (paralelizable)

| ID | Tarea | Depende de |
|---|---|---|
| **PR-004** | Ingesta del reporte y emisión de `caseToken` | PR-002, PR-003 |
| **PR-005** | Servicio de clasificación con LLM (metodología, medio/alto, versionado) | PR-001 |
| **PR-006** | Extracción de características del caso | PR-001 |
| **PR-007** | Directorio de profesionales y modelo de perfil | PR-001 |
| **PR-008** | Motor de derivación y criterios de equidad | PR-006, PR-007 |
| **PR-009** | Cola de asignación, SLA y trazabilidad | PR-008 |

### Ola R2 — Portal profesional (paralelizable)

Referencia visual: las 8 pantallas `Pro*` del prototipo web
(`ProLoginScreen`, `ProWorkspaceScreen`, `ProAlertsScreen`, `ProCaseScreen`,
`ProTimelineScreen`, `ProCaseFichaScreen`, `ProVisualizationsScreen`, `ObservatoryScreen`).

| ID | Tarea |
|---|---|
| **PR-010** | Autenticación profesional y roles (psicología, trabajo social, orientación, supervisión) |
| **PR-011** | Home profesional: "¿Qué necesita nuestra atención ahora?" |
| **PR-012** | Centro de alertas con priorización y filtros |
| **PR-013** | Ficha de caso estructurada (7 secciones del brief §24) |
| **PR-014** | Separación explícita "organizado por Puente" vs "valoración profesional" (brief §25) |
| **PR-015** | Timeline operacional y seguimiento |
| **PR-016** | Módulo de derivaciones con estados |
| **PR-017** | Observatorio y reportes agregados (brief §29–30) |

### Ola R3 — Transversal

| ID | Tarea |
|---|---|
| **PR-018** | Auditoría, trazabilidad y cumplimiento (quién vio qué y cuándo) |
| **PR-019** | Consentimiento y revocación cross-producto |
| **PR-020** | Pruebas de contrato entre los dos productos |

**Total: 20 tareas**, con **11 paralelizables** en las olas R1 y R2.

---

## 6. Preguntas abiertas

| # | Pregunta | Bloquea |
|---|---|---|
| **P1** | El joven se autentica con **PIN** (implementado), no con contraseña. ¿Se cambia a contraseña o se mantiene el PIN? | PR-002 |
| **P2** | La MAC es inviable (§2.2). ¿Se acepta el sustituto propuesto (UUID local + `caseToken`) o hay otro requisito detrás del que no soy consciente? | PR-002, PR-003 |
| **P3** | ¿Seudónimo con canal (A), anónimo real (B) o identidad revelada al aceptar (C)? Ver §2.4 | PR-002, PR-011 |
| **P4** | ¿"Medio" y "alto" significan urgencia, complejidad o riesgo? | PR-001, PR-005 |
| **P5** | ¿Quién responde si el LLM clasifica mal? ¿Hay revisión humana previa a la derivación? | PR-001 |
| **P6** | ¿Qué significa "el psicólogo más apropiado"? ¿Qué atributos pesan? | PR-007, PR-008 |
| **P7** | ¿Cuántos psicólogos reales hay detrás del piloto? Un motor de derivación para 2 personas no tiene sentido | PR-007 |
| **P8** | ¿Existe un equipo de guardia 24/7 o el servicio tiene horario? Determina si el nivel rojo puede prometer algo | PR-001, PR-009 |
| **P9** | ¿Qué ocurre con un caso ALTO fuera de horario? | PR-001, PR-009 |
| **P10** | ¿Puente Red es web, tablet o ambos? El brief dice "desktop-first"; `ProSidebar.tsx` es de escritorio | PR-010 |
| **P11** | ¿Quién es el responsable legal del tratamiento de datos de menores en Bolivia? | PR-018 |
| **P12** | ¿La revocación del joven puede eliminar lo que un profesional ya leyó? El brief §17 y `RevocationReason` ya distinguen "bloquear futuros accesos" de "borrar" | PR-019 |

---

## 7. Guardrails que este producto debe respetar

1. **Verde/amarillo/rojo es prioridad preliminar de revisión, nunca diagnóstico.** Aplica
   igual en el panel profesional: la ficha debe repetir el encuadre.
2. **La IA no diagnostica ni decide sola.** El LLM propone; el psicólogo acepta. Ese acto
   es la validación humana obligatoria.
3. **El joven ve los datos del profesional solo desde la aceptación**, y **solo si el psicólogo
   decide comunicarse** obtiene un canal de contacto (R1/R5 de `PR-003`). El profesional **nunca**
   ve la identidad del joven: este permanece **seudónimo**.
4. **Las notas internas profesionales no llegan al joven** (brief §25).
5. **El chat completo nunca entra en el reporte.** Solo lo autorizado por el joven.
6. **Ningún contrato de Puente Red se compila en el APK juvenil.**

---

## 8. Decisiones cerradas el 2026-09-29

Ver `COMPARACION-PLAN-VS-RESUMEN-EJECUTIVO.md` para el análisis completo.

| # | Decisión | Impacto en este plan |
|---|---|---|
| **D1** | **Dos capas de clasificación**: 3 niveles (verde/amarillo/rojo) en el APK por reglas; 2 categorías (medio/alto) aquí, por LLM | `PR-005` implementa la reclasificación. La entrada ya viene con nivel del APK |
| **D2** | **El LLM solo puede subir de categoría; nunca bajar un rojo** | Regla dura en `PR-005`. Un caso que llega como rojo entra como alto y no puede ser degradado |
| **D3** | **Se usa IA generativa** con cláusula de **no-reentrenamiento** sobre datos de menores | `PR-005` incluye el acuerdo con el proveedor y la política de retención de prompts |
| **D4** | **El MVP incluye panel de supervisores y directorio de derivación** | **`PR-011`–`PR-017` suben de ola: entran en el MVP, no después.** El nivel rojo necesita destinatario desde el día uno |
| **D5** | **Respuesta escalonada por gravedad**: personal capacitado para amarillo/medio, psicólogo para rojo/alto | Rediseña `PR-007` (perfilado: hay dos tipos de respondedor) y `PR-008` (el motor enruta por gravedad **y** por tipo de respondedor) |

### 8.1 Reordenación de olas

Con D4, el MVP pasa a ser:

```
Ola R0  PR-001 PR-002 PR-003          (gobernanza y especificación)
Ola R1  PR-004 … PR-009               (backend: ingesta, LLM, derivación)
Ola R2  PR-010 … PR-017               ← MVP: portal completo
Ola R3  PR-018 PR-019 PR-020          (auditoría, consentimiento, contrato)
```

`PR-011`–`PR-017` ya no son "después del MVP": **son el MVP.** Sin panel, el sistema de
alertas no tiene dónde aterrizar, y sin directorio no hay a quién derivar.

### 8.2 Consecuencia sobre el orden de construcción

El plan juvenil y este ya no son secuenciales. `TASK-005` (nivel de atención) y `TASK-007`
(apoyo humano) producen datos que `PR-004` consume. Se pueden construir en paralelo **solo si
`PR-003` (contrato de datos Joven↔Red) se cierra antes**. Es la nueva dependencia crítica.

### 8.3 El modelo de identidad queda así (pendiente de `PR-002`)

```
Joven escribe  →  APK cifra local  →  reporte SIN identidad
                                            │
                                    caseToken (emitido por el backend)
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    │                                               │
        tabla de contenido (anónima)              tabla de correspondencia
        la ve el equipo                           caseToken ↔ ProfileId
                                                  acceso restringido + auditoría
                                            │
                                    el psicólogo ACEPTA el caso
                                            │
                                    coordina a través de la app
```

La MAC del dispositivo **no se usa** (§2.2). El vínculo se resuelve con `ProfileId` opaco más
un UUID local guardado en `SecureLocalStore`, y el backend solo ve el `caseToken`.
