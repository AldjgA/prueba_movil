// :core:navigation — destinos tipados y contrato de navegación.
// Presenta el grafo joven con @Serializable (Navigation Compose type-safe routes).
// PROHIBIDO strings sueltos de navegación en el resto del proyecto.
plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.serialization)
}

android {
    namespace = "bo.puentejoven.core.navigation"
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
    api(project(":core:common"))
    implementation(libs.kotlinx.coroutines.core)

    // El plugin de serialización necesita el runtime en el classpath para que
    // `kotlinx.serialization.Serializable` resuelva en los destinos tipados.
    api(libs.kotlinx.serialization.json)

    testImplementation(libs.junit)
}
