# Comparación — Plan de trabajo SDD vs. Resumen ejecutivo

**Fecha:** 2026-09-29
**Compara:** `puente-joven-android/deliverables/PLAN-TRABAJO-SDD.md` + `PLAN-PUENTE-RED.md`
**Contra:** `Resumen_ejecutivo_divorcio_y_chatbot V1.0 (1).docx` (168 nodos, 4 tablas)

---

## 0. Qué es cada documento

| | Resumen ejecutivo | Plan SDD |
|---|---|---|
| **Naturaleza** | Propuesta para una **competencia de innovación social** | Plan de ingeniería |
| **Contenido** | Problema, evidencia 2020-2026, propuesta de valor, diseño del chatbot, modelo de seguridad, plan de implementación en 5 fases, actores, recursos, viabilidad, impacto | Tareas, módulos, olas, paralelización, preguntas abiertas |
| **Unidad** | Fases de proyecto | Tareas técnicas |

**No compiten: se complementan.** Pero al leerlos juntos aparecen huecos y una contradicción
de fondo.

---

## 1. Huecos que el resumen revela (el plan no los tiene)

### 1.1 El MVP del resumen incluye dos cosas que el plan deja para después

El resumen (Fase 2) define el MVP así: *registro seguro · chequeo de riesgo · tres módulos
TCC prioritarios · **sistema de alertas** · **panel restringido para supervisores** ·
**directorio local de derivación** · registro de eventos adversos*.

| Pieza | En mi plan está en | Problema |
|---|---|---|
| Sistema de alertas | Ola 2 + Puente Red R2 | ✅ coherente |
| **Panel restringido para supervisores** | Puente Red, Ola R2 | ⚠️ el resumen lo quiere **en el MVP** |
| **Directorio local de derivación** | TASK-011, Ola 2 | ⚠️ el resumen lo quiere **en el MVP** |

Conclusión: **Puente Red no es "fase posterior", es parte del MVP.** Sin panel y directorio,
el nivel rojo no tiene destinatario.

### 1.2 Tareas que faltan por completo

| # | Hueco | Dónde lo dice el resumen |
|---|---|---|
| **H1** | **Registro de eventos adversos** | Fase 2, MVP |
| **H2** | **Prueba de seguridad con escenarios simulados** | Fase 3: *"Se simularán conversaciones de depresión, violencia, autolesión, intento suicida, consumo de alcohol, bullying y abandono. El criterio de avance será que cada escenario tenga una respuesta segura"* |
| **H3** | **Apoyo humano breve telefónico** | *"La experiencia internacional sugiere incluir apoyo humano breve. En Jordania, cinco llamadas semanales de 15 minutos..."* |
| **H4** | **Marco de evaluación (7 dimensiones)** | Tabla: alcance, uso, seguridad, derivación, aceptabilidad, resultados preliminares, implementación |
| **H5** | **Co-diseño con adolescentes** | Fase 1 |
| **H6** | **Registro de quién consultó cada caso** | §4: *"con registro de quién consultó cada caso"* |
| **H7** | **Modelo de amenaza de privacidad específico del divorcio** | §5: *"niños y familias rechazaron que las respuestas individuales pudieran utilizarse como arma en disputas"* |
| **H8** | **Modalidad de audio** | Fase 1: *"preferencias entre texto, audio y botones de respuesta"* |
| **H9** | **Piloto de 8-12 semanas** | Fase 4 |

H2 y H7 son los más importantes: H2 es un **criterio de avance** (gate) y H7 es un
**requisito de privacidad que hoy no está especificado en ninguna parte**.

---

## 2. Contradicciones entre el resumen y las decisiones tomadas

### 2.1 LLM vs. sistema de reglas — la contradicción principal

**El resumen es explícito en contra del LLM:**

> Tabla de viabilidad, dimensión **Técnica**:
> *"Es viable comenzar con **reglas y contenidos prediseñados, sin IA generativa abierta**
> (Bryant et al. 2026; Keyan et al. 2025)."*

> Tabla de evidencia, **Keyan et al. 2025 (chatbot de la OMS)**:
> *"Un **sistema basado en reglas**, con módulos breves y adaptación cultural, permite
> **controlar mejor el contenido y la seguridad**."*

**Y la decisión del 2026-09-29 fue:** un LLM con metodología clasifica en medio/alto.

