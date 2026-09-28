# Design System — Puente Joven La Paz

> Sistema visual del MVP Android de **Puente Joven La Paz** — editorial, cálida,
> premium y orgánica; deliberadamente distinta de un chatbot genérico.

Este documento es la **fuente única de verdad** del diseño. Toda pantalla del
proyecto debe leerse contra este archivo. La implementación vive en
`:core:designsystem`.

---

## Aesthetic

**Editorial cálido con formas orgánicas.**

Tres palabras: `editorial` · `orgánica` · `serena`.

El sistema traduce el MVP web (`Propuesta UX_UI Puente Joven`) a Android nativo
sin copiar HTML/Tailwind:
- **Serif editorial para lo humano** (Fraunces en titulares, con peso Light).
- **Sans neutro para el cuerpo** (Manrope).
- **Mono con tracking amplio para las etiquetas** (DM Mono, mayúsculas).
- **Formas blob** como firma: ningún contenedor principal es un rectángulo puro.
- **Mucho aire**: el espacio en blanco es parte del mensaje, no un hueco a rellenar.

**Material 3 es infraestructura, no estética.** Se usa para ripple, semántica y
primitivas; nunca se entrega una pantalla Material por defecto.

---

## Colors

Tokens exactos del MVP web. Fuente: `PuentePalette.kt`.

### Marca y acentos

| Token | HEX | Uso |
|---|---|---|
| `indigo` | `#5B5CF0` | Color primario, énfasis de titular, activo |
| `indigoDeep` | `#4338CA` | Fin de gradiente, presión de acción principal |
| `indigoSoft` | `#818CF8` | Acentos suaves, contenedores |
| `teal` | `#14B8A6` | Acento secundario, privacidad, "ayudar" |
| `mint` | `#5EEAD4` | Énfasis sobre oscuro, fin de gradiente teal |
| `lavender` | `#A78BFA` | Inicio del gradiente del orbe |
| `coral` | `#FB7185` | Señales de frecuencia |

### Superficies y tinta

| Token | HEX | Uso |
|---|---|---|
| `bg` | `#F7F8FC` | Fondo de pantalla |
| `surface0` | `#FFFFFF` | Tarjetas |
| `surface1` | `#F0F1FA` | Contenedores secundarios |
| `surface2` | `#E4E6F5` | Bordes y separadores |
| `ink1` | `#111827` | Texto principal |
| `ink2` | `#374151` | Texto secundario |
| `ink3` | `#6B7280` | Texto de apoyo |
| `ink4` | `#9CA3AF` | Etiquetas y metadatos |

### Semánticos

| Token | HEX | Uso |
|---|---|---|
| `green` | `#22C55E` | Prioridad preliminar verde |
| `yellow` | `#F59E0B` | Prioridad preliminar amarilla |
| `red` | `#EF4444` | Prioridad preliminar roja |
| `greenInk` | `#16A34A` | Texto del nivel verde (contraste) |
| `yellowInk` | `#D97706` | Texto del nivel amarillo (contraste) |

### Superficies oscuras editoriales

Usadas por la tarjeta oscura del Home ("Mi recorrido"), igual que en el MVP web.
**No representan ninguna superficie profesional.**

| Token | HEX |
|---|---|
| `darkSurfaceBg` | `#111827` |
| `deepBg` | `#0D0F1A` |
| `deepSurface` | `#141622` |
| `deepCard` | `#1C1F33` |
| `deepText` | `#E8EAFF` |
| `deepMuted` | `#6B7899` |
| `deepBorder` | `rgba(255,255,255,0.07)` |

### Gradientes (tokens, no literales)

| Token | Definición | Uso |
|---|---|---|
| `orbBrush` | radial, foco 35%/30%: lavanda → índigo → teal | Núcleo del orbe |
| `orbGlowBrush` | radial, mismo recorrido al 30% | Halo del orbe |
| `heroBrush` | linear 145°: `#4338CA` → `#5B5CF0` → `#7C3AED` | Módulo "Me está pasando algo" |
| `primaryActionBrush` | linear 135°: índigo → índigo-deep | Acción principal en claro |
| `tealBrush` | linear: teal → menta | Tarjeta "Quiero ayudar a alguien" |
| `timelineBrush` | vertical: índigo → índigo-deep | Conector del recorrido |
| `ambientBrush` | linear 135°: índigo → lavanda | Formas ambientales de fondo |

