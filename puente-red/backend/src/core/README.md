# `core/` — pipeline de triaje y derivación

**Dueño: Agente C** (`PR-000` §1.1).

Aquí van, en este orden:

| Tarea | Qué |
|---|---|
| `PR-005` | Clasificador LLM (`MEDIO`/`ALTO`, versionado) |
| `PR-006` | Extracción de características del caso |
| `PR-007` | Directorio de profesionales (dos tipos de respondedor) |
| `PR-008` | Motor de derivación escalonado por gravedad |
| `PR-009` | Cola de asignación, SLA y trazabilidad |

## Reglas con A

- `core/` **lee** `shared/` (contratos, almacén) pero **no lo modifica**: los cambios se
  **declaran** (`CONTRATO-DE-INTEGRACION.md` §1.1 y §2).
- El clasificador debe poder **desactivarse por configuración** (`CLASSIFIER_MODE=off`) y, en ese
  caso, todo entra como `ALTO` con el caso **sin bloquear** (`PR-005` criterio 5).
- ⚠️ **Gemini de pago obligatorio antes de datos reales de menores** (`PR-INFRA` §4): la capa
  gratuita puede usar los prompts para mejorar productos de Google.
- El LLM **solo sube** de categoría; nunca degrada un `ROJO` (`PR-001` P3).

## Estado

Carpeta **vacía a propósito**: es el punto de partida de la Fase 1 de C. El esqueleto no
implementa el pipeline, solo le deja el sitio y el contrato.
