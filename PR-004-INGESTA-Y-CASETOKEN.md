# PR-004 · Ingesta del reporte y emisión de `caseToken`

**Fecha:** 2026-09-30
**Autor:** Agente A — Núcleo y contratos
**Ola:** R1 (backend) · **Depende de:** `PR-002` (identidad), `PR-003` (contrato Joven↔Red)
**Bloquea:** `PR-005` (clasificador), `PR-008` (derivación), `PR-009` (cola/SLA)
**Estado:** borrador para revisión

> El modelo de identidad de `PR-002` está **resuelto en diseño** (`PLAN-PUENTE-RED.md` §2.5 y
> `PR-003` §7); este documento lo **formaliza** en su parte de backend (correlación). No hace
> falta un documento aparte para `PR-002` salvo que se quiera separar la trazabilidad.

---

## 0. Propósito

Es el **primer servicio real del backend**: recibe el paquete de alerta del APK, emite el
`caseToken`, inserta la transacción del caso y mantiene la tabla de correlación. Es la puerta
de entrada de todo el pipeline de Puente Red.

---

## 1. Alcance

### Dentro
- Endpoint de **registro** del dispositivo (vínculo `ProfileId` ↔ sesión).
- Endpoint de **ingesta** del reporte (Contrato A de `PR-003`).
- Emisión y validación del **`caseToken`**.
- Endpoint de **estado del caso** (Contrato B de `PR-003`).
- Tablas `casos`, `caso_correlacion`, `audit_event` + políticas RLS.
- Idempotencia y cola offline.

### Fuera
- Clasificación LLM (`PR-005`), extracción de características (`PR-006`), derivación (`PR-008`),
  cola/SLA (`PR-009`).
- Autenticación profesional (`PR-010`).
- Canal de contacto in-app (baja prioridad — `PR-003` §6.2).

---

## 2. Endpoints

### 2.1 Registro (una vez por dispositivo)

```
POST /joven/registro
{ "profileId": "…", "deviceKey": "…" }   →  201 { "sessionToken": "…" }
```

- El `ProfileId` viaja **solo aquí** — nunca junto al contenido.
- `deviceKey`: clave pública del dispositivo (o un secreto generado en el primer arranque).

### 2.2 Ingesta del reporte

```
POST /joven/casos
Authorization: Bearer <sessionToken>
Idempotency-Key: <uuid>
{ …Contrato A de PR-003… }   →  201 { "caseToken": "…", "estado": "RECIBIDO" }
```

- **El cuerpo NO contiene `ProfileId`.** El vínculo lo hace el servidor **desde la sesión**.
- `Idempotency-Key` evita duplicados en reintentos offline.

### 2.3 Estado del caso

```
GET /joven/casos/{caseToken}
Authorization: Bearer <sessionToken>   →  200 { …Contrato B de PR-003… }
```

- Solo devuelve el caso **de esa sesión** (RLS).

---

## 3. Emisión del `caseToken`

- **Opaco**: ULID aleatorio (ordenable por tiempo, no derivable).
- **Nunca** derivado del `ProfileId`, alias ni MAC.
- Emitido en la primera ingesta; si el APK llegó offline con un token provisional, el backend
  **reconcilia** por `Idempotency-Key` y devuelve el token definitivo.
- Es el **único** identificador que ven el clasificador, la derivación y los profesionales.

---

## 4. Modelo de datos

### 4.1 `casos` (anónima)

| Columna | Notas |
|---|---|
| `case_token` (PK) | ULID |
| `estado` | `RECIBIDO`…`CERRADO` |
| `categoria` | `MEDIO`/`ALTO` (`null` hasta clasificar) |
| `nivel_origen` | `VERDE`/`AMARILLO`/`ROJO` (reglas del APK) |
| `ruleset_version` | trazabilidad local |
| `model_version` / `prompt_version` | del LLM |
| `created_at` / `updated_at` | |

**No tiene** ninguna columna de identidad.

### 4.2 `caso_correlacion` (restringida)

| Columna | Notas |
|---|---|
| `case_token` | FK a `casos` |
| `profile_id` | identidad opaca del joven |
| `profesional_id` | `null` hasta `ACEPTADO` |
| `created_at` | |

Acceso **solo** por el rol de servicio; **toda** lectura se audita. RLS la oculta a las APIs
de borde.

### 4.3 `audit_event`

Quién / cuándo / qué caso / qué acción. **Sin** contenido sensible.

---

## 5. Idempotencia y offline

- El APK **encola** el reporte si no hay red (el rojo nunca depende de la red).
- Al reconectar, reintenta con la **misma** `Idempotency-Key` → no se duplica el caso.
- El backend devuelve el **mismo** `caseToken` para la misma clave.

---

## 6. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | El cuerpo de `POST /joven/casos` **no** contiene `ProfileId` ni alias | prueba de contrato |
| 2 | Dos envíos con la misma `Idempotency-Key` producen **un solo** caso | prueba de integración |
| 3 | Un caso creado por una sesión **no** es legible por otra | prueba de RLS |
| 4 | `GET /joven/casos/{token}` **no** devuelve `psicologo` antes de `ACEPTADO` | prueba de contrato |
| 5 | Todo acceso a `caso_correlacion` deja un `audit_event` | prueba de integración |
| 6 | El `caseToken` no es derivable del `ProfileId` | revisión + prueba |

---

## 7. Guardrails

- Guardrail #1 (no diagnóstico): aquí **no** se clasifica; solo se registra.
- Invariante `consent.scope ⊆ summary.scope`: se valida en la ingesta.
- **Sin PII en logs.**
- El APK solo habla con la **API Joven**, nunca con la API Profesional.

---

## 8. Preguntas abiertas

| # | Pregunta |
|---|---|
| **Q1** | ¿El `deviceKey` es una clave del Keystore o un secreto simple? (afecta al registro) |
| **Q2** | ¿La ingesta acepta casos **amarillo** además de rojo, o solo rojo en el MVP? |
| **Q3** | ¿El `sessionToken` caduca? ¿Cómo se renueva sin que el servidor conozca alias+PIN? |
| **Q4** | Formato de `caseToken`: ¿ULID o UUIDv4? |
