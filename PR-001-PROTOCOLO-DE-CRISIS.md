# PR-001 · Protocolo de crisis — BORRADOR

**Fecha:** 2026-09-29  
**Estado:** borrador técnico para revisión y firma clínica  
**Alcance:** define qué ocurre cuando el sistema detecta prioridad alta

> ⚠️ **Este documento no está validado clínicamente.** Lo he redactado desde el resumen  
> ejecutivo, el código y el brief de diseño. Todo lo marcado **[VALIDAR]** es una decisión  
> clínica que debe tomar y firmar un profesional de salud mental. No soy clínico y no  
> pretendo sustituir ese criterio.

---

## 1. Propósito

Definir, de forma operativa y auditable:

1. Qué significa cada nivel de prioridad.
2. Quién responde, en cuánto tiempo y con qué respaldo.
3. Qué puede y qué no puede hacer el sistema automatizado.
4. Qué ve el joven en cada situación.
5. Qué ocurre cuando algo falla.

**Fuera de alcance:** el tratamiento clínico posterior. Este protocolo cubre la **detección,  
el escalado y el primer contacto humano**, no la atención.

---

## 2. Principios no negociables

| #   | Principio                                                                      | Origen                                     |
| --- | ------------------------------------------------------------------------------ | ------------------------------------------ |
| P1  | **Verde/amarillo/rojo es prioridad preliminar de revisión, nunca diagnóstico** | Guardrail #1                               |
| P2  | **El rojo lo determinan reglas, jamás el LLM**                                 | Decisión D2                                |
| P3  | **El LLM puede subir de categoría; nunca bajar un rojo**                       | Decisión D2                                |
| P4  | **Ninguna prioridad reemplaza a una persona**                                  | Guardrail #1                               |
| P5  | **El sistema nunca promete una respuesta que no puede dar**                    | Honestidad de cobertura (§8)               |
| P6  | **No se comparte la conversación completa con nadie**                          | Guardrail #7                               |
| P7  | **El joven autoriza antes de que salga nada**                                  | Invariante `consent.scope ⊆ summary.scope` |
| P8  | **No se recomiendan tratamientos farmacológicos**                              | Resumen §5                                 |
| P9  | **No se generan respuestas abiertas en crisis**: el sistema sigue un guion     | Resumen §5                                 |
| P10 | **Todo lo que ocurre queda trazado**: quién vio qué y cuándo                   | Resumen §4                                 |

---

## 3. Las dos escalas (no son la misma)

```
APK JUVENIL (reglas deterministas)          BACKEND (LLM)
lo que ve el adolescente                    prioridad del equipo
        verde   ────────────────────────►   (nada)
        amarillo ───────────────────────►   medio  |  alto
        rojo    ────────────────────────►   alto (obligatorio, no degradable)
```

Son ejes independientes: un caso puede ser **rojo para el joven** (hay que darle ayuda ya) y  
**medio para el equipo** (hay un psicólogo libre). Y un amarillo que se arrastra tres semanas  
puede ser **alto** en carga operativa aunque clínicamente sea leve.

---

## 4. Nivel del joven — 3 niveles

Criterios tomados del resumen ejecutivo §4. **Se calculan por reglas, con `rulesetVersion`.**

### 4.1 Verde

> *Malestar leve, sin peligro inmediato y con apoyo disponible.*

- El joven puede trabajar paso a paso.
- **No se envía nada al equipo.**
- La app ofrece herramientas breves.

### 4.2 Amarillo

> *Malestar persistente, varios factores acumulados, aislamiento, violencia no inmediata o  
> deterioro escolar.*

- Conviene involucrar a una persona de confianza.
- Se envía el reporte al equipo (con autorización del joven).
- La app ofrece herramientas y el flujo de solicitud de apoyo.

### 4.3 Rojo

> *Ideación suicida activa, plan, intento reciente, autolesión, abuso o peligro inmediato.*

- **[VALIDAR]** ¿Se confirma esta lista de criterios tal cual? ¿Se añade alguno?
- La app muestra **instrucciones de emergencia** de inmediato.
- Se activa la ruta humana.
- **Escalado obligatorio a categoría `alto`.** El LLM no puede degradarlo.