### Regla crítica de color y prioridad

> **Verde / amarillo / rojo = prioridad preliminar de revisión, NUNCA diagnóstico
> ni garantía de seguridad.**

Ninguna superficie puede mostrar el color sin **texto + icono + explicación**.
`AttentionCard` implementa esto de forma redundante y obligatoria. Ver
*Components → AttentionCard*.

### Modo oscuro

El MVP prioriza la superficie clara editorial. Existe un esquema oscuro reservado
en `PuenteTheme.kt` pero **no se activa**: el MVP no lo necesita y no se debe
entregar un dark mode a medias.

---

## Typography

Tres familias **empaquetadas** en `:core:designsystem/src/main/res/font/`.
**No se descargan fuentes en tiempo de ejecución.**

| Familia | Rol | Archivo | Licencia |
|---|---|---|---|
| **Fraunces** | Display / titulares, serif editorial | `fraunces_variable.ttf` | SIL OFL 1.1 |
| **Manrope** | Sans / cuerpo y UI | `manrope_variable.ttf` | SIL OFL 1.1 |
| **DM Mono** | Etiquetas en mayúsculas, tracking amplio | `dmmono_regular.ttf` | SIL OFL 1.1 |

### Decisión técnica sobre las fuentes

Las tres son **fuentes variables** obtenidas de `github.com/google/fonts`
(licencia SIL Open Font License 1.1) y **copiadas al repositorio**. Se optó por el
paquete real en lugar de un fallback de sistema porque la tipografía es parte de
la identidad del producto y un fallback degradaría la estética (DoD global:
"no degrada la estética de referencia").

Android no expone de forma fiable los ejes variables en `res/font/`, así que cada
archivo se declara con varios `FontWeight` y Compose selecciona el punto más
cercano del eje `wght`. Los pesos usados son: Light 300, Regular 400, Medium 500,
SemiBold 600, Bold 700, ExtraBold 800.

### Escala tipográfica

| Estilo | Familia | Peso | Tamaño / Interlínea | Uso |
|---|---|---|---|---|
| `displayLarge` | Fraunces | Light | 56 / 61 | Titular hero de escritorio |
| `displayMedium` | Fraunces | Light | 44 / 48 | Titular hero |
| `displaySmall` | Fraunces | Light | 36 / 40 | Titular de Entry |
| `headlineLarge` | Fraunces | Medium | 30 / 37 | Nombre del joven |
| `headlineMedium` | Fraunces | Light | 26 / 33 | Titular de sección |
| `headlineSmall` | Fraunces | Light | 24 / 30 | Marca |
| `titleLarge` | Fraunces | Medium | 20 / 26 | Título de tarjeta |
| `titleMedium` | Manrope | SemiBold | 16 / 22 | Encabezado menor |
| `titleSmall` | Manrope | Medium | 14 / 20 | Nombre de bloque |
| `bodyLarge` | Manrope | Regular | 16 / 24 | Lectura principal |
| `bodyMedium` | Manrope | Regular | 14 / 21 | Cuerpo estándar |
| `bodySmall` | Manrope | Regular | 13 / 19 | Notas |
| `labelLarge` | Manrope | SemiBold | 15 / 20 | Texto de botón |
| `labelMedium` | DM Mono | Medium | 11 / 15 (+1.6) | Etiqueta |
| `labelSmall` | DM Mono | Normal | 10 / 14 (+1.6) | Etiqueta mínima |

### Estilos extendidos (fuera del enum de Material)

| Estilo | Definición | Uso |
|---|---|---|
| `MonoLabel` | DM Mono Medium 10 / 14, tracking +1.8 | Etiquetas `TRACKING-WIDEST` |
| `MonoLabelLarge` | DM Mono Medium 11 / 15, tracking +1.8 | Etiqueta de nivel |
| `Quote` | Manrope italic 13 / 19, `ink3` | Frase textual del joven |

---

## Layout & Spacing

**Base 4dp.** No se admiten valores sueltos fuera de la escala.

| Token | Valor | Token | Valor |
|---|---|---|---|
| `none` | 0dp | `lg` | 20dp |
| `xxxs` | 2dp | `xl` | 24dp |
| `xxs` | 4dp | `xxl` | 32dp |
| `xs` | 8dp | `xxxl` | 40dp |
| `sm` | 12dp | `huge` | 48dp |
| `md` | 16dp | `giant` | 64dp |

