package bo.puentejoven.core.data.di

import bo.puentejoven.core.common.Clock
import bo.puentejoven.core.common.DefaultDispatcherProvider
import bo.puentejoven.core.common.DispatcherProvider
import bo.puentejoven.core.common.SystemClock
import bo.puentejoven.core.data.local.LocalPuenteRepository
import bo.puentejoven.core.data.repository.ChatAccessRepository
import bo.puentejoven.core.data.repository.ConversationRepository
import bo.puentejoven.core.data.repository.ContextCheckRepository
import bo.puentejoven.core.data.repository.ReportRepository
import bo.puentejoven.core.data.repository.RetentionRepository
import bo.puentejoven.core.data.repository.SharingRepository
import bo.puentejoven.core.data.repository.SignalsRepository
import bo.puentejoven.core.data.repository.SupportRepository
import bo.puentejoven.core.data.repository.ToolsRepository
import bo.puentejoven.core.data.repository.YouthRepository
import android.content.Context
import bo.puentejoven.core.security.BiometricUnlock
import bo.puentejoven.core.security.EncryptedPreferencesSecureLocalStore
import bo.puentejoven.core.security.KeystoreAesGcmLocalCipher
import bo.puentejoven.core.security.LocalCipher
import bo.puentejoven.core.security.Pbkdf2PinHasher
import bo.puentejoven.core.security.PinHasher
import bo.puentejoven.core.security.SecureLocalStore
import bo.puentejoven.core.security.UnavailableBiometricUnlock
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Contratos de plataforma transversales.
 */
@Module
@InstallIn(SingletonComponent::class)
object CommonModule {

    @Provides
    @Singleton
    fun provideClock(): Clock = SystemClock()

    @Provides
    @Singleton
    fun provideDispatcherProvider(): DispatcherProvider = DefaultDispatcherProvider()
}

/**
 * Frontera de seguridad local (TASK-003).
 *
 * - [LocalCipher]: desde TASK-003 la implementación de producción es
 *   [KeystoreAesGcmLocalCipher] (AES-256-GCM con clave en Android Keystore).
 *   [PassThroughLocalCipher] queda solo como doble de pruebas: NO cifra.
 * - [SecureLocalStore]: preferencias cifradas con clave maestra en Keystore.
 * - [PinHasher]: derivación PBKDF2 con sal; el PIN nunca se almacena.
 * - [BiometricUnlock]: comodidad opcional; en el MVP no está disponible y la UI
 *   lo declara abiertamente en lugar de mostrar un interruptor que no funciona.
 */
@Module
@InstallIn(SingletonComponent::class)
object SecurityModule {

    @Provides
    @Singleton
    fun provideSecureLocalStore(
        @ApplicationContext context: Context,
    ): SecureLocalStore = EncryptedPreferencesSecureLocalStore(context)

    @Provides
    @Singleton
    fun providePinHasher(): PinHasher = Pbkdf2PinHasher()

    @Provides
    @Singleton
    fun provideLocalCipher(secureStore: SecureLocalStore): LocalCipher =
        KeystoreAesGcmLocalCipher(secureStore)

    @Provides
    @Singleton
    fun provideBiometricUnlock(): BiometricUnlock = UnavailableBiometricUnlock()
}

/**
 * Enlace de contratos de repositorio a la implementación local de demostración.
 *
 * ESTE ES EL PUNTO DE SUSTITUCIÓN HACIA BACKEND. Cuando existan contratos remotos
 * aprobados, basta con reemplazar `LocalPuenteRepository` por el adaptador remoto
 * (o un `DataStore` que combine local + remoto) sin modificar UI ni casos de uso.
 */
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    abstract fun bindYouthRepository(impl: LocalPuenteRepository): YouthRepository

    @Binds
    abstract fun bindConversationRepository(impl: LocalPuenteRepository): ConversationRepository

    @Binds
    abstract fun bindContextCheckRepository(impl: LocalPuenteRepository): ContextCheckRepository

    @Binds
    abstract fun bindSignalsRepository(impl: LocalPuenteRepository): SignalsRepository

    @Binds
    abstract fun bindToolsRepository(impl: LocalPuenteRepository): ToolsRepository

    @Binds
    abstract fun bindReportRepository(impl: LocalPuenteRepository): ReportRepository

    @Binds
    abstract fun bindSharingRepository(impl: LocalPuenteRepository): SharingRepository

    @Binds
    abstract fun bindSupportRepository(impl: LocalPuenteRepository): SupportRepository

    /**
     * [NUEVO] Acceso temporal a fragmentos del chat (DECISIONES §6.3).
     * Solo modela consentimiento y estado; NO habilita acceso real en Android.
     */
    @Binds
    abstract fun bindChatAccessRepository(impl: LocalPuenteRepository): ChatAccessRepository

    /** Retención y borrado local (TASK-003). */
    @Binds
    abstract fun bindRetentionRepository(impl: LocalPuenteRepository): RetentionRepository
}
