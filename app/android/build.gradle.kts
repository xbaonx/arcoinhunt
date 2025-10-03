allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

// Ensure legacy plugins define a namespace for AGP 8+
subprojects {
    if (project.name.contains("ar_flutter_plugin")) {
        plugins.withId("com.android.library") {
            // Configure the Android library extension and set the namespace.
            extensions.configure<com.android.build.api.dsl.LibraryExtension>("android") {
                namespace = "io.carius.lars.ar_flutter_plugin"
                // Align SDK levels with the app and modern plugins
                compileSdk = 36
                defaultConfig {
                    minSdk = 24
                }
                // Keep Java compatibility at 1.8 to match the legacy plugin toolchain
                compileOptions {
                    sourceCompatibility = JavaVersion.VERSION_1_8
                    targetCompatibility = JavaVersion.VERSION_1_8
                }
            }
        }
        // Force Kotlin to target JVM 1.8 for this legacy plugin
        tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile::class.java).configureEach {
            kotlinOptions.jvmTarget = "1.8"
        }
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
