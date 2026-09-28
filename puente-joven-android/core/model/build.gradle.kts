// :core:model — entidades de dominio puras.
// Regla de arquitectura: este módulo NO depende de Android ni de Compose.
plugins {
    alias(libs.plugins.kotlin.jvm)
}

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    testImplementation(libs.junit)
    testImplementation(libs.kotlin.test.junit)
}