> **[VALIDAR] — decisión clínica importante.** El resumen incluye *ideación suicida activa* en  
> el rojo, y eso es riesgo vital. Un sistema de reglas no puede evaluar intención ni letalidad  
> con la fiabilidad de una entrevista. Hay dos caminos:  
> **(a)** el rojo por reglas es una **señal de alarma que activa contacto humano inmediato**,  
> nunca una valoración de riesgo; o  
> **(b)** el rojo se limita a peligro **inminente y observable** (intento en curso, violencia  
> activa) y todo lo demás va a amarillo con revisión prioritaria.  
> Recomiendo **(a)** con el lenguaje ajustado: el sistema *avisa*, no *valora*.

---

## 5. Categoría del equipo — 2 categorías

**[VALIDAR] — aquí está el hueco principal.** El resumen no define medio ni alto. Propongo:

| Categoría | Significado propuesto                                                  | Origen                                                        |
| --------- | ---------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Alto**  | Requiere contacto humano **en el día**, con psicólogo implicado        | Rojo del joven siempre; amarillo con criterios de acumulación |
| **Medio** | Requiere revisión **programada**, puede resolverlo personal capacitado | Amarillo estándar                                             |

**Preguntas para el clínico:**

- ¿Qué distingue operativamente medio de alto? ¿Urgencia, complejidad, riesgo, o carga?
- ¿Qué combinaciones de factores suben un amarillo a alto? El resumen menciona  
  *frecuencia, persistencia, cambio respecto al registro anterior y acumulación de factores*.
- ¿Cuántos días puede esperar un caso `medio` sin que eso sea una negligencia?

---

## 6. Qué puede y qué no puede hacer el LLM

### 6.1 Puede

- Leer el reporte **ya cerrado y autorizado** por el joven.
- Proponer una categoría (`medio` / `alto`).
- Extraer características del caso para el emparejamiento.
- **Subir** de categoría.

### 6.2 No puede

- Conversar con el adolescente. La conversación es por reglas y guiones.
- **Bajar** un rojo.
- Diagnosticar, puntuar gravedad clínica ni estimar riesgo de vida.
- Decidir una derivación por sí solo.
- Cerrar un caso.
- Generar texto que llegue al joven sin revisión.

### 6.3 Trazabilidad obligatoria

Cada resultado del LLM debe registrar `modelVersion` + `promptVersion` + la entrada que lo  
produjo. Es el equivalente de `rulesetVersion` en `AttentionAssessment`: sin eso, una  
prioridad no es auditable.

### 6.4 Privacidad

- **Cláusula de no-reentrenamiento** sobre datos de menores (decisión D3).
- Los prompts no se conservan más allá de lo necesario para auditar.
- El modelo nunca recibe `ProfileId`, alias ni ningún identificador: solo el `caseToken` y el  
  contenido autorizado.

---

## 7. Quién responde y en cuánto tiempo

**Decisión D5: escalonado por gravedad.** Modelo de distribución de tareas del resumen §1.

| Categoría | Primer respondedor               | Escalado                    | Tiempo objetivo **[VALIDAR]**      |
| --------- | -------------------------------- | --------------------------- | ---------------------------------- |
| **Alto**  | Personal capacitado acusa recibo | Psicólogo asignado          | Acuse ≤ 5 min · psicólogo ≤ 30 min |
| **Medio** | Personal capacitado              | Psicólogo si no se resuelve | Acuse ≤ 4 h · resolución ≤ 24 h    |

**[VALIDAR]** Estos tiempos son una propuesta razonable, no un dato clínico. Hay que  
ajustarlos a la capacidad real del equipo: **prometer más de lo que se puede cumplir es peor  
que prometer menos** (P5).

---

## 8. Cobertura y honestidad

El resumen advierte: *"El mayor riesgo no es programar el chatbot, sino generar alertas que  
la ONG no pueda atender."*

**Regla:** la app declara su cobertura real y no la excede.

- Si hay guardia 24/7 → el flujo rojo puede prometer contacto inmediato.
- Si no la hay → el flujo rojo muestra **instrucciones de emergencia y números de crisis**, y  
  dice con claridad cuándo habrá respuesta humana.

La app **nunca** debe mostrar una pantalla de "estamos contigo" fuera de horario si no hay  
nadie. Esa es la diferencia entre un sistema honesto y uno que abandona.

