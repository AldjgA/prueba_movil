# Plan de 3 agentes — Puente Joven

**Fecha:** 2026-09-29
**Distribuye:** las 46 tareas de `PLAN-TRABAJO-SDD.md` (26 juveniles) y `PLAN-PUENTE-RED.md` (20)
**Base:** decisiones cerradas el 2026-09-29

---

## 0. Advertencia honesta antes de empezar

Tres agentes para 46 tareas es **ajustado**. El proyecto tiene **dos productos** y una
**Ola 0 que bloquea todo**. Este reparto es el que mejor aprovecha tres agentes, pero conviene
saber dónde aprieta:

- **El Agente A es el cuello de botella.** Nadie puede construir nada hasta que publique el
  contrato de integración y la persistencia.
- **B y C no se reparten entre sí**: cada uno recorre su cola **en secuencia**. La ganancia de
  paralelismo es ×3, no ×18.
- Si más adelante se puede añadir un cuarto agente, **el mejor sitio es partir el Agente B**,
  que es el más cargado en complejidad de UI.

---

## 1. Los tres agentes

| Agente | Rol | Tareas | Por qué este rol |
|---|---|---|---|
| **A — Núcleo y contratos** | Integrador, dueño de la capa de datos y de los archivos compartidos | 13 | Es el único que puede tocar los ficheros que todos necesitan. Si dos agentes los tocan, hay conflicto garantizado |
| **B — APK juvenil** | Toda la experiencia del adolescente | 14 | Es un producto coherente: un solo relato, una sola voz |
| **C — Portal profesional** | Puente Red completo | 18 | Es el otro producto. Comparte marca, no estructura |

---

## 2. Reglas de convivencia (no negociables)

### 2.1 Un worktree por agente

**No es opcional.** El informe del propio equipo documenta que varios procesos Gradle
concurrentes sobre el mismo workspace provocaban `NoSuchFileException` en KSP y
*"Unable to delete directory … files open"*.

```bash
git worktree add ../pj-agenteA -b agente/A-nucleo
git worktree add ../pj-agenteB -b agente/B-juvenil
git worktree add ../pj-agenteC -b agente/C-red
```

**Cada agente compila solo en su worktree.** Nunca dos `gradlew` sobre el mismo checkout.

### 2.2 Propiedad exclusiva de archivos

| Archivo | Dueño |
|---|---|
| `settings.gradle.kts` | **A** |
| `app/build.gradle.kts` | **A** |
| `PuenteJovenNavHost.kt` | **A** |
| `feature/home/HomeScreen.kt` | **A** |
| `core/data/repository/Repositories.kt` | **A** |
| `core/data/local/LocalPuenteRepository.kt` | **A** |
| `core/designsystem/**` | **congelado** |
| `feature/<tu-módulo>/**` | el agente que lo creó |

### 2.3 Declaración de necesidades

Ningún agente edita los archivos de A. Cuando necesita algo, lo **declara**:

```markdown
<!-- deliverables/<TASK-ID>/NECESIDADES.md -->
## Módulo nuevo
:feature:conversation

## Ruta nueva en el NavHost
ConversationRoute → ConversationScreen(navigator)

## Enlace desde Home
Tarjeta "Me está pasando algo" → ConversationRoute

## Métodos de repositorio
(nuevos o existentes que consume)
```

A los aplica, y avisa cuando está listo. **A es el único que hace merge.**

### 2.4 Congelaciones

- `Repositories.kt`: cambios solo por solicitud escrita.
- `core/designsystem/**`: si falta un componente, se pide. No se improvisa uno nuevo.
- Nada de `:core:network` en el APK juvenil. `ModuleGraphGuardTest` falla a propósito.

---

## 3. Fase 0 — Especificación (bloqueante, los 3 en paralelo)

En SDD **primero se escribe la spec**. Y aquí hay una ventaja: cada agente redacta las specs
de las tareas que va a implementar, y **los otros dos las revisan**.

