pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "PuenteJovenLaPaz"

// --- Núcleo (sin dependencias de Android en :core:model / :core:common) ---
include(":app")
include(":core:model")
include(":core:common")
include(":core:designsystem")
include(":core:navigation")
include(":core:data")
include(":core:security")

// --- Features del grafo joven ---
include(":feature:auth")
include(":feature:onboarding")
include(":feature:home")
