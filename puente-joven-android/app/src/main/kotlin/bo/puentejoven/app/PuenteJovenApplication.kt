package bo.puentejoven.app

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

/**
 * Aplicación de Puente Joven La Paz.
 *
 * No configura analítica, crash reporting ni telemetría: el MVP no envía datos a
 * ningún servicio (guardrails #8 y DoD global).
 */
@HiltAndroidApp
class PuenteJovenApplication : Application()