**[VALIDAR]** ¿Existe equipo de guardia? ¿En qué horario? ¿Fines de semana?

---

## 9. Qué ve el joven en cada caso

| Situación        | Pantalla                   | Debe incluir                                                                   |
| ---------------- | -------------------------- | ------------------------------------------------------------------------------ |
| Verde            | Herramientas y recorrido   | Encuadre de prioridad preliminar                                               |
| Amarillo         | Nivel + opción de apoyo    | Qué cambió, por qué, qué pasa después                                          |
| Rojo             | Emergencia + ruta humana   | Instrucciones de emergencia, qué va a pasar, y **la verdad sobre los tiempos** |
| Reporte enviado  | Estado del caso            | Que una persona lo está revisando; nunca notas internas                        |
| Fuera de horario | Igual + aviso de cobertura | Números de emergencia reales                                                   |

Todo con **texto + icono + explicación**, nunca solo color (guardrail #1).

---

## 10. Fallos del sistema

| Fallo                          | Comportamiento exigido                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| El LLM no responde o tarda     | El caso entra como **alto** por defecto. Nunca se queda sin categoría                      |
| El LLM da un resultado absurdo | El psicólogo puede reclasificar manualmente; queda registrado                              |
| No hay red                     | El APK **no depende de la red para el nivel rojo**: muestra emergencia y encola el reporte |
| El joven pierde el dispositivo | **[VALIDAR]** ¿Cómo se recupera el vínculo con su caso? Ver §13                            |
| Clave local perdida            | El contenido es irrecuperable por diseño (decisión F6). El reporte ya enviado **no**       |

---

## 11. Eventos adversos

Tarea `TASK-017`. Todo caso `alto` y todo incidente debe registrarse:

- clasificación emitida y por quién;
- tiempo hasta el primer contacto humano;
- si hubo respuesta o no;
- falsos positivos y falsos negativos detectados;
- cualquier daño o queja.

El resumen lo exige en el MVP y Ball et al. 2026 lo justifica: *"el abandono es alto; el  
proyecto debe medir implementación y no solo resultados clínicos"*.

---

## 12. Métricas de seguridad

Del marco de evaluación del resumen (dimensión *Seguridad*):

- alertas revisadas / alertas emitidas;
- incidentes;
- **falsos positivos** (alarma sin riesgo real) — erosionan la confianza;
- **falsos negativos** (riesgo no detectado) — el fallo grave;
- **casos sin respuesta** — el más importante: alertas que nadie atendió;
- tiempo hasta contacto humano.

---

## 13. Preguntas que solo puede responder un clínico

1. ¿Los criterios de rojo del resumen se confirman tal cual?
2. ¿Qué distingue operativamente `medio` de `alto`?
3. ¿Qué combinaciones suben un amarillo a alto?
4. ¿Cuánto puede esperar un caso medio sin ser negligencia?
5. ¿Existe guardia fuera de horario? ¿Qué se promete entonces?
6. ¿Quién firma como responsable clínico del protocolo?
7. ¿Se acepta la lectura de rojo como *señal de alarma* y no como *valoración de riesgo*?
8. ¿Cómo se recupera el vínculo con un caso si el joven pierde el teléfono?
9. ¿Qué formación mínima debe tener el personal capacitado de primera línea?
10. ¿Qué se hace con un falso negativo detectado a posteriori?

---

## 14. Lo que hay que cerrar antes de construir

| Bloqueo                        | Depende de       |
| ------------------------------ | ---------------- |
| `TASK-005` (nivel de atención) | §4 y §5 firmados |


| `TASK-007` (apoyo humano) | §7 y §8 firmados |  
| `PR-005` (clasificador) | §5 y §6 firmados |  
| `PR-009` (SLA y cola) | §7 y §8 firmados |  
| `TASK-018` (prueba de seguridad) | Todo lo anterior |

---

## 15. Nota sobre el lenguaje

Este documento evita deliberadamente las palabras **"diagnóstico"**, **"riesgo suicida"** y  
**"gravedad clínica"** aplicadas al sistema. El sistema detecta **señales**, propone una  
**prioridad preliminar de revisión** y **activa a una persona**. La valoración es humana.

Esa distinción no es cosmética: es el guardrail #1 y es lo que permite que el proyecto sea  
defendible ante una competencia, ante una ONG y ante una familia.
