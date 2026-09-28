// :core:security — contratos de cifrado local.
// El MVP NO define implementación criptográfica final; aquí viven las fronteras
// y una implementación de demostración. Guardrail #7: el chat es privado y local.
plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "bo.puentejoven.core.security"
    compileSdk = libs.versions.compileSdk.get().toInt()

    defaultConfig {
        minSdk = libs.versions.minSdk.get().toInt()
        consumerProguardFiles("consumer-rules.pro")
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
    implementation(project(":core:common"))
    implementation(libs.kotlinx.coroutines.core)

    // Contrato de KeyStore/almacenamiento cifrado para fases posteriores.
    implementation(libs.androidx.security.crypto)

    implementation(libs.javax.inject)

    testImplementation(libs.junit)
    testImplementation(libs.kotlin.test.junit)
}