- `screenHorizontal` = **20dp** (equivalente a `px-5` del MVP web).
- `screenHorizontalWide` = **32dp** (equivalente a `px-8`).
- `minTouchTarget` = **48dp**.

### Radios

| Token | Valor | Uso |
|---|---|---|
| `xs` | 8dp | Chips, cuadros |
| `sm` | 12dp | Botones compactos |
| `md` | 16dp | Campos, botones |
| `lg` | 20dp | Tarjetas secundarias |
| `xl` | 24dp | Tarjetas principales, hero |
| `pill` | 999dp | Píldoras |

### Formas orgánicas (blob)

Con `border-radius` porcentual en dos ejes, traducido a 8 curvas cúbicas en
`BlobShape`:

| Forma | CSS original | Uso |
|---|---|---|
| `Blob1` | `60% 40% 70% 30% / 50% 60% 40% 70%` | Orbe, formas ambientales |
| `Blob2` | `40% 60% 30% 70% / 60% 40% 70% 30%` | Ambientales secundarias |
| `Blob3` | `50% 50% 60% 40% / 40% 60% 40% 60%` | Iconos orgánicos |

### Elevación

`none` 0 · `subtle` 1 · `low` 3 · `medium` 6 · `high` 12 dp.
El MVP web es mayoritariamente plano: la sombra aparece al interactuar.

### Responsive

- Ancho compacto de teléfono (**360dp**) es el objetivo de diseño y de revisión.
- El contenido va en una sola columna con scroll vertical.
- Las listas horizontales (recursos, chips) usan `LazyRow`.

---

## Components

Todos en `:core:designsystem`. Ningún componente declara colores literales fuera
del tema (salvo los gradientes definidos como token).

### `PuenteOrb`

Firma de la marca. Cuatro capas: halo difuminado (radial al 30%, blur
`size*0.15`, escala 1.2), núcleo `Blob1` con gradiente radial a foco 35%/30%,
brillo interior blanco al 22%/18% al 50%, y animación (pulso 1→1.04 en 3s +
rotación 8s).

```kotlin
PuenteOrb(
    modifier: Modifier = Modifier,
    size: Dp = 48.dp,
    animated: Boolean = true,          // false = estático (previews/snapshots)
    contentDescription: String? = null // null = decorativo
)
```

**Respeta reducción de movimiento**: sin pulso ni rotación cuando
`ANIMATOR_DURATION_SCALE == 0`.

### `EditorialHeader` / `EditorialHeaderWithSubtitle`

Etiqueta mono en mayúsculas + titular Fraunces, con acento de color en la última
línea. El titular lleva semántica `heading()`.

```kotlin
EditorialHeader(
    label: String,
    titleLines: List<String>,
    modifier: Modifier = Modifier,
    accentLastLine: Boolean = true,
    accentColor: Color = PuenteTheme.colors.indigo,
    trailing: (@Composable () -> Unit)? = null,
)
```

### `PrimaryAction` / `SecondaryAction` / `TertiaryAction`

- `PrimaryAction`: gradiente índigo en claro, relleno blanco con texto índigo
  en oscuro (`onDarkSurface = true`).
- `SecondaryAction`: borde índigo suave (claro) / borde blanco translúcido (oscuro).
- `TertiaryAction`: solo texto.

Estados: `Enabled` · `Disabled` · `Loading`. Altura mínima 48dp, rol `Button`,
`disabled()` cuando no está habilitado y `contentDescription` durante la carga.

```kotlin
PrimaryAction(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    state: PuenteButtonState = PuenteButtonState.Enabled,
    onDarkSurface: Boolean = false,
    fullWidth: Boolean = true,
    leadingIcon: (@Composable () -> Unit)? = null,
    loadingDescription: String = "Cargando",
    shape: Shape = RoundedCornerShape(PuenteTheme.radius.md),
)
```

### `SignalChip`

Distintivo compacto: fondo del color al 10%, borde al 20%, texto del color
(seleccionado: relleno sólido). Añade tendencia (`↑ En aumento`) cuando aplica.
La descripción accesible incluye etiqueta **y** tendencia.

