# Addendum — gstack-designer · bug latente corregido tras la producción del APK

> Este addendum existe porque no se pudo editar `deliverables/gstack/informe-designer-task001-002.md`:
> el servicio de backup del sandbox (`sandbox.backup.modify_backup`) devolvió timeout
> repetidamente. **Debe fusionarse** en la sección «7.bis / Trabajo pendiente» de ese informe
> cuando el servicio se recupere.

## Bug latente encontrado y corregido

Revisando la configuración de pruebas de todos los módulos —necesario porque `./gradlew test`
nunca pudo completarse— se encontró un **bug latente real**:

`:core:designsystem` contiene pruebas instrumentadas
(`src/androidTest/kotlin/bo/puentejoven/core/designsystem/DesignSystemAccessibilityTest.kt`)
pero su `defaultConfig` **no declaraba `testInstrumentationRunner`**. Sin runner,
`connectedAndroidTest` de ese módulo no puede ejecutarse.

### Corrección aplicada

`core/designsystem/build.gradle.kts`:

```kotlin
defaultConfig {
    minSdk = libs.versions.minSdk.get().toInt()
    // Necesario para las pruebas instrumentadas de accesibilidad
    // (src/androidTest: DesignSystemAccessibilityTest).
    testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
}
```

### Verificación

Build de **189 tareas** tras el cambio, con todas las tareas de `:core:designsystem:*` en
`UP-TO-DATE` (el cambio compila) y los dos APKs intactos. Es un cambio **solo de la variante
`androidTest`**: no afecta al APK de producción ya generado.

### Estado de runners por módulo (tras la corrección)

| Módulo | Tiene androidTest | Runner declarado |
|---|---|---|
| `:app` | sí (`NavigationFlowTest`) | ✔ |
| `:core:designsystem` | sí (`DesignSystemAccessibilityTest`) | ✔ (corregido ahora) |
| `:feature:auth` | no | declarado (inocuo) |
| `:feature:onboarding` | no | no requerido |
| `:feature:home` | no | no requerido |
| `:core:model` | no | no requerido |
| `:core:common` | no | no requerido |
| `:core:navigation` | no | no requerido |
| `:core:data` | no | no requerido |
| `:core:security` | no | no requerido |

## APKs vigentes (producidos antes de este cambio)

```
app/build/outputs/apk/demo/debug/app-demo-debug.apk      18.732.753 B
app/build/outputs/apk/remote/debug/app-remote-debug.apk  18.732.749 B
```

Los APKs **no cambian** con esta corrección: solo concierne a `androidTest`.

## Pendiente de coordinación

1. Fusionar este addendum en `deliverables/gstack/informe-designer-task001-002.md`.
2. Eliminar el directorio temporal `../.verify-designer/` (copia aislada usada para verificar
   la compilación sin colisionar con otros builds). No pude borrarlo: el borrado masivo
   requiere confirmación explícita del usuario.
3. Aclarar en el flavor `remote` de `:app` (añadido por `gstack-product-reviewer`) que
   **no debe activar red ni datos reales** hasta que se aprueben contratos y privacidad
   (guardrails #5 y #8).