Esto no es un matiz: **la viabilidad técnica del proyecto, tal como está argumentada ante la
competencia, se apoya en NO usar IA generativa abierta.** Hay que resolverlo antes de escribir
`PR-005`.

Lectura conciliadora posible: el LLM **no conversa** con el joven (eso queda en reglas), solo
**clasifica el reporte ya cerrado** en el backend, sin generar texto hacia el adolescente. Eso
sería compatible con el resumen y con el guardrail #3. **Pero hay que decirlo explícitamente.**

### 2.2 Dos esquemas de clasificación distintos

| | Resumen | Decisión 2026-09-29 |
|---|---|---|
| Niveles | **3**: verde / amarillo / rojo | **2**: medio / alto |
| Criterios | *Verde*: malestar leve, sin peligro inmediato, con apoyo. *Amarillo*: malestar persistente, factores acumulados, aislamiento, violencia no inmediata, deterioro escolar. *Rojo*: **ideación suicida activa, plan, intento reciente, autolesión, abuso o peligro inmediato** | Sin definir |

Los criterios del resumen **son mucho más concretos y clínicos** que los del código actual
(`AttentionLevel` solo tiene etiquetas genéricas). Y el rojo del resumen es **riesgo suicida**,
que es exactamente lo que el guardrail #3 dice que la app no debe manejar sola.

**Pregunta de fondo:** ¿son dos capas (3 niveles en el joven → 2 categorías en el backend) o
son el mismo sistema con dos nombres?

### 2.3 Quién responde: ¿psicólogo o personal capacitado?

| Fuente | Quién atiende |
|---|---|
| Resumen §1 | *"combinar herramientas digitales con **distribución de tareas**, apoyo de **personas no especialistas capacitadas**"* |
| Resumen §5 | *"Las alertas amarillas y rojas llegan a una **persona capacitada** de la ONG o de la red asociada"* |
| Decisión 2026-09-29 | El **psicólogo** acepta y coordina |

No es lo mismo. "Distribución de tareas" (*task-shifting*) es un modelo de salud pública donde
personal no especialista hace primera línea con supervisión. Eso cambia el perfil del
profesional, el motor de derivación y la carga del sistema.

### 2.4 "Chatbot" vs. "no es chat generativo"

El resumen usa **"chatbot"** y **"el agente"** en todo el documento. El código y el brief dicen
explícitamente *"No es un chat generativo abierto"*. Coinciden en el fondo (el propio resumen
cita el sistema de reglas de la OMS), pero **el vocabulario ante la competencia y el de la
ingeniería no son el mismo**. Conviene fijar uno.

### 2.5 Un guardrail nuevo

Resumen §5 añade uno que no está en el código:

> *"no recomendar **tratamientos farmacológicos**"*

---

## 3. Lo que el plan tiene y el resumen no menciona

| Elemento | Nota |
|---|---|
| **Ruta B "Quiero ayudar a alguien"** | El resumen **no la menciona en absoluto**. El brief de diseño la exige como flujo de primera clase (§18-19). **El resumen y el brief discrepan sobre el alcance.** |
| **Puente Red como producto con nombre** | El resumen habla de *"panel para que la ONG supervise"*, no de un producto aparte |
| **Dos portales en la pantalla de entrada** | El brief §3 lo pide; el resumen no lo contempla |
| **El problema de la MAC** | Solo aparece en el plan |
| **El hueco de persistencia** | Solo aparece en el plan |
| **Toda la ingeniería** | Módulos, olas, paralelización |

---

## 4. Evidencia del resumen que afecta a decisiones de diseño

### 4.1 Señales de cribado concretas (Sarfo 2026)

> *"El **sueño alterado por ansiedad**, la **violencia física**, el **aislamiento** y el
> **consumo de alcohol** son señales prioritarias para el cribado."*

Estas cuatro deberían estar en el chequeo contextual de `TASK-004`. Hoy el código tiene claves
genéricas (`hoy_como_estas`, `donde_ocurre`, `cada_cuanto`, `con_quien_puedes_contar`).

### 4.2 Módulos TCC: 8 definidos, 3 en el MVP

El resumen lista 8 módulos: nombrar emociones · respiración/regulación · higiene del sueño ·
reestructuración de pensamientos de culpa o desesperanza · resolución de problemas ·
activación conductual · autoeficacia · plan de apoyo y búsqueda de ayuda.