```kotlin
SignalChip(
    label: String,
    modifier: Modifier = Modifier,
    accentColor: Color = PuenteTheme.colors.indigo,
    trend: TrendDirection? = null,
    selected: Boolean = false,
    onClick: (() -> Unit)? = null,
    minTouchTarget: Boolean = true,
)
```

### `AttentionCard` — crítica de seguridad

Muestra siempre, de forma redundante:
1. el **color** del nivel,
2. un **texto** explícito ("PRIORIDAD PRELIMINAR: AMARILLA"),
3. un **icono** distinto por nivel (check / atención / alerta),
4. el encuadre obligatorio: *"Esta es una prioridad preliminar de revisión, no un
   diagnóstico."* y *"Ninguna prioridad reemplaza a una persona."*

Todo el bloque se anuncia al lector de pantalla como una sola unidad.

```kotlin
AttentionCard(
    level: AttentionLevel,
    title: String,
    explanation: String,
    whatChanged: String,
    nextStep: String? = null,
    modifier: Modifier = Modifier,
    isPreliminary: Boolean = true,   // debe ser true en el MVP
)
```

Iconos: `attentionIcon(level)` · Etiqueta accesible:
`attentionAccessibilityLabel(level)`.

### `EvidenceCard`

Entrada de la línea temporal: nodo numerado sobre el conector, fecha en mono,
etiqueta, la frase textual del joven entre comillas y los distintivos de contexto.
`IntensityMeter` marca 1..4 cuadros — la intensidad es *proximidad a una señal
prioritaria de revisión*, **no gravedad clínica**, y no se anuncia como número.

```kotlin
EvidenceCard(
    evidence: SignalEvidence,
    modifier: Modifier = Modifier,
    index: Int = 1,
    accentColor: Color = PuenteTheme.colors.indigo,
    showConnector: Boolean = true,
    onClick: (() -> Unit)? = null,
)
```

### `SummaryCard` + `SummaryItem`

"Hoja de decisión": cada elemento se ve como una fila con icono de
incluido/excluido, para que quede inequívoco qué sale del dispositivo.

```kotlin
SummaryCard(
    title: String,
    items: List<SummaryItem>,
    modifier: Modifier = Modifier,
    label: String = "Resumen",
    footnote: String? = null,
    onDarkSurface: Boolean = false,
)
SummaryItem(key: String, label: String, included: Boolean, detail: String? = null)
```

### `PuenteBottomNavigation`

Cuatro destinos etiquetados (`Inicio`, `Hablar`, `Recorrido`, `Ayudar`), activo en
índigo con punto inferior. Área táctil ≥ 48dp, `selected` anunciado.

```kotlin
PuenteBottomNavigation(
    items: List<PuenteNavItem>,
    selectedKey: String?,
    onSelect: (PuenteNavItem) -> Unit,
    modifier: Modifier = Modifier,
)
PuenteNavItem(key: String, label: String, icon: ImageVector)
PuenteNavDestinations.Default
```

### `LoadingState` / `ErrorState` / `EmptyState` / `InlineLoading`

- Carga: usa el **orbe** como indicador, nunca un spinner Material genérico.
- Error: mensaje claro, sin jerga ni datos sensibles, con salida opcional.
- Vacío: tono editorial y cálido; "todavía no hay nada registrado", no "sin resultados".

### `ResourceCard`

Tarjeta de herramienta breve (emoji decorativo + nombre + duración).

### `PuenteSwitch`

Interruptor accesible para consentimiento y ajustes de privacidad. Anuncia
"activado/desactivado".

### `PlaceholderScreen`

Pantalla de destino aún no implementado, para que el grafo completo sea recorrible
sin inventar UI ajena. Mantiene la identidad (orbe + etiqueta mono + titular).

---

## Motion

Duraciones fieles al MVP web (`transition-smooth` = 250ms):

| Token | Valor | Origen en el web |
|---|---|---|
| `instant` | 180ms | `.transition-smooth` de presión (0.18s) |
| `standard` | 250ms | `.transition-smooth` (0.25s) |
| `entrance` | 400ms | `animate-float` (0.5s aprox.) |
| `orbPulse` | 3000ms | `orb-pulse` |
| `orbInner` | 8000ms | `orb-inner` |

Curva estándar: `EaseInOut` ≈ `cubic-bezier(0.4, 0, 0.2, 1)`.

### Reducción de movimiento (obligatorio)