| Paso | Quién | Qué |
|---|---|---|
| 0.1 | **A** | Plantilla de spec + `TASK-00A` (contrato de integración) |
| 0.2 | **A, B, C** | Cada uno redacta las specs de sus propias tareas |
| 0.3 | **A** | Revisa las specs de B y C |
| 0.4 | **B y C** | Revisan las specs de A |
| 0.5 | **A** | Publica el contrato de integración → **desbloquea la Fase 1** |

**Nadie construye hasta que su spec está aprobada por otro agente.** Es la regla que hace que
esto sea SDD y no solo un plan de tareas.

**Salida de la Fase 0:** 46 specs + el contrato de integración.

---

## 4. Fase 1 — Construcción en tres flujos paralelos

### 4.1 Secuencia interna de cada flujo

Cada agente recorre su cola **en el orden indicado**, porque las dependencias van hacia abajo.

---

### AGENTE A — Núcleo, contratos e integración (13 tareas)

| Orden | Tarea | Por qué en esta posición |
|---|---|---|
| 1 | `TASK-000` Plantilla SDD + revisión de specs | Desbloquea a B y C |
| 2 | `TASK-00A` Contrato de integración | **Desbloquea todo lo demás** |
| 3 | `TASK-021` Modelo de amenaza de privacidad | Condiciona qué se guarda y qué se comparte |
| 4 | `TASK-003b` Persistencia local (DataStore) | Sin esto, ninguna feature es demostrable |
| 5 | `TASK-025` Multi-perfil | Cierra el fallo de privacidad en dispositivos compartidos |
| 6 | `PR-001` Protocolo de crisis *(borrador)* | La firma es humana; A entrega el texto |
| 7 | `PR-002` Modelo de identidad y anonimato | Ya está resuelto en diseño (§2.5 del plan Red) |
| 8 | `PR-003` Contrato de datos Joven ↔ Red | **Dependencia crítica entre los dos productos** |
| 9 | `PR-004` Ingesta y emisión de `caseToken` | Primer servicio real del backend |
| 10 | `TASK-023` Auditoría de consultas | Requisito legal del resumen |
| 11 | `TASK-013` Backend y contratos remotos | Cierra el borde del APK |
| 12 | `TASK-014` CI y calidad | Protege todo lo construido |
| 13 | `TASK-012` Integración narrativa end-to-end | **Última**: necesita a B y C terminados |

---

### AGENTE B — APK juvenil (14 tareas)

| Orden | Tarea | Módulo |
|---|---|---|
| 1 | `TASK-004` Conversación + chequeo contextual | `feature:conversation` |
| 2 | `TASK-005` Señales + mapa + nivel de atención | `feature:signals` |
| 3 | `TASK-006a` Herramientas: sueño · respiración · plan de apoyo | `feature:tools` |
| 4 | `TASK-006b` Reporte personal + recorrido | `feature:report` |
| 5 | `TASK-007` Consentimiento + resumen + solicitud de apoyo | `feature:sharing` |
| 6 | `TASK-008` Ruta B «Quiero ayudar a alguien» | `feature:help` |
| 7 | `TASK-009` Perfil y privacidad | `feature:profile` |
| 8 | `TASK-010` Próximos pasos | `feature:nextsteps` |
| 9 | `TASK-011` Derivación y directorio | `feature:referral` |
| 10 | `TASK-015` Paquete de alerta roja | `feature:signals` |
| 11 | `TASK-016` Estado del caso rojo | `feature:sharing` |
| 12 | `TASK-017` Registro de eventos adversos | transversal |
| 13 | `TASK-018` Suite de prueba de seguridad | calidad |
| 14 | `TASK-024` Canal de audio | transversal |

**Nota:** B también implementa la barra de 5 pestañas (decisión P3) y los 3 módulos TCC
(decisión Q5).

---

### AGENTE C — Portal profesional / Puente Red (18 tareas)

