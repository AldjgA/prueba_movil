package bo.puentejoven.feature.conversation.domain

import androidx.annotation.StringRes

/**
 * Resuelve un recurso de texto a su valor.
 *
 * Existe por dos motivos concretos:
 * 1. **Regla de la casa #2**: ningún literal de copy en Kotlin. El guion guarda
 *    `@StringRes`, no texto, y la resolución ocurre en un solo sitio.
 * 2. **Testeabilidad**: el ViewModel persiste texto (`ConversationMessage.content`
 *    es un `String`), así que necesita resolver la clave antes de guardar. Con esta
 *    abstracción, el ViewModel se prueba sin Android.
 *
 * La implementación de producción es [bo.puentejoven.feature.conversation.di.AndroidStringResolver].
 */
fun interface StringResolver {
    fun get(@StringRes resId: Int): String
}