`rememberReducedMotion()` lee `Settings.Global.ANIMATOR_DURATION_SCALE`. Con
movimiento reducido:
- `rememberPulse` y `rememberSlowRotation` devuelven valores estáticos,
- `motionAwareTween` se convierte en `snap()`.

**Todo componente animado debe pasar por estas utilidades.**

---

## Accessibility

- Objetivos táctiles de **≥ 48dp** (`PuenteTheme.spacing.minTouchTarget`).
- Escala de fuente: se usan `sp` en toda la tipografía; la UI no fija tamaños en dp.
- Contraste: los colores de tinta por nivel (`greenInk`, `yellowInk`) se eligen para
  contraste sobre fondo claro.
- Semántica: titulares con `heading()`, botones con rol `Button`, destinos con
  `selected`, iconos decorativos con `contentDescription = null`.
- **Ninguna información se transmite solo por color.** Toda señal cromática lleva
  texto e icono, y su descripción accesible es completa.
- Reducción de movimiento respetada en todo el sistema.

---

## Guardrails que afectan al diseño

1. Verde/amarillo/rojo es prioridad preliminar de revisión, nunca diagnóstico.
2. La app Android solo contiene **Puente Joven**. Ninguna pantalla referencia ni
   navega a un panel profesional (**Puente Red** es un sistema web/tablet aparte).
3. El chat personal es privado y localmente cifrado; un profesional no recibe la
   conversación completa.
4. El orbe y los estados de prioridad no pueden degradarse a Material genérico.

---

## Implementación

```
:core:designsystem
  theme/    PuentePalette · PuenteColors · PuenteTypography
            PuenteDimensions (spacing/radius/elevation/motion)
            PuenteMaterialShapes · PuenteTheme
  shape/    BlobShape · PuenteShapes
  motion/   PuenteEasing · rememberReducedMotion · rememberPulse · rememberSlowRotation
  component/ PuenteOrb · EditorialHeader · PuenteActions · SignalChip ·
             AttentionCard · EvidenceCard · SummaryCard · PuenteBottomNavigation ·
             PuenteStates · PlaceholderScreen
  preview/  PuenteDesignSystemGallery (galería de revisión visual)
  res/font/ fraunces_variable.ttf · manrope_variable.ttf · dmmono_regular.ttf
```

### Acceso a los tokens

```kotlin
PuenteTheme {
    PuenteTheme.colors    // PuenteColors
    PuenteTheme.spacing   // PuenteSpacing
    PuenteTheme.radius    // PuenteRadius
    PuenteTheme.elevation // PuenteElevation
    PuenteTheme.motion    // PuenteMotionDurations
    PuenteTheme.typography // PuenteTypography (estilos extendidos)
}
```

### Galería de revisión

`:app` en debug monta `DesignSystemGalleryActivity`:

```bash
adb shell am start -n bo.puentejoven.app/.debug.DesignSystemGalleryActivity
```

También disponible como `@Preview` compacto (360dp) en Android Studio:
`PuenteDesignSystemGallery`.

---

## Fidelidad al MVP web

Auditoría del design system Android contra la referencia web **real**
(`prueba_movil/Propuesta UX_UI Puente Joven/`, dentro del workspace del proyecto).

Fuentes comparadas:
- `src/index.css` (bloque `@theme inline`, `.blob-*`, `.signal-*`, `.timeline-connector`)
- `src/components/PuenteOrb.tsx`
- `src/screens/EntryScreen.tsx`, `JovenLoginScreen.tsx`, `HomeJoven.tsx`,
  `SignalsScreen.tsx`, `AttentionLevelScreen.tsx`, `RouteScreen.tsx`

Estado: **✔ fiel** · **⚠ desviación** · **✖ falta**

### Tokens de color (los 19 hex)

