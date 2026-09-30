<!-- Formato de CONTRATO-DE-INTEGRACION.md §2 · Declaración de necesidades del Agente C al Agente A -->

# NECESIDADES — PR-013

**Agente:** C · **Fecha:** 2026-09-30 · **Spec:** `specs/PR-013-ficha-caso.md`

> Los campos que no aplican a Puente Red van con `—` y su motivo
> (`specs/_PLANTILLA-SPEC.md` §1.2).

---

## 1. Módulo nuevo

**—** No es un módulo Gradle. Es `puente-red/backend/src/core/casefile/` y
`puente-red/portal/src/case/` (dueño: **C**).

## 2. Dependencia de build (la aplica A)

**—** Sin dependencia con el APK.

## 3. Ruta nueva en el NavHost

**—** El NavHost es del APK.

## 4. Entrada desde Home

**—** `feature/home/HomeScreen.kt` es del APK.

## 5. Métodos de repositorio

**—** C no consume `Repositories.kt`.

## 6. Componentes del design system

**—** `core/designsystem/**` es Compose y está congelado.

## 7. Otros

### 7.1 ⚠️ **Tres de las siete secciones no tienen fuente todavía**

El brief §24 pide 7 secciones. **Cuatro** tienen fuente hoy; **tres** no:

| Sección | Fuente que falta |
|---|---|
| 2 · Evolución longitudinal | `PR-006` + historial |
| 3 · Señales observadas | `PR-006` (`SignalTag`) |
| 4 · Factores protectores | `PR-006` (`ProtectiveFactor`) |

Las tres dependen del **`CaseFeatureSet` de `PR-006`**, que **no llega a la cola**. El pipeline
existe (`core/features`), pero nada lo conecta con `core/queue`.

**Lo que he hecho:** las tres secciones **aparecen igualmente** (criterio 1), con
`disponible: false` y el motivo `ficha.no_disponible.caracteristicas`. El portal lo explica en
pantalla.

**Por qué no las he omitido:** omitirlas en silencio haría creer al profesional que **ya las ha
visto** y que no hay nada que ver. Es la diferencia entre «no aplica» y «no está».

**Lo que hace falta** (decisión de A, es su contrato): que el caso lleve sus características desde
`PR-006` hasta la cola — o que `PR-013` las pida a `PR-006` por separado. La primera opción es más
simple y encaja con la máquina de estados: el caso se clasifica (`PR-005`), se le extraen las
características (`PR-006`) y ambas cosas quedan en su fila.

### 7.2 🐛 Un bug real: la cola no recibía sumidero de auditoría

`CaseQueue` se construía **sin `audit`**, así que usaba el sumidero nulo por defecto. Consecuencia:
`eventsFor()` devolvía **siempre vacío** y **la sección 7 de la ficha habría salido en blanco**
para todo caso, siempre.

Es **exactamente el mismo fallo** que ya apareció en `PR-010` con `AuthService`. Lo cazó una prueba
de la ficha, no la aplicación.

**Patrón a vigilar:** cualquier servicio que reciba un sumidero opcional y lo use para **leer**
(algo que el tipo no obliga a inyectar) se romperá en silencio. Ya van dos.

### 7.3 📝 Actualicé una aserción de `test/smoke.test.js` (archivo de A)

La prueba de humo de A afirmaba:

```js
const ajena = await api.request('/profesional/casos/xxx');
assert.equal(ajena.status, 501, 'Las rutas de C todavía no existen');
```

Esa aserción **ya no es cierta**: `/profesional/casos/:caseToken` existe (`PR-013`) y responde
`401` sin sesión. He cambiado la ruta por una que **sigue pendiente** (`/profesional/seguimientos`,
`PR-015`), **conservando el propósito** de la comprobación: que la superficie está separada.

**Es el único cambio que he hecho en un archivo de A**, está comentado en el propio test, y no
altera lo que la prueba verifica.

**Aviso para A:** cada vez que C implemente una ruta nueva, esa aserción habrá que moverla. Si
prefiere, puede comprobar la separación de otra forma (p. ej. que `/profesional/**` no responda
en `/joven/**`), y así no hay que tocarla más.

### 7.4 El expediente del caso: campos del Contrato A, no inventados

Para las secciones 1, 5 y 6 hacía falta llevar al caso lo que el **Contrato A ya define**
(`PR-003` §4): `motivo`, `resumenAutorizado` y `consentimiento`. Se ha añadido un `Expediente` al
ticket de la cola y a la entrada de ingesta.

**Nada de eso se inventa aquí**: son campos del contrato. Lo que **no** he añadido son las
características de `PR-006` (§7.1), porque su sitio en el contrato no está decidido.

**Nota sobre las herramientas (K3 de B):** la sección 5 sale de las entradas `Tool` del `scope`
autorizado. Si el joven no autorizó ninguna, **la sección está disponible y vacía** — que es un
dato, no una ausencia.

### 7.5 Criterio 3: lo que nunca se comparte se dice

La sección 6 incluye siempre `scope.conversacion_completa` y `scope.notas_internas` en
`noAutorizadoKeys`, y el portal los muestra como *"No autorizado para compartir"*.

No es una omisión: es el **brief §24 y el guardrail #5** puestos en pantalla. Si desaparecieran, el
profesional no sabría que existen y no puede pedirlos.

---

## 8. Estado

**Implementado y probado:**

| Qué | Resultado |
|---|---|
| `core/casefile/` (las 7 secciones) | 19 pruebas |
| `Expediente` en la cola + `eventsFor` | cubierto por las suites de cola y ficha |
| `portal/src/case/` (cliente) | 13 pruebas |
| Ruta `GET /casos/:caseToken` | 5 pruebas de superficie |
| **Backend completo** | **255/255 en verde** + `tsc` limpio |
| **Portal** | **62/62 en verde** + build correcto |

**Navegación real:** Inicio → Alertas → Ficha de caso (y vuelta). Los destinos pendientes siguen
deshabilitados con su tarea a la vista.

⚠️ **La interfaz no se ha verificado visualmente** (no hay navegador en el entorno).
