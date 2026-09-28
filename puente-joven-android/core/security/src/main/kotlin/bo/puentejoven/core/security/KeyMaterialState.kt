package bo.puentejoven.core.security

/**
 * Estado del material de claves de contenido, deducido de hechos observables.
 *
 * - [READY]: la clave está donde debe estar; se reutiliza.
 * - [FIRST_RUN]: nunca hubo clave; crearla es correcto y esperado.
 * - [LOST]: hubo clave y ya no está. NUNCA se regenera en silencio: hacerlo
 *   dejaría irrecuperable el contenido previo mientras la app aparenta funcionar.
 */
enum class KeyMaterialState {
    READY,
    FIRST_RUN,
    LOST,
}

/**
 * Regla pura que separa "primer arranque" de "clave perdida" (F6 de la auditoría).
 *
 * Es pura y no toca Android a propósito: Android Keystore no se puede ejercitar
 * en un test de JVM, pero la regla —que es exactamente donde vivía el defecto—
 * sí puede y debe probarse. [KeystoreAesGcmLocalCipher] es el único que la usa.
 *
 * @param aliasPresent ¿sigue existiendo la entrada de la clave en el Keystore?
 * @param markerSaysThereWasAKey marcador durable: la clave existió en algún
 *   momento (sobrevive a un proceso; no al borrado explícito).
 * @param createdInThisProcess la clave se generó durante este mismo proceso.
 *   Si se creó aquí y ya no está, también es pérdida, no primer arranque:
 *   regenerar en ese caso borraría el contenido de la sesión en curso.
 */
fun keyMaterialState(
    aliasPresent: Boolean,
    markerSaysThereWasAKey: Boolean,
    createdInThisProcess: Boolean,
): KeyMaterialState = when {
    aliasPresent -> KeyMaterialState.READY
    // Cualquier rastro de que la clave existió obliga a declarar la pérdida.
    markerSaysThereWasAKey || createdInThisProcess -> KeyMaterialState.LOST
    else -> KeyMaterialState.FIRST_RUN
}
