// :core:data — contratos de repositorio + implementación local de demostración.
// Sin backend: no hay URLs, endpoints, credenciales ni llamadas HTTP.
// La inyección por Hilt permite sustituir la implementación local por un adaptador
// remoto después, sin tocar UI ni casos de uso.
plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt)
}

android {
    namespace = "bo.puentejoven.core.data"
    compileSdk = libs.versions.compileSdk.get().toInt()

    defaultConfig {
        minSdk = libs.versions.minSdk.get().toInt()
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        buildConfig = false
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
        freeCompilerArgs.add("-Xjvm-default=all")
    }
}

dependencies {
    api(project(":core:model"))
    api(project(":core:common"))
    // `api` (no `implementation`): el constructor público de `LocalPuenteRepository`
    // expone `LocalCipher` (bo.puentejoven.core.security). Si se ocultara con
    // `implementation`, los consumidores del API de `:core:data` —incluidos los
    // tests de :feature:*— verían un tipo filtrado que no pueden resolver
    // ("Unresolved reference 'PassThroughLocalCipher'").
    api(project(":core:security"))

    implementation(libs.kotlinx.coroutines.core)
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.javax.inject)

    // Solo para construir EncryptedPreferencesSecureLocalStore desde Hilt.
    implementation(libs.androidx.security.crypto)

    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)

    testImplementation(libs.junit)
    testImplementation(libs.kotlin.test.junit)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(libs.turbine)
}
