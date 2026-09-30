# TASK-021 · Modelo de amenaza de privacidad

**Estado:** Borrador · **Autor:** Agente A — Núcleo y contratos · **Revisor:** (pendiente)
**Fecha:** 2026-09-30
**Ola:** 0 (bloqueante) · **Depende de:** — · **Bloquea:** `TASK-003b`, `TASK-025`, `TASK-007`, `PR-003`, `PR-019`

---

## 1. Contexto

El resumen ejecutivo identifica un riesgo que **no aparece en un threat model genérico**: en un
contexto de **divorcio o conflicto familiar**, lo que un adolescente escribe en la app puede
**usarse como arma en una disputa de custodia**. Ejemplo: el chico escribe *"quiero vivir con
mamá"* o *"papá me gritó"*; ese texto, si sale del teléfono, puede ser leído por el otro
progenitor, exigido por un abogado o presentado ante un juez.

**Consecuencia de diseño:** el producto debe proteger al joven **de su propia familia**, no solo
de terceros. Eso invierte supuestos habituales: aquí el adversario más probable tiene **acceso
físico al dispositivo**.

Por eso es de **Ola 0**: decide **qué se guarda y qué se comparte** *antes* de construir nada.

---

## 2. Alcance

### Dentro
- Identificar activos, actores, superficies y amenazas.
- Fijar las **mitigaciones que condicionan el diseño** de otras tareas.
- Dejar por escrito los **riesgos residuales aceptados**.

### Fuera
- Implementar las mitigaciones (cada una es su tarea).
- El detalle del protocolo clínico (`PR-001`).
- La seguridad del backend más allá de la correlación (`PR-018`).

---

## 3. Módulo y propiedad

`—`. Es un documento de seguridad: **no produce módulo**. Su efecto es **condicionar** las tareas
de §8.

## 4. Contratos de datos

`—`. **No añade** contratos. **Restringe** los existentes (qué campos pueden existir y dónde).

---

## 5. El modelo de amenaza

### 5.1 Activos a proteger

| Activo | Por qué importa |
|---|---|
| Contenido del chat | Lo más íntimo y lo más explotable |
| Respuestas de chequeo | Revelan violencia, abuso o ideación |
| Resumen y consentimientos | Dicen qué se compartió y con quién |
| **La existencia misma de la app** | Que se sepa que el joven la usa ya es información |
| Correlación `caseToken ↔ ProfileId` | Re-identifica un caso anónimo |
| `ProfileId` y `deviceKey` | Vinculan al joven con todo lo anterior |

### 5.2 Actores de amenaza

| Actor | Motivación | Capacidad |
|---|---|---|
| **Progenitor en conflicto** | Ganar ventaja en la custodia | Acceso físico, coacción, puede conocer el PIN |
| Otro familiar / hermano | Curiosidad, control | Acceso físico, dispositivo compartido |
| Tercero con el teléfono prestado | Oportunista | Acceso físico breve |
| Abogado / juzgado | Requerimiento legal | Poder legal sobre el backend |
| Atacante externo | Robo de datos | Red, ingeniería social |
| Profesional (mal uso) | — | Acceso autorizado |

### 5.3 Superficies y vectores

1. **Dispositivo compartido** — el vector nº 1 del piloto (hermanos, laboratorio escolar).
2. **Notificaciones en pantalla de bloqueo** — filtran contenido sin desbloquear.
3. **Captura de pantalla / mirada por encima del hombro** — trivial.
4. **Coacción del PIN** — un adulto exige el teléfono desbloqueado.
5. **Backend / correlación** — un requerimiento legal puede pedir "todos los datos de X".
6. **Respaldo del sistema** — Google Backup puede subir el contenido.
7. **Logs** — contenido sensible en la app o en el backend.
8. **Metadatos** — hora de uso, frecuencia, tamaño del texto.

### 5.4 Amenazas y riesgo

