# TASK-018 · Suite de prueba de seguridad con escenarios simulados

**Estado:** En revisión
**Autor:** Agente B — APK juvenil · **Revisor:** Agente A — Núcleo y contratos
**Fecha:** 2026-09-30
**Ola:** 2 · **Depende de:** toda la cola de B · **Bloquea:** —

> **Dueño según el plan: ambiguo.** `PLAN-3-AGENTES.md` §4.1 (fila 13) asigna esta tarea a **B**;
> §5 (**S5**) dice *"`TASK-018` suite de seguridad. **Quién avisa: A**"*. La propuesta de B
> (`REVISION-B.md` H3): **B la escribe** (es la única que conoce los 9 módulos), **A la dispara** en
> S5 sobre el árbol integrado. Necesita ratificación.

## 1. Contexto

`PLAN-TRABAJO-SDD` §10.1 la define como **criterio de avance**: *"Suite de prueba de seguridad con
escenarios simulados — **criterio de avance**"*. No es una tarea de calidad al final; es **la prueba
de que el producto se puede defender**.

Y `PR-001` §14 la sitúa como la que cierra sobre todo lo anterior: *"`TASK-018` (prueba de seguridad)
— depende de Todo lo anterior."*

**Lo que hace distinta a esta suite:** no prueba que el código funcione, prueba que **el sistema se
comporta bien cuando alguien intenta algo**. `REVISION-C.md` §2.5 lo formula mejor de lo que B podría
hacerlo, a propósito de `PR-020`:

> *"**Fixtures negativas por invariante**: «una invariante sin prueba negativa no está protegida». Es
> la forma correcta de probar una frontera de privacidad."*

**Esa frase es la especificación de esta tarea.** Cada invariante de privacidad del proyecto necesita
su **prueba negativa**: no «el resumen contiene lo autorizado», sino «el resumen **no puede** contener
lo no autorizado, y he intentado meterlo».

## 2. Alcance

### Dentro
- **Suite de pruebas** (unitaria + instrumentada) de los invariantes de seguridad y privacidad, con
  **fixtures negativas**.
- **Escenarios simulados** de los ataques que el modelo de amenaza identifica
  (`TASK-021`: **la familia con acceso físico** es el adversario principal).
- Cobertura obligatoria de **cada invariante** de `PR-003` §9, `PR-001` §2 (P1–P10) y `TASK-021`.
- **Escenarios de coacción del PIN**: `TASK-021` acepta que la coacción **no se resuelve barato**. La
  suite debe probar que **el sistema no empeora** la situación (no revela qué perfiles existen, no
  filtra si el alias existe, no acumula intentos visibles).
- **Escenarios de fallo del sistema** (`PR-001` §10): LLM no responde, resultado absurdo, sin red,
  clave perdida, pérdida del dispositivo.
- **Prueba del invariante D2**: *el LLM solo puede subir; nunca degradar un rojo*.

### Fuera
- La CI (`.github/workflows`) → `TASK-014` (A). Esta tarea **entrega las pruebas**; A las enchufa.
- Las pruebas de contrato entre productos → `PR-020` (C).
- La auditoría de consultas → `TASK-023` (A).
- Pruebas de rendimiento o de carga: el alcance es ≤5 usuarios (Q6).
- `core/designsystem/**` y los 7 archivos compartidos.

## 3. Módulo y propiedad

- Módulo: **transversal** — las pruebas viven **en el módulo que prueban**, no en un módulo nuevo.
  Motivo: una suite de seguridad que vive aparte prueba la API pública, no el comportamiento real.
  Excepción: los escenarios que cruzan módulos (p. ej. «familia con acceso físico») van en
  `app/src/test` o `app/src/androidTest`.
- Dueño: **B** (ver la nota de ambigüedad arriba).
- Compartidos que **declara**:
  1. `app/build.gradle.kts` → dependencias de test que falten (`androidx.test`, `turbine`, etc.), si
     alguna no está. **Las aplica A.**
  2. `settings.gradle.kts`, `PuenteJovenNavHost.kt`, `HomeScreen.kt`, `AppDestination.kt`,
     `Repositories.kt`, `LocalPuenteRepository.kt` → **sin cambios**.