| Token web (`index.css`) | Valor web | Valor Android (`PuentePalette`) | Estado |
|---|---|---|---|
| `--color-indigo` | `#5B5CF0` | `Indigo = 0xFF5B5CF0` | ✔ |
| `--color-indigo-deep` | `#4338CA` | `IndigoDeep = 0xFF4338CA` | ✔ |
| `--color-indigo-soft` | `#818CF8` | `IndigoSoft = 0xFF818CF8` | ✔ |
| `--color-teal` | `#14B8A6` | `Teal = 0xFF14B8A6` | ✔ |
| `--color-mint` | `#5EEAD4` | `Mint = 0xFF5EEAD4` | ✔ |
| `--color-lavender` | `#A78BFA` | `Lavender = 0xFFA78BFA` | ✔ |
| `--color-coral` | `#FB7185` | `Coral = 0xFFFB7185` | ✔ |
| `--color-bg` | `#F7F8FC` | `Bg = 0xFFF7F8FC` | ✔ |
| `--color-dark` | `#111827` | `Dark = 0xFF111827` | ✔ |
| `--color-green` | `#22C55E` | `Green = 0xFF22C55E` | ✔ |
| `--color-yellow` | `#F59E0B` | `Yellow = 0xFFF59E0B` | ✔ |
| `--color-red` | `#EF4444` | `Red = 0xFFEF4444` | ✔ |
| `--color-surface-0` | `#FFFFFF` | `Surface0 = 0xFFFFFFFF` | ✔ |
| `--color-surface-1` | `#F0F1FA` | `Surface1 = 0xFFF0F1FA` | ✔ |
| `--color-surface-2` | `#E4E6F5` | `Surface2 = 0xFFE4E6F5` | ✔ |
| `--color-ink-1` | `#111827` | `Ink1 = 0xFF111827` | ✔ |
| `--color-ink-2` | `#374151` | `Ink2 = 0xFF374151` | ✔ |
| `--color-ink-3` | `#6B7280` | `Ink3 = 0xFF6B7280` | ✔ |
| `--color-ink-4` | `#9CA3AF` | `Ink4 = 0xFF9CA3AF` | ✔ |

**Resultado: los 19 hex coinciden exactamente. Sin discrepancias.**

Tokens de soporte (no cuentan entre los 19 pero se usan en el MVP):

| Token | Valor web | Android | Estado |
|---|---|---|---|
| `.signal-moderate` ink | `#D97706` | `YellowInk` | ✔ |
| `.signal-stable` ink | `#16A34A` | `GreenInk` | ✔ |
| hero final | `#7C3AED` | `HeroViolet` (privado) | ✔ |
| `--color-pro-border` | `rgba(255,255,255,0.07)` | `ProBorder = 0x12FFFFFF` | ⚠ (ver nota) |

**Nota `ProBorder` (⚠ aceptado):** `0.07 × 255 = 17.85`, que en alfa de 8 bits es
`18 = 0x12` (7.06% real). Compose no admite alfa de coma flotante en un `Color`
hex; 18/255 es la representación más cercana. La diferencia visual es imperceptible
(0.06 puntos porcentuales).

### Orbe (`PuenteOrb.tsx` → `PuenteOrb.kt`)

| Elemento | Valor web | Android | Estado |
|---|---|---|---|
| Halo: gradiente | `radial-gradient(circle at 40% 35%, #A78BFA, #5B5CF0, #14B8A6)` | `orbGlowBrush(centerX=0.40, centerY=0.35)` | ✔ (corregido) |
| Halo: opacidad | `opacity-30` | alfa 0.30 en los 3 colores | ✔ |
| Halo: desenfoque | `blur(size*0.15)` | `blur(size * 0.15f)` | ✔ |
| Halo: escala | `scale(1.2)` | `.scale(1.2f)` | ✔ |
| Núcleo: forma | `.blob-1` | `PuenteShapes.Blob1` (misma geometría) | ✔ |
| Núcleo: gradiente | `radial-gradient(circle at 35% 30%, #A78BFA 0%, #5B5CF0 45%, #14B8A6 100%)` | `drawOrbCore()` con `colorStops 0/0.45/1.0` y foco (0.35, 0.30) | ✔ (corregido) |
| Brillo: tamaño | `size*0.28` | `size * 0.28f` | ✔ |
| Brillo: posición | `top: size*0.18; left: size*0.22` | `offsetProportional(0.18, 0.22)` | ✔ |
| Brillo: degradado | `radial-gradient(circle, rgba(255,255,255,0.85), transparent)` + `opacity-50` | blanco alfa **0.425** (0.85 × 0.5) → transparente | ✔ (corregido) |
| Animación: pulso | `orb-pulse` 3s, escala 1→1.04 | `rememberPulse(3000, 1f, 1.04f)` | ✔ |
| Animación: rotación | `orb-inner` 8s sobre el orbe | `rememberSlowRotation(8000)` sobre el núcleo | ✔ (corregido) |