| # | Amenaza | Vector | Prob. | Impacto | Riesgo | Mitigación |
|---|---|---|---|---|---|---|
| **T1** | El progenitor lee el chat en el teléfono compartido | dispositivo compartido | Alta | Alto | **Crítico** | **Multi-perfil** (`TASK-025`) + PIN por perfil + cifrado local |
| **T2** | El progenitor coacciona el PIN | coacción | Media | Alto | **Alto** | Minimizar lo almacenado; borrado rápido opcional (§5.6) |
| **T3** | La notificación revela contenido en la pantalla de bloqueo | notificación | Media | Medio | Medio | **Notificaciones sin contenido** |
| **T4** | Un requerimiento judicial pide "los datos de X" | legal | Baja | Alto | Medio | `caseToken` sin identidad; correlación restringida y auditada; el reporte **no** lleva el chat completo |
| **T5** | El contenido se sincroniza a un respaldo en la nube | respaldo | Media | Medio | Medio | **Excluir del Auto Backup** (`allowBackup=false` o reglas) |
| **T6** | Contenido sensible en logs | logs | Media | Alto | Alto | **Sin PII en logs** (guardrail) + revisión |
| **T7** | Los metadatos revelan el patrón de uso | metadatos | Media | Bajo | Bajo | Retención corta + purga (`RetentionPolicy`) |
| **T8** | El profesional ve más de lo autorizado | backend | Baja | Alto | Medio | `consent.scope ⊆ summary.scope` + RLS + auditoría |
| **T9** | Se descubre que el joven usa la app | icono / nombre | Media | Medio | Medio | Nombre e icono discretos (decisión de producto — §9) |

### 5.5 Mitigaciones → decisiones que fuerzan

| Mitigación | Tarea que la implementa | Efecto |
|---|---|---|
| **Multi-perfil con aislamiento** | `TASK-025` | Deja de ser opcional: es **obligatoria** |
| Notificaciones **sin contenido** | `TASK-004`/`TASK-009` | Solo "tienes una novedad" |
| **Sin respaldo automático** | `TASK-003b` | Reglas de backup del contenido cifrado |
| El reporte lleva **el mínimo** | `PR-003` / `TASK-015` | Sin chat completo, sin identidad |
| Correlación **restringida + auditada** | `PR-004` / `PR-018` | Ya previsto en `PR-003` §3 |
| Retención corta + **purga** | `TASK-003b` | Ya previsto; se refuerza |
| **Sin PII en logs** | `TASK-014` | Guardrail verificable en CI |

### 5.6 La tensión difícil: coacción del PIN

Si un adulto exige el teléfono desbloqueado, **el PIN no protege**. Opciones reales:

| Opción | Cómo | Coste |
|---|---|---|
| **(a) PIN de coacción** | Un PIN alternativo que abre una vista vacía | Complejo; riesgo de confundir al joven |
| **(b) Borrado rápido** | Un gesto que destruye el contenido local | Peligroso: es **irrecuperable** (F6) |
| **(c) Aceptar el límite** | El PIN protege de un vistazo casual, **no** de coacción | Honesto y barato |

**Recomendación: (c) para el MVP**, ofreciendo **(b)** como opción explícita y **muy bien
señalizada**. Lo importante es **no prometer** una protección que no existe (principio P5 de
`PR-001`).

---

## 6. Guardrails aplicables

- Guardrail #1: el contenido **nunca** se interpreta como diagnóstico.
- `consent.scope ⊆ summary.scope` (invariante del proyecto).
- **Sin PII en logs** (verificable en CI).
- El chat completo nunca entra en el reporte.
- La app **no promete** una protección que no puede dar.

---

## 7. Referencia visual

`—`. Es un documento de seguridad, no una pantalla.

---

## 8. Dependencias

- **Bloquea a:** `TASK-003b` (qué se persiste y cómo), `TASK-025` (multi-perfil), `TASK-007`
  (qué se comparte), `TASK-015` (qué lleva el paquete de alerta), `PR-019` (revocación).
- **Relacionado:** `PR-003` §9 (invariantes), `PR-001` §2 (principios).

---

## 9. Preguntas abiertas

| # | Pregunta |
|---|---|
| **Q1** | ¿Nombre e icono **discretos** (que no revelen que es una app de apoyo emocional)? |
| **Q2** | ¿Se ofrece **borrado rápido** además del borrado manual ya previsto? |
| **Q3** | ¿El reporte enviado a Red puede ser **exigido judicialmente**? ¿Quién es el responsable legal del tratamiento de datos de menores? (`PLAN-PUENTE-RED` P11) |
| **Q4** | ¿Se bloquea la **captura de pantalla** dentro de la app (`FLAG_SECURE`)? |

---

## 10. Definition of Done

- [ ] Revisado por **otro agente**
- [ ] Las 4 decisiones de §9 resueltas (o marcadas como aceptadas)
- [ ] Las tareas bloqueadas (`TASK-003b`, `TASK-025`, `TASK-007`, `TASK-015`) citan este documento
- [ ] Los riesgos residuales de §5.6 quedan **por escrito** y no como omisión