El MVP pide **"tres módulos TCC prioritarios"** — pero **no dice cuáles**. Los 3 actuales
(`breathe`, `write`, `listen`) no mapean limpiamente a esa lista.

### 4.3 El abandono es el riesgo principal (Ball et al. 2026)

> *"La adopción es posible, pero **el abandono es alto**; el proyecto debe **medir
> implementación y no solo resultados clínicos**."*

Esto justifica que H4 (marco de evaluación) sea una tarea formal y no un anexo.

### 4.4 Rechazo explícito a la IA que reemplaza (Poulsen et al. 2026; M. Li et al. 2026)

> *"La IA debe **apoyar, no reemplazar**, a las personas; las decisiones críticas requieren
> **supervisión humana, trazabilidad y responsabilidad definida**."*

Respalda el diseño del plan: el LLM propone, el humano acepta.

---

## 5. Impacto en el plan: tareas nuevas

| ID | Tarea | Frente | Ola |
|---|---|---|---|
| **TASK-017** | Registro de eventos adversos (H1) | APK + Red | 2 |
| **TASK-018** | Suite de prueba de seguridad con escenarios simulados (H2) — **criterio de avance** | Calidad | 2 |
| **TASK-019** | Apoyo humano breve telefónico / híbrido (H3) | Red | R3 |
| **TASK-020** | Marco de evaluación de 7 dimensiones (H4) | Red | R3 |
| **TASK-021** | Modelo de amenaza de privacidad en contexto de divorcio (H7) | Transversal | **0** |
| **TASK-022** | Co-diseño con adolescentes (H5) | Proyecto | 0 |
| **TASK-023** | Auditoría de consultas a casos (H6) | Red | R2 |
| **TASK-024** | Canal de audio (H8) — *sujeto a decisión* | APK | 3 |

TASK-021 es de **Ola 0** porque es un requisito de privacidad que condiciona el diseño del
reporte: si el contenido puede usarse en una disputa de custodia, cambia qué se guarda y qué
se comparte.

**Total actualizado: 37 + 8 = 45 tareas.**

---

## 6. Decisiones tomadas (2026-09-29, segunda ronda)

| # | Pregunta | Decisión | Impacto |
|---|---|---|---|
| **Q1** | ¿LLM o reglas? | **Se usa IA, con cuidado de privacidad.** "IA generativa abierta" se interpreta como *uso de los datos para reentrenamiento*, no como prohibición de LLM | El LLM se mantiene. Se añade un requisito de no-reentrenamiento. **Ver §7: la lectura tiene un matiz** |
| **Q2** | ¿3 niveles o 2 categorías? | **Dos capas (Propuesta A)** — ver §7 | Desbloquea TASK-005 y PR-005 |
| **Q3** | ¿MVP incluye panel y directorio? | **Sí, ambos en el MVP** | **Puente Red entra en el MVP.** Reordena las olas: PR-011 a PR-017 y TASK-011 suben |
| **Q4** | ¿Quién responde? | **Escalonado por gravedad** | Personal capacitado para amarillo/medio; psicólogo para rojo/alto. Cambia PR-007 y PR-008 |

---

## 7. Aclaración: los 3 niveles y las 2 categorías

### 7.1 De dónde sale cada cosa

**Los 3 niveles están en dos sitios:**

1. **El resumen**, §4 *"Clasificación de riesgo"* (nodos 47-50 del documento):
   - *Verde*: malestar leve, sin peligro inmediato y con apoyo disponible.
   - *Amarillo*: malestar persistente, varios factores acumulados, aislamiento, violencia no inmediata o deterioro escolar.
   - *Rojo*: ideación suicida activa, plan, intento reciente, autolesión, abuso o peligro inmediato.

2. **El código**, `core/model/Models.kt`, enum `AttentionLevel`:
   ```kotlin
   enum class AttentionLevel { GREEN, YELLOW, RED }
   ```
   con textos obligatorios *"Prioridad preliminar: verde / amarilla / roja"*.

**Las 2 categorías salen de tu respuesta del 2026-09-29:** el reporte *"se revisa con un
modelo aparte y se clasifica en 2 categorías medio y alto"*.

### 7.2 Por qué creo que son dos cosas distintas

Responden a preguntas diferentes:

| | 3 niveles (verde/amarillo/rojo) | 2 categorías (medio/alto) |
|---|---|---|
| **¿Quién lo ve?** | El joven | El equipo profesional |
| **¿Qué responde?** | "¿Qué te muestro y qué te ofrezco ahora?" | "¿Cuánta urgencia y carga tiene este caso?" |
| **¿Quién lo calcula?** | Reglas deterministas, versionadas (`rulesetVersion`) | LLM con metodología |
| **¿Dónde vive?** | APK juvenil | Backend |
| **¿Es explicable al joven?** | Sí, obligatorio (guardrail #1) | No hace falta |

Un caso puede ser **rojo para el joven** (hay que mostrarle ayuda humana ya) y **medio para el
equipo** (hay un psicólogo disponible en 10 minutos). Y al revés: un amarillo que se arrastra
tres semanas puede ser **alto** en carga operativa aunque clínicamente sea leve.

### 7.3 Propuestas

> **DECIDIDO el 2026-09-29: Propuesta A.** Dos capas, con la regla de que el LLM solo puede
> subir de categoría y nunca bajar un rojo.

**Propuesta A — Dos capas, y el LLM solo puede subir, nunca bajar.** ✅ **ADOPTADA**

```
APK juvenil (reglas, determinista)
   └─► verde | amarillo | rojo        ← lo que ve el joven
              │
              ├─ verde    → no se envía nada a Puente Red
              ├─ amarillo → se envía el reporte
              └─ rojo     → se envía el reporte Y se escala de inmediato
                                │
Backend (LLM)
   └─► medio | alto                   ← prioridad operativa del equipo
        · el LLM puede SUBIR una categoría
        · el LLM NUNCA puede BAJAR un rojo
```

Regla de seguridad derivada: **el rojo se determina por reglas, jamás por el LLM.** El LLM
solo refina dentro del caso ya escalado. Así el criterio clínico del resumen
(ideación suicida activa, plan, intento reciente…) queda en código auditable, y el LLM aporta
priorización sin poder desactivar una alarma.

**Propuesta B — Una sola escala de 3 niveles.** Se descarta medio/alto; el LLM ayuda a
afinar el nivel. Más simple, pero pierde la distinción entre "lo que ve el joven" y "la carga
del equipo", y deja al LLM dentro de la decisión clínica.

**Propuesta C — Una sola escala de 2 categorías.** Se descarta verde/amarillo/rojo y hay que
reescribir el resumen y el código. El joven necesitaría otra forma de entender su situación, y
el brief §13 ya define los tres textos.

### 7.4 El matiz sobre "sin IA generativa abierta"

Tu lectura (que se refiere al uso de datos para reentrenamiento) es defendible, pero conviene
saber que **la evidencia que el propio resumen cita apunta a otra cosa**:

> Keyan et al. 2025 (chatbot de la OMS): *"Un sistema **basado en reglas**, con módulos breves
> y adaptación cultural, permite **controlar mejor el contenido y la seguridad**."*

Ese argumento es sobre **control de contenido y seguridad**, no sobre reentrenamiento. Y la
tabla de viabilidad lo usa para justificar la dimensión *Técnica*.

**La propuesta A satisface ambas lecturas**: se usa LLM (tu decisión), pero la conversación con
el joven y la detección de rojo quedan en reglas auditables (lo que defiende la evidencia). Y
se añade explícitamente la cláusula de no-reentrenamiento sobre datos de menores.

---

## 8. Preguntas que siguen abiertas

| # | Pregunta |
|---|---|
| **Q2** | ¿Se adopta la Propuesta A (dos capas), B o C? |
| **Q5** | ¿Los 3 módulos TCC del MVP son cuáles? Hay 8 candidatos y el resumen no elige |
| **Q6** | ¿La Ruta B "Quiero ayudar" entra? El resumen no la menciona; el brief la exige |
| **Q7** | ¿El piloto de 8-12 semanas condiciona el alcance? |
| **Q8** | ¿La ONG es el único operador del panel? |
| **Q9** | ¿Se adopta el guardrail "no recomendar tratamientos farmacológicos"? |
| **Q10** | ¿Audio en el MVP? |
| **Q11** | ¿El resumen es documento vivo? Si va a la competencia, el plan debe alinearse con su vocabulario |
| **Q12** | ¿Con quién se contrata el LLM y bajo qué acuerdo de no-reentrenamiento? |

