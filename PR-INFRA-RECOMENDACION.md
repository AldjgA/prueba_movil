# PR-INFRA · Recomendación de infraestructura del MVP

**Fecha:** 2026-09-30
**Autor:** Agente A — Núcleo y contratos
**Apoya a:** `PR-003` §13 (arquitectura del backend)
**Restricción dura:** servidor **sin cold start** de **0.1 vCPU / 256 MB RAM** (tope gratuito encontrado).
**Propuesta del usuario:** una sola API + **Google GenAI** (LLM) + **Supabase** (BD).

---

## 1. Veredicto rápido

La combinación **es viable**, con **dos correcciones**:

1. **El runtime de la API debe ser liviano.** Un framework JVM (Spring Boot) no cabe en 256 MB.
2. **No se puede usar la capa gratuita de Gemini con datos reales de menores** (§4). Es un
   bloqueo legal/ético, no técnico, y hay que resolverlo antes del piloto.

### 1.1 Escala (Q6) y datos (Q7)

Alcance **demostrativo: ≤5 usuarios recurrentes**. Con ese volumen, las capas gratuitas
(Gemini, Supabase y el servidor) **bastan**. No hay que optimizar para carga alta: el
objetivo es que la demo funcione y que el **flujo rojo** sea correcto.

**Sin datos (Q7):** la demo **no usa datos reales** y, por ahora, **tampoco sintéticos**. Se
muestra el flujo y la UI. Por eso la capa gratuita de Gemini es admisible **en esta fase**; el
día que se trate cualquier caso real, hay que pasar a la capa de pago (§4).

---

## 2. Reparto de responsabilidades (no cargar todo al servidor)

| Pieza | Dónde vive | Por qué |
|---|---|---|
| Base de datos | **Supabase (Postgres)** | Gestionado; no consume RAM del servidor |
| Autenticación de profesionales | **Supabase Auth** | No reinventarla |
| Permisos y separación Joven/Profesional | **Postgres RLS** | La separación se hace en la BD, no en el código |
| Canal in-app (baja prioridad) | **Supabase Realtime** | No consume RAM del servidor |
| LLM | **Google GenAI** (llamado desde la API) | La espera es de I/O, no de CPU |
| API (una, dos superficies) | **el servidor de 256 MB** | Solo orquesta: valida, llama al LLM, lee/escribe Supabase |

**Idea clave:** el servidor de 256 MB **no hace trabajo pesado**. Es un **orquestador sin
estado**. La BD, la auth, el realtime y el LLM viven fuera. Así 256 MB alcanzan de sobra.

---

## 3. Runtime recomendado para 256 MB / 0.1 vCPU

| Opción | Huella RAM aprox. | Veredicto |
|---|---|---|
| **Go** (`net/http`, `chi`) | ~10–25 MB | ✅ **Mejor**: binario estático, mínimo |
| **Bun** + Hono/Fastify | ~30–60 MB | ✅ Buen punto medio |
| **Node** + Hono/Fastify | ~50–90 MB | ✅ Válido si prefieres JS/TS |
| Python + FastAPI | ~80–150 MB | ⚠️ Justo |
| Spring Boot / JVM | 250–500 MB+ | ❌ **No cabe** |

**Recomendación:** **Go**; si no te sientes cómodo, **Node/Bun + Hono**.

**Nota sobre el CPU:** **0.1 vCPU no es el problema.** La llamada al LLM es de *espera* (I/O),
no de cálculo. El límite real es la **RAM**, y un orquestador sin estado la usa muy poco.

---

## 4. ⚠️ El bloqueo que no es técnico: Gemini y datos de menores

Verificado el 2026-09-30 en los términos de la Gemini API:

| Capa | ¿Google usa tus prompts/respuestas para mejorar sus productos? |
|---|---|
| **Gratuita (no pagada)** | **Sí** — "pueden usarse para mejorar productos de Google" |
| **De pago** | **No** |
| Vertex AI | Tampoco entrena con tus datos |

**Consecuencia:** usar la **capa gratuita** con casos reales de adolescentes **no es
aceptable**. La decisión D3 de `PR-001` (cláusula de no-reentrenamiento sobre datos de menores)
**no se cumple** con la capa gratuita.

| Uso | Capa admitida |
|---|---|
| Desarrollo, demos y pruebas con **datos sintéticos** | gratuita ✅ |
| **Piloto con casos reales** | **de pago** (Gemini API de pago o Vertex AI) ⚠️ |

**Costo estimado:** Gemini Flash ronda **~$0.30 por millón de tokens de entrada**. Con el
volumen de un piloto, es del orden de **céntimos al día**. Es asumible — pero hay que
**presupuestarlo antes de tocar datos reales**.

> Alternativa: usar la capa gratuita solo para el entorno de desarrollo y mantener el
> clasificador **desactivado** (o con datos sintéticos) hasta que exista la capa de pago.

### 4.1 Sobre el "opt-out" (aclaración a Q7)

No existe un interruptor de "opt-out" en la **capa gratuita**: ceder los datos para mejorar
los productos de Google es una **condición** de usar esa capa, no una opción configurable.
La manera de "desactivarlo" es **pasar a la capa de pago** (o a Vertex AI), donde Google
declara que **no** usa tus datos.

Por eso el plan "primera prueba gratuita → luego de pago" es válido **solo si** la primera
prueba se hace con **datos sintéticos o de demostración, nunca con casos reales de menores**.
(Pendiente de confirmar el texto exacto en los Términos de Servicio antes de depender de ello.)

---

## 5. Supabase: lo que hay que saber

- **Free:** 500 MB de base de datos, 1 GB de storage, 5 GB de egress.
- **Se pausa tras ~7 días de poca actividad.** Para un piloto hay que mantenerla activa
  (un *ping* diario basta) o pasar a **Pro ($25/mes)**. Una BD pausada en medio de un caso
  rojo sería un fallo grave.
- **Región:** elegir la más cercana a La Paz → **São Paulo (`sa-east-1`)**.
- **Backups:** en free son limitados; documentar el plan de respaldo.

---

## 6. Seguridad (guardrails ya vigentes)

- La **API key de Gemini solo en el servidor**; **nunca** en el APK
  (`ModuleGraphGuardTest` prohíbe secretos en las fuentes).
- **Rate limiting** y **tope de gasto** configurados en Gemini (evita sorpresas de facturación).
- **RLS:** el APK solo puede leer lo suyo; la tabla `caseToken ↔ ProfileId` con acceso
  restringido y auditoría.
- **Sin PII de menores en los logs.**

---

## 7. Alternativa a considerar

**Supabase Edge Functions** (Deno) como API, en lugar del servidor propio.
Ventaja: cero gestión. Desventaja: *cold starts*.
Como ya tienes un servidor **sin cold start**, **quédate con el servidor**; usa Edge Functions
solo para tareas programadas (por ejemplo, el *ping* anti-pausa de §5).

---

## 8. Resumen accionable

| # | Acción | Prioridad |
|---|---|---|
| 1 | Implementar la API en **Go** (o Node/Bun) — **sin framework JVM** | Alta |
| 2 | **Cambiar a Gemini de pago antes de tratar casos reales** | **Bloqueante** |
| 3 | Crear el proyecto **Supabase** en `sa-east-1` + esquema + RLS | Alta |
| 4 | *Ping* diario anti-pausa (o plan Pro) | Alta |
| 5 | Tope de gasto y rate limiting en Gemini | Media |
| 6 | Canal in-app con Supabase Realtime | **Baja** (R2) |