**Correcciones aplicadas al orbe:**
1. El halo usaba un gradiente centrado (50%/50%); ahora usa foco **(40%, 35%)**
   como el web.
2. El núcleo usaba paros uniformes; ahora usa **0% / 45% / 100%** explícitos
   (`colorStops`) para reproducir el reparto real lavanda→índigo→teal.
3. El brillo tenía un desenfoque extra (`blur(size*0.04)`) que el web no tiene;
   se redujo a `blur(size*0.02)` y se aplicó el alfa compuesto 0.425 (0.85 ×
   `opacity-50`).
4. La rotación lenta estaba aplicada al brillo; en el web `animate-orb-inner`
   rota el **orbe**, así que se movió al núcleo.

### Gradientes de marca (`PuenteColors`)

| Elemento | Valor web | Android (antes) | Android (ahora) | Estado |
|---|---|---|---|---|
| Hero "Me está pasando algo" | `145deg, #4338CA 0%, #5B5CF0 50%, #7C3AED 100%` | lineal sin dirección | `start=Zero, end=Infinite` (diagonal) | ✔ (corregido) |
| CTA principal claro | `135deg, #5B5CF0, #4338CA` | lineal sin dirección | `start=Zero, end=Infinite` | ✔ (corregido) |
| Acento teal | `135deg, #14B8A6, #5EEAD4` | lineal sin dirección | `start=Zero, end=Infinite` | ✔ (corregido) |
| `.timeline-connector` | `to bottom, #5B5CF0 0%, #14B8A6 100%` | índigo→índigo-deep | `timelineBrush` índigo→teal | ✔ (corregido) |
| Timeline de señales | `to bottom, #5B5CF0, #4338CA` | (no existía) | `signalTimelineBrush` índigo→índigo-deep | ✔ (añadido) |
| Ambiental claro | `135deg, #5B5CF0, #A78BFA` | lineal sin dirección | `start=Zero, end=Infinite` | ✔ (corregido) |

### Tarjeta de nivel (`AttentionLevelScreen.tsx` → `AttentionCard.kt`)

| Elemento | Valor web | Android | Estado |
|---|---|---|---|
| Fondo de tarjeta | `linear-gradient(145deg, ${color}15 0%, ${color}08 100%)` | `attentionCardBrush(level)` alfa 0.082→0.031 | ✔ (corregido) |
| Borde de tarjeta | `2px solid ${color}30` | `border(2.dp, attentionBorder)` alfa 0.188 | ✔ |
| Distintivo | `background: ${color}18; border: ${color}40` | `attentionBadgeContainer` alfa 0.094 | ✔ |
| Caja "QUÉ CAMBIÓ" | `background: ${color}08; border: ${color}20` | `attentionContainer` 0.031 + `attentionBorderSoft` 0.125 | ✔ (corregido) |
| Blob ambiental | `.blob-1` al 20% del color | `Blob1` + alfa 0.20 | ✔ |
| Etiqueta "NIVEL X" | mono, tracking-widest | `MonoLabelLarge` | ⚠ (ver nota) |

