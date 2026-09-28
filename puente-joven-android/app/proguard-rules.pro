# Reglas ProGuard del módulo app.
# El MVP no activa minificación, pero se dejan preparadas.

# Hilt / Dagger
-keep class dagger.hilt.** { *; }
-keep class javax.inject.** { *; }

# Rutas tipadas de Navigation Compose (serialización de destinos)
-keep class bo.puentejoven.core.navigation.** { *; }
-keepclassmembers class bo.puentejoven.core.navigation.** { *; }
-keepattributes InnerClasses, Signature, *Annotation*

# Nunca registrar datos sensibles en logs en release.
-assumenosideeffects class android.util.Log {
    public static *** v(...);
    public static *** d(...);
}