## 4. Contratos de datos

**Consume:** todos. Esta tarea no añade contratos; **ejercita** los existentes con entradas hostiles.

**Métodos nuevos que necesita:** **ninguno.**

**Hallazgo que condiciona el alcance de la suite:** la suite de seguridad **no puede cubrir el
backend** desde el APK. `REVISION-C.md` **F2** ya lo detectó desde el otro lado: *"`ModuleGraphGuardTest`
no cubre el backend. Escanea `app/`, `core/`, `feature/` del APK; **no** `puente-red/`."* Esa mitad la
asume A en `TASK-014`. **La frontera queda así:**

| Mitad | Dueño | Qué prueba |
|---|---|---|
| APK juvenil | **B** (`TASK-018`) | Invariantes del APK: consentimiento, alcance, aislamiento entre perfiles, no-identidad, offline |
| Backend y portal | **A** (`TASK-014`) + **C** (`PR-020`) | Guarda de secretos, contratos entre productos, RLS |

## 5. Criterios de aceptación (verificables)

Cada criterio es un **escenario**, y cada escenario es una **prueba negativa**.

| # | Escenario (adversario) | Invariante que protege | Cómo se verifica |
|---|---|---|---|
| 1 | **El joven intenta consentir más de lo resumido** | `consent.scope ⊆ summary.scope` (`PR-003` §9.1) | unitaria: `recordConsent` con un elemento fuera ⇒ `UiError.Authorization`, **no** amplía |
| 2 | **El código intenta meter el chat en el resumen** | *"el chat completo nunca entra en el reporte"* (§9.2) | unitaria: no existe camino; prueba de que `ShareableSummary` no acepta `ConversationMessage` |
| 3 | **El código intenta meter el `ProfileId` en el paquete de alerta** | *"el `ProfileId` nunca viaja junto al contenido"* (§9.3) | unitaria: el tipo `AlertPackage` no tiene ese campo (prueba de compilación/tipo) |
| 4 | **El LLM devuelve `MEDIO` para un caso que el APK marcó `ROJO`** | *"el LLM no degrada un rojo"* (§9.4, D2) | unitaria: el resultado efectivo es `ALTO` |
| 5 | **Un perfil intenta leer el contenido de otro** (familia con acceso físico) | Multi-perfil (`TASK-025`) + `TASK-021` | unitaria: con 2 perfiles, cada uno ve solo lo suyo (conversación, señales, recorrido, registro) |
| 6 | **Alguien abre la pantalla de entrada y busca la lista de perfiles** | `TASK-021` §5.1 (*no revelar quién usa la app*) | instrumentada: el login **no** expone ningún alias existente |
| 7 | **Un atacante prueba un PIN incorrecto y observa el error** | `TASK-003`: *"error accesible sin filtrar detalles sensibles"* | unitaria: el error es idéntico para alias inexistente, PIN mal formado y PIN incorrecto |
| 8 | **Sin red, el joven llega a rojo** | *"el flujo rojo funciona offline"* (§9.8) | instrumentada: el paquete se encola y la emergencia se muestra |
| 9 | **El LLM no responde o tarda** | `PR-001` §10: *"el caso entra como alto por defecto"* | unitaria: sin respuesta del clasificador, la categoría efectiva es `ALTO` |
| 10 | **Se pierde la clave local** | F6: *"el contenido es irrecuperable por diseño; el reporte ya enviado no"* | unitaria: el contenido local falla limpiamente; el paquete ya generado no se corrompe |
| 11 | **El joven revoca y luego pide borrar todo** | `DECISIONES` §4.3: revocar ≠ borrar | unitaria: los dos caminos producen resultados distintos y el copy lo refleja |
| 12 | **Se intenta registrar contenido en el registro de eventos adversos** | `TASK-017` criterio #2 | unitaria: el tipo `AdverseEvent` no admite texto libre del joven |
| 13 | **El APK intenta hablar con un contrato profesional** | *"ningún contrato profesional se compila en el APK"* (§9.10) | `ModuleGraphGuardTest` (versión reescrita por `TASK-013`) |
| 14 | **Alguien busca secretos o endpoints en el árbol del APK** | Guardrails #5/#8 | `ModuleGraphGuardTest` + `grep` de `http://`, `https://`, `apiKey`, `token` |