**Nota etiqueta de nivel (⚠ aceptado):** el MVP web pinta `NIVEL AMARILLO` con el
color puro del nivel. La app Android muestra **`PRIORIDAD PRELIMINAR: AMARILLA`**
(guardrail #1): la palabra "preliminar" es obligatoria y no puede eliminarse para
copiar el texto del web. Es una **desviación intencional y permanente**.

### Formas orgánicas `.blob-*`

| Forma | Valor web | Android | Estado |
|---|---|---|---|
| `.blob-1` | `60% 40% 70% 30% / 50% 60% 40% 70%` | `BlobCorner`s idénticos | ✔ |
| `.blob-2` | `40% 60% 30% 70% / 60% 40% 70% 30%` | idénticos | ✔ |
| `.blob-3` | `50% 50% 60% 40% / 40% 60% 40% 60%` | idénticos | ✔ |

Diferencia técnica: el navegador redondea con **arcos elípticos exactos**; Compose
no expone porcentajes por eje, así que se aproximan con **8 curvas cúbicas**
(`BlobShape`). La silueta asimétrica y no-circular se conserva; no es una réplica
matemática píxel-perfecta. **Aceptado** (limitación de plataforma, no descuido).

### Tipografía

| Rol | Web | Android | Estado |
|---|---|---|---|
| Display | `Fraunces` (serif, variable) | `Fraunces` variable empaquetada | ✔ |
| Sans | `Manrope` variable | `Manrope` variable empaquetada | ✔ |
| Mono | `DM Mono` | `DM Mono` empaquetada | ✔ |
| Etiquetas | `font-mono tracking-widest uppercase` | `MonoLabel`/`MonoLabelLarge` (letterSpacing 1.6–1.8sp) | ✔ |
| Titular hero | `text-[56px] font-light leading-[1.1] tracking-tight` | `displayLarge` 56sp Light, lineHeight 61sp (1.1), letterSpacing -0.5sp | ✔ |

**Nota (⚠ aceptado):** la web usa los ejes variables reales (`opsz`, `wght`, `ital`);
Android declara la familia una vez por peso y deja que el sistema sintetice. La
intención tipográfica (pesos 300/400/500/600/700) se conserva. En `res/font/` solo
se declara lo que Compose puede resolver de forma fiable.

### Barra inferior (`HomeJoven.tsx` → `PuenteBottomNavigation.kt`)

| Elemento | Valor web | Android | Estado |
|---|---|---|---|
| Destinos | Inicio · Hablar · Recorrido · Ayudar | mismos 4 | ✔ |
| Activo | `text-[#5B5CF0]` + punto inferior | índigo + dot 4dp | ✔ |
| Inactivo | `text-[#9CA3AF]` | `ink4` | ✔ |
| Fondo | `bg-white/90 backdrop-blur-xl border-t` | `surface0` al 0.94 + separador `surface2` | ✔ |

**Nota (⚠ aceptado):** el web usa `backdrop-blur-xl` (desenfoque del contenido
detrás). En Compose se aplica un fondo blanco casi opaco (0.94) por coste de
render; el efecto visual es equivalente en la práctica. **Aceptado.**

### Estados y movimientos

| Elemento | Web | Android | Estado |
|---|---|---|---|
| Transición estándar | `0.25s cubic-bezier(0.4,0,0.2,1)` | `standard = 250ms`, `EaseInOut` | ✔ |
| Aparición | `animate-float` (0.5s) | `entrance = 400ms` | ⚠ (ver nota) |
| Nodos | `animate-node` `cubic-bezier(0.34,1.56,0.64,1)` | no implementado aún | ✖ (pendiente) |
| Reducción de movimiento | — (el web no lo respeta) | `rememberReducedMotion()` + snap | ✔ (mejora Android) |

**Nota `entrance` (⚠ aceptado):** el web usa 0.5s; Android usa 400ms. En una app
móvil una entrada de 500ms se percibe lenta; 400ms conserva la sensación editorial
con mejor respuesta. **Aceptado** (ajuste de plataforma).

**Nota `animate-node` (✖ pendiente):** el "rebote" de aparición de nodos
(`cubic-bezier(0.34,1.56,0.64,1)`) no está implementado. Se resolverá al construir
las pantallas de señales/mapa (TASK-005), no en el design system base.

### Desviaciones aceptadas — resumen

| # | Desviación | Motivo | Reversible |
|---|---|---|---|
| D1 | `ProBorder` = `0x12` en vez de `rgba(255,255,255,0.07)` | Compose no acepta alfa fraccionario en hex | No (plataforma) |
| D2 | Etiqueta de nivel dice "PRIORIDAD PRELIMINAR: X" | Guardrail #1 (nunca solo color/diagnóstico) | No (guardrail) |
| D3 | `BlobShape` con cúbicas en vez de arcos elípticos | Compose no soporta `border-radius` por eje | No (plataforma) |
| D4 | Pesos fuente sintetizados en vez de ejes variables | `res/font/` de Android no expone ejes variables fiables | No (plataforma) |
| D5 | Barra inferior con fondo opaco 0.94 en vez de `backdrop-blur` | Coste de render de blur en tiempo real | Sí (si se requiere) |
| D6 | Entrada `entrance` 400ms en vez de 500ms | Percepción móvil | Sí |
| D7 | `animate-node` no implementado | Fuera del alcance del design system base | Sí (TASK-005) |

**Ninguna desviación es un descuido**: D1–D4 son límites de plataforma, D2 es un
guardrail, D5–D7 son ajustes deliberados documentados y reversibles.