| Orden | Tarea |
|---|---|
| 1 | `PR-005` Clasificador LLM (medio/alto, versionado) |
| 2 | `PR-006` Extracción de características |
| 3 | `PR-007` Directorio de profesionales (dos tipos de respondedor) |
| 4 | `PR-008` Motor de derivación escalonado por gravedad |
| 5 | `PR-009` Cola de asignación, SLA y trazabilidad |
| 6 | `PR-010` Autenticación profesional y roles |
| 7 | `PR-011` Home profesional |
| 8 | `PR-012` Centro de alertas |
| 9 | `PR-013` Ficha de caso (7 secciones) |
| 10 | `PR-014` Separación «organizado por Puente» / «valoración profesional» |
| 11 | `PR-015` Timeline y seguimiento |
| 12 | `PR-016` Derivaciones |
| 13 | `PR-017` Observatorio y reportes agregados |
| 14 | `PR-018` Auditoría y cumplimiento |
| 15 | `PR-019` Consentimiento y revocación cross-producto |
| 16 | `PR-020` Pruebas de contrato entre productos |
| 17 | `TASK-019` Apoyo humano breve telefónico |
| 18 | `TASK-020` Marco de evaluación de 7 dimensiones |

**Referencia visual:** las 8 pantallas `Pro*` del prototipo web.

---

## 5. Puntos de sincronización

| # | Cuándo | Qué desbloquea | Quién avisa |
|---|---|---|---|
| **S1** | Contrato de integración publicado | B y C empiezan a construir | A |
| **S2** | Persistencia lista | Las features de B son demostrables | A |
| **S3** | `PR-003` contrato Joven↔Red | C puede integrar con B | A |
| **S4** | B y C terminan sus colas | A hace la integración narrativa | B y C |
| **S5** | Todo integrado | `TASK-018` suite de seguridad | A |

**Regla de sincronización:** A publica en `main`; B y C rebasan sus ramas sobre `main`
integrado. **Nunca al revés.**

---

## 6. Fuera del alcance de los agentes

Estas dos cosas **no se delegan a un agente**, porque necesitan personas:

| Tarea | Quién |
|---|---|
| **`TASK-022` Co-diseño con adolescentes** | La ONG con el comité de adolescentes |
| **Firma clínica de `PR-001`** | Un psicólogo responsable |

Los agentes entregan los documentos; las personas los validan.

---

## 7. Resumen de asignación

| Agente | Tareas | Módulos nuevos que crea |
|---|---|---|
| **A** | 13 | `:core:network` |
| **B** | 14 | `feature:conversation`, `signals`, `tools`, `report`, `sharing`, `help`, `profile`, `nextsteps`, `referral` |
| **C** | 18 | portal profesional completo |
| **Personas** | 1 | — |
| **Total** | **46** | |

---

## 8. Los cinco riesgos que hay que vigilar

| # | Riesgo | Mitigación |
|---|---|---|
| 1 | **A se convierte en cuello de botella** | A prioriza `TASK-00A` y `TASK-003b` antes que nada. B y C no esperan a que A termine todo |
| 2 | **B y C tocan los archivos de A** | La regla de declaración (§2.3) es la única vía. Un merge directo rompe el modelo |
| 3 | **Builds concurrentes** | Un worktree por agente, y compilación serializada |
| 4 | **El relato se rompe entre módulos** | `TASK-012` (A) valida la secuencia completa al final. Sin ella, salen piezas sueltas |
| 5 | **`PR-001` sin firmar** | Bloquea `TASK-005`, `TASK-007` y `PR-005`. Hay que empujarlo en paralelo desde el día uno |

---

## 9. Primera acción concreta de cada agente

| Agente | Mañana |
|---|---|
| **A** | Escribir la plantilla de spec y el contrato de integración (`TASK-00A`) |
| **B** | Redactar las specs de `TASK-004` a `TASK-018` según la plantilla de A |
| **C** | Redactar las specs de `PR-005` a `PR-020` según la plantilla de A |
