# TASK-019 · Apoyo humano breve telefónico (modelo híbrido)

**Estado:** En revisión
**Autor:** Agente C · **Revisor:** Agente A
**Fecha:** 2026-09-30
**Ola:** R3 · **Depende de:** `PR-001` §7–8, `PR-003` §6.2, `PR-007`, `PR-009` · **Bloquea:** `TASK-020`

---

## 1. Contexto

El resumen ejecutivo cita la evidencia internacional: *"La experiencia internacional sugiere
incluir apoyo humano breve. En Jordania, cinco llamadas semanales de 15 minutos..."* (`H3` en
`COMPARACION` §1.2).

Hoy el sistema promete un **canal escrito** (`SupportRequest` con sus estados y la proyección
`YouthVisibleCaseStatus`). Una llamada es un canal distinto, con promesas distintas: exige un
número, un horario, alguien que conteste y un registro de lo hablado.

Esta spec define **cómo encaja la llamada sin romper nada**: sin añadir estados al contrato estable
del APK, sin abrir un canal por el que se cuele contenido no autorizado, y sin prometer cobertura
que no exista.

> **Nota de honestidad:** esta tarea puede perfectamente **no entrar** en el MVP. El plan la sitúa
> en la Ola R3 y el resumen la presenta como recomendación, no como requisito. Si no hay equipo que
> atienda llamadas, la respuesta correcta es **no construirla** (`PR-001` §8, P5).

---

## 2. Alcance

### Dentro
- **Modelo de la llamada** como tipo de contacto dentro del acompañamiento, **sin crear un estado
  nuevo** en `SupportRequestState` (contrato estable del APK).
- **Agenda**: propuesta de franjas, confirmación y recordatorios.
- **Registro del contacto**: fecha, duración, quién llamó, resumen **estructurado por claves** (no
  texto libre del contenido clínico), y siguiente paso.
- **Consentimiento específico**: el joven autoriza ser llamado, con su propio `ConsentRecord`. Una
  llamada **no** se justifica por el consentimiento del resumen escrito.
- **Cobertura honesta**: si no hay horario de llamadas, la funcionalidad **no se ofrece**.
- Trazabilidad (`PR-018`) de cada intento, incluidas las llamadas no contestadas.

### Fuera
- La atención clínica por teléfono. La llamada es **apoyo breve**, no terapia.
- Sustituir el canal escrito: convive con él.
- Números de emergencia del joven: ya existen en el flujo rojo del APK (`PR-001` §9).
- **Grabación de audio de la llamada. Prohibida** en el MVP: riesgo legal y de privacidad.

---

## 3. Módulo y propiedad

- Módulo: `puente-red/backend/core/calls` + `puente-red/portal/calls`
- Dueño: **C**
- Runtime: **Go** / **TypeScript + React + Vite**; persistencia en **Supabase**
- Archivos compartidos que necesita declarar: **ninguno del APK**.

---

## 4. Contratos de datos

- Interfaces de `Repositories.kt` que consume: **ninguna**.
- Métodos nuevos que necesita: **ninguno del APK**.

```go
type CallOutcome string
const (
    CallCompleted       CallOutcome = "COMPLETED"
    CallNoAnswer        CallOutcome = "NO_ANSWER"
    CallRescheduled     CallOutcome = "RESCHEDULED"
    CallDeclinedByYouth CallOutcome = "DECLINED_BY_YOUTH"
    CallCancelled       CallOutcome = "CANCELLED"
)

type CallAppointment struct {
    ID             string
    CaseToken      string
    ScheduledAt    time.Time
    AssignedTo     string
    ConsentRecordID string // consentimiento ESPECÍFICO para la llamada
}

type CallRecord struct {
    AppointmentID string
    Outcome       CallOutcome
    DurationMin   *int
    SummaryKeys   []string // claves de catálogo, NO transcripción
    NextStepKey   *string
    RecordedAt    time.Time
}
```

**Regla dura:** `SummaryKeys` son claves de catálogo. **No hay campo de texto libre** para lo
hablado, porque un campo así acabaría conteniendo contenido clínico sin consentimiento para
almacenarlo.

---

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | No se crea ningún estado nuevo en `SupportRequestState` | contrato contra el APK |
| 2 | Una llamada requiere un `ConsentRecord` propio y vigente | unitaria |
| 3 | Si no hay horario de cobertura configurado, la funcionalidad no se ofrece en la UI | integración |
| 4 | No existe campo de texto libre para el contenido de la llamada | revisión de esquema + contrato |
| 5 | No se graba audio | contrato (no hay campo ni endpoint de audio) |
| 6 | Todo intento, incluido `NO_ANSWER`, queda registrado y auditado | integración con `PR-018` |
| 7 | Revocar el consentimiento cancela las llamadas futuras | integración con `PR-019` |
| 8 | Fuera de horario no se agenda ninguna llamada | unitaria con reloj inyectable |

---

## 6. Guardrails aplicables

- P5 (`PR-001` §8) — no prometer lo que no se puede cumplir. Criterios 3 y 8.
- **`PR-003` §15`** — **no hay guardia 24/7**: la llamada solo existe **en horario**.
- #2 — el apoyo lo da una persona; el sistema solo agenda y registra.
- #4 — el contenido de la llamada no es contenido del joven compartido con el portal.
- #11 — trazabilidad de cada intento.
- **`PR-003` §9** — no añadir estados al contrato estable. Criterio 1.
- **`PR-003` §6.2 (R2)** — el canal de contacto es **baja prioridad**; la llamada es su **opción B**,
  *"complemento válido"*.

---

## 7. Referencia visual

No existe en el prototipo. Es una pantalla nueva; debe **extender** el lenguaje visual del portal
(brief §37), y encaja en *"Seguimientos"* (`PR-015`) más que en un ítem propio.

---

## 8. Dependencias

- **Bloquea:** `TASK-020` (dimensión *Aceptabilidad*).
- **Bloqueado por:** `PR-001` §7–8 (**firma clínica pendiente**); `PR-003` §15 ✅ (sin guardia);
  `PR-007`, `PR-009`.
- **Specs relacionadas:** `PR-015` (seguimientos), `PR-019` (consentimiento).

---

## 9. Preguntas abiertas

| # | Pregunta | Estado |
|---|---|---|
| — | ¿El audio entra en el MVP? | Q10: es audio **humano**, no audio de la app; no confundir |
| — | ¿Quién paga las llamadas y desde qué número? | operativo, pero bloquea el piloto |
| — | ¿Esta tarea entra en el MVP? | **propuesta de C: no** hasta que haya equipo en horario |

---

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] Compila (`go build ./...` + `npm run build`) y pasa lint
- [ ] Pruebas de los 8 criterios en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado (si aplica)
- [ ] Sin secretos ni endpoints hardcodeados
- [ ] Ningún contrato profesional compilado en el APK (`PR-003` §9.10)
