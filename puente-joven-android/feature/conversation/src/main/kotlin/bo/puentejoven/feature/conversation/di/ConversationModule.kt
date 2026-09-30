package bo.puentejoven.feature.conversation.di

import android.content.Context
import androidx.annotation.StringRes
import bo.puentejoven.feature.conversation.domain.StringResolver
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Implementación de producción de [StringResolver].
 *
 * Usa el contexto de aplicación: no retiene Activity ni ViewModel, así que es
 * seguro como `@Singleton`.
 */
@Singleton
class AndroidStringResolver @Inject constructor(
    @ApplicationContext private val context: Context,
) : StringResolver {

    override fun get(@StringRes resId: Int): String = context.getString(resId)
}

/** Binding de [StringResolver]. Se instala solo; ninguna feature necesita saberlo. */
@Module
@InstallIn(SingletonComponent::class)
abstract class ConversationModule {

    @Binds
    @Singleton
    abstract fun bindStringResolver(impl: AndroidStringResolver): StringResolver
}