**Criterio de la suite (meta):** cada invariante de `PR-003` §9, `PR-001` §2 y `TASK-021` tiene **al
menos una prueba negativa**. Si un invariante no la tiene, **no está protegido**.

## 6. Guardrails aplicables

Esta tarea **es** la verificación de los guardrails. En concreto:

| Fuente | Invariantes cubiertos |
|---|---|
| `PR-003` §9 | Los 10 (criterios #1–#4, #8, #13) |
| `PR-001` §2 (P1–P10) | P1, P2, P3 (criterio #4), P5, P6 (criterio #2), P7 (criterio #1) |
| `PR-001` §10 (fallos) | Criterios #9, #10 |
| `PR-001` §11 (eventos) | Criterio #12 |
| `TASK-021` (modelo de amenaza) | Criterios #5, #6, #7 |
| Guardrails #1, #4 | Criterios #4, #9 (la IA no diagnostica y no degrada) |
| Guardrails #5, #8 | Criterio #14 |

## 7. Referencia visual

**Ninguna.** Es una suite de pruebas. No produce pantallas ni componentes.

Si algún escenario necesita **verificación visual** (p. ej. el criterio #6), se hace con prueba
instrumentada sobre el árbol semántico, no con una captura manual.

## 8. Dependencias

- **Bloquea:** nada formalmente, pero es **criterio de avance** (`PLAN-TRABAJO-SDD` §10.1): sin ella
  verde, el proyecto no avanza de fase.
- **Bloqueado por:** **toda la cola de B** (`TASK-004`…`TASK-011`, `TASK-015`…`TASK-017`) y
  `TASK-013` (A, para el criterio #13).
- **Specs relacionadas:** `PR-020` (C, pruebas de contrato — la mitad de la frontera),
  `TASK-014` (A, CI + guarda de secretos del backend), `TASK-021`, `TASK-023` (A), `PR-001` §12.

## 9. Preguntas abiertas

| # | Pregunta | A quién | Impacto |
|---|---|---|---|
| **Q1** | **Dueño de la tarea** (H3 de `REVISION-B.md`): ¿B la escribe y A la dispara en S5? | A | Claridad de responsabilidad |
| Q2 | ¿Los escenarios viven en `app/src/test` (cruzan módulos) o cada módulo prueba los suyos? B propone **ambos**: lo específico en su módulo, los escenarios de adversario en `app/` | A | Organización |
| Q3 | El criterio #5 (aislamiento entre perfiles) necesita **dos perfiles con contenido** en la misma instalación. ¿Existe un helper de test para eso, o hay que construirlo? | A / B | Coste |
| Q4 | ¿La suite debe correr en **CI** (`.github/workflows`, `TASK-014`) en cada push, o solo en el punto de sincronización S5? | A | Frecuencia |
| Q5 | `PR-001` §12 incluye **«casos sin respuesta»** como la métrica más importante. ¿Cómo se prueba desde el APK si la respuesta la da el backend? Probablemente sea un escenario de `PR-020` (C), no de esta suite | A / C | Frontera |
| Q6 | ¿Se admite un escenario de **coacción del PIN** (el agresor obliga a desbloquear)? `TASK-021` acepta que no se resuelve barato, pero la suite debería **documentar** qué pasa, no ignorarlo | clínico / producto | Alcance |

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] **Q1 resuelta** por A
- [ ] Compila (`./gradlew assembleDemoDebug`)
- [ ] **Los 14 escenarios en verde**, cada uno como prueba negativa
- [ ] Cobertura verificada: **cada** invariante de `PR-003` §9, `PR-001` §2 y `TASK-021` tiene al
      menos una prueba negativa
- [ ] `NECESIDADES.md` entregado a A y aplicado
- [ ] Sin secretos ni endpoints hardcodeados (`ModuleGraphGuardTest`)
