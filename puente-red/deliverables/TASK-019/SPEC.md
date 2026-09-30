# TASK-019 · Apoyo humano breve telefónico (modelo híbrido)

**Agente:** C · **Ola:** R3 · **Depende de:** `PR-001` §7–8 (firmado), `PR-007`, `PR-009`, `PR-003` §6.2
**Bloquea a:** `TASK-020` (dimensión *Aceptabilidad*)
**Reconciliado:** 2026-09-30 — ⚠️ `PR-003` §15 (Q8) resuelve: **no hay guardia 24/7**. La llamada **solo puede ofrecerse en horario**; fuera de él no se promete ni se agenda.
`PR-003` §6.2 la lista como **opción B** del canal de contacto con el psicólogo: *"complemento válido"*, pero **baja prioridad** (R2) y **fuera del camino crítico del MVP**. Con Q6 (demo ≤5 usuarios) y Q7 (sin datos), esta tarea queda **al final de la cola** de C.

---

## Contexto

El resumen ejecutivo cita la evidencia internacional: *"La experiencia internacional sugiere
incluir apoyo humano breve. En Jordania, cinco llamadas semanales de 15 minutos..."* (`H3` en
`COMPARACION` §1.2).

Hoy el sistema, tal como está planificado, promete un **canal escrito** (`SupportRequest` con
sus estados y la proyección `YouthVisibleCaseStatus`). Una llamada es un canal distinto, con
promesas distintas: exige un número, un horario, alguien que conteste y un registro de lo
hablado.

Esta spec define **cómo encaja la llamada sin romper nada**: sin añadir estados al contrato
estable del APK, sin abrir un canal por el que se cuele contenido no autorizado, y sin prometer
cobertura que no exista.

> **Nota de honestidad:** esta tarea puede perfectamente **no entrar** en el MVP. El plan la
> sitúa en la Ola R3 y el resumen la presenta como recomendación, no como requisito. Si no hay
> equipo que atienda llamadas, la respuesta correcta es no construirla (`PR-001` §8, P5).

---

## Alcance

### Dentro

- **Modelo de la llamada** como tipo de contacto dentro del acompañamiento, sin crear un estado
  nuevo en `SupportRequestState` (contrato estable del APK).
- **Agenda**: propuesta de franjas, confirmación y recordatorios.
- **Registro del contacto**: fecha, duración, quién llamó, resumen **estructurado por claves**
  (no texto libre del contenido clínico), y siguiente paso.
- **Consentimiento específico**: el joven autoriza ser llamado, con su propio `ConsentRecord`.
  Una llamada no se justifica por el consentimiento del resumen escrito.
- **Cobertura honesta**: si no hay horario de llamadas, la funcionalidad **no se ofrece**. El
  portal no muestra "te llamamos" si nadie va a llamar.
- Trazabilidad (`PR-018`) de cada intento, incluidas las llamadas no contestadas.

### Fuera

- La atención clínica por teléfono. La llamada es **apoyo breve**, no terapia.
- Sustituir el canal escrito: convive con él.
- Números de emergencia del joven: ya existen en el flujo rojo del APK (`PR-001` §9).
- Grabación de audio de la llamada. **Prohibida** en el MVP: riesgo legal y de privacidad.

---

## Módulo y propiedad

- Módulo: `puente-red/backend/calls` + `puente-red/portal/calls`
- Dueño: **C**.

```
scheduleCall(caseToken, slot) -> CallAppointment
recordCallOutcome(appointmentId, outcomeKey, nextStepKey) -> CallRecord
```

---

## Contratos de datos

```kotlin
enum class CallOutcome {
    COMPLETED, NO_ANSWER, RESCHEDULED, DECLINED_BY_YOUTH, CANCELLED
}

data class CallAppointment(
    val id: CallAppointmentId,
    val caseToken: CaseToken,
    val scheduledAtEpochMillis: Long,
    val assignedTo: ResponderId,
    val consentRecordId: ConsentId,     // consentimiento ESPECÍFICO para la llamada
)

data class CallRecord(
    val appointmentId: CallAppointmentId,
    val outcome: CallOutcome,
    val durationMinutes: Int?,
    val summaryKeys: List<String>,      // claves de catálogo, NO transcripción
    val nextStepKey: String?,
    val recordedAtEpochMillis: Long,
)
```

**Regla dura:** `summaryKeys` son claves de catálogo. No hay campo de texto libre para lo
hablado, porque un campo así acabaría conteniendo contenido clínico sin consentimiento para
almacenarlo.

---

## Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | No se crea ningún estado nuevo en `SupportRequestState` | prueba de contrato contra el APK |
| 2 | Una llamada requiere un `ConsentRecord` propio y vigente | prueba unitaria |
| 3 | Si no hay horario de cobertura configurado, la funcionalidad no se ofrece en la UI | prueba de integración |
| 4 | No existe campo de texto libre para el contenido de la llamada | revisión de esquema + prueba de contrato |
| 5 | No se graba audio | prueba de contrato (no hay campo ni endpoint de audio) |
| 6 | Todo intento, incluido `NO_ANSWER`, queda registrado y auditado | prueba de integración con `PR-018` |
| 7 | Revocar el consentimiento cancela las llamadas futuras | prueba de integración con `PR-019` |

---

## Guardrails aplicables

- P5 (`PR-001` §8) — no prometer lo que no se puede cumplir. Criterio 3.
- #2 — el apoyo lo da una persona; el sistema solo agenda y registra.
- #4 — el contenido de la llamada no es contenido del joven compartido con el portal.
- #9 — trazabilidad de cada intento.
- Invariante del proyecto — no añadir estados al contrato estable.

---

## Referencia visual

No existe en el prototipo. Es una pantalla nueva; debe **extender** el lenguaje visual del
portal (brief §37), y encaja en *"Seguimientos"* (`PR-015`) más que en un ítem propio.

---

## Dependencias

- **Bloqueado por:** `PR-001` §7 (quién responde y en qué horario) y §8 (cobertura real).
  Sin eso, no se puede decidir si la tarea existe.
- **Bloquea a:** `TASK-020` (dimensión *Aceptabilidad*).

---

## Preguntas abiertas

| # | Pregunta | Impacto |
|---|---|---|
| **P8** | ¿Existe equipo de guardia? ¿En qué horario? ¿Fines de semana? | determina si la tarea es viable |
| P9 | ¿Qué ocurre con un caso ALTO fuera de horario? | define si la llamada es una promesa o una opción |
| Q10 | ¿El audio entra en el MVP? | esta tarea es audio humano, no audio de la app; conviene no confundirlas |
| — | ¿Quién paga las llamadas y desde qué número? | operativo, pero bloquea el piloto |
