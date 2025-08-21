# 🚀 Guide de Configuration Production - Système de Filtres Nyth

Ce guide détaille la configuration optimale du système de filtres pour la production.

## 📋 Table des Matières

1. [Configuration Rapide](#configuration-rapide)
2. [Optimisations par Plateforme](#optimisations-par-plateforme)
3. [Variables d'Environnement](#variables-denvironnement)
4. [Scripts de Build](#scripts-de-build)
5. [Monitoring et Performance](#monitoring-et-performance)
6. [Dépannage](#dépannage)

## 🎯 Configuration Rapide

### Initialisation JavaScript

```javascript
import { productionFilters } from './scripts/production-example';

// Configuration automatique pour production
await productionFilters.initializeForProduction();

// Préchargement des filtres populaires
await productionFilters.preloadCommonFilters();
```

### Initialisation Native (C++)

```cpp
#include "shared/filters/ProductionConfig.hpp"
#include "shared/filters/ProductionSetup.hpp"

// Configuration automatique
SETUP_PRODUCTION_FILTERS();

// Ou configuration manuelle
auto& filterManager = FilterManager::getInstance();
ProductionSetup::configureForProduction(filterManager);
```

## 📱 Optimisations par Plateforme

### Android

#### Configuration Gradle (android/app/build.gradle)

```gradle
android {
    buildTypes {
        release {
            // Optimisations de production
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            
            // Configuration native
            ndk {
                abiFilters "arm64-v8a", "armeabi-v7a"
            }
            
            // Optimisations Hermes
            enableHermes: true
        }
    }
    
    // Configuration CMake
    externalNativeBuild {
        cmake {
            arguments "-DCMAKE_BUILD_TYPE=Release",
                     "-DPRODUCTION_BUILD=ON",
                     "-DANDROID_STL=c++_shared"
        }
    }
}
```

#### Variables d'environnement Android

```bash
export FILTER_PRODUCTION_MODE=1
export FILTER_CACHE_SIZE_MB=512
export FILTER_TARGET_FPS=60
export FILTER_MAX_THREADS=4
```

### iOS

#### Configuration Xcode

```xml
<!-- ios/Nyth/Info.plist -->
<key>FilterProductionMode</key>
<true/>
<key>FilterCacheSize</key>
<integer>536870912</integer> <!-- 512MB -->
<key>FilterTargetFPS</key>
<integer>60</integer>
```

#### Build Settings

```bash
# Dans Xcode Build Settings
CLANG_CXX_LANGUAGE_STANDARD = c++20
GCC_OPTIMIZATION_LEVEL = fast
ENABLE_BITCODE = NO
COMPILER_INDEX_STORE_ENABLE = NO
```

## 🔧 Variables d'Environnement

### Variables Principales

| Variable | Valeur Production | Description |
|----------|-------------------|-------------|
| `FILTER_PRODUCTION_MODE` | `1` | Active le mode production |
| `FILTER_ENABLE_LOGGING` | `0` | Désactive les logs |
| `FILTER_CACHE_SIZE_MB` | `512` | Taille cache en MB |
| `FILTER_TARGET_FPS` | `60` | FPS cible |
| `FILTER_MAX_THREADS` | `4` | Threads maximum |

### Configuration par Appareil

#### Appareils Bas de Gamme
```bash
export FILTER_CACHE_SIZE_MB=128
export FILTER_TARGET_FPS=30
export FILTER_MAX_THREADS=2
export FILTER_ENABLE_OPENGL=0
```

#### Appareils Haut de Gamme
```bash
export FILTER_CACHE_SIZE_MB=1024
export FILTER_TARGET_FPS=120
export FILTER_MAX_THREADS=8
export FILTER_ENABLE_OPENGL=1
```

## 🛠 Scripts de Build

### Build Production Complet

```bash
# Utiliser le script optimisé
./scripts/build-production.sh

# Avec options
./scripts/build-production.sh --clean --android
./scripts/build-production.sh --ios --profile
```

### Build Android Seul

```bash
cd android
export FILTER_PRODUCTION_MODE=1
./gradlew assembleRelease \
    -Pproduction=true \
    -PenableProguard=true \
    -PenableHermes=true
```

### Build iOS Seul

```bash
cd ios
xcodebuild \
    -workspace Nyth.xcworkspace \
    -scheme Nyth \
    -configuration Release \
    -destination generic/platform=iOS \
    archive
```

## 📊 Monitoring et Performance

### Métriques Clés

```javascript
// Obtenir les statistiques en temps réel
const stats = await productionFilters.getPerformanceStats();

console.log({
  fps: stats.averageFPS,
  memoryMB: stats.memoryUsage / 1024 / 1024,
  cacheHitRate: stats.cacheHitRate * 100,
  processingTimeMs: stats.processingTime
});
```

### Alertes Performance

```javascript
// Monitoring automatique
setInterval(async () => {
  const stats = await productionFilters.getPerformanceStats();
  
  // Alerte FPS bas
  if (stats.averageFPS < 30) {
    console.warn('⚠️ FPS bas détecté:', stats.averageFPS);
    await productionFilters.adjustPerformance();
  }
  
  // Alerte mémoire élevée
  if (stats.memoryUsage > 500 * 1024 * 1024) {
    console.warn('⚠️ Utilisation mémoire élevée:', stats.memoryUsage);
    await productionFilters.cleanup();
  }
}, 5000);
```

### Logging Production

```cpp
// Utiliser les macros de production
PROD_LOG("ERROR", "Erreur critique détectée");
PROD_ASSERT(condition, "Condition non respectée");

// Profiling conditionnel
PROD_PROFILE_START(filterProcessing);
// ... code à profiler ...
PROD_PROFILE_END(filterProcessing);
```

## 🎛 Configuration Avancée

### Configuration Automatique par Appareil

```javascript
// Détection automatique et optimisation
const deviceInfo = await productionFilters.detectDeviceCapabilities();

if (deviceInfo.totalMemoryMB < 3000) {
  // Configuration bas de gamme
  await productionFilters.configureForLowEndDevice();
} else if (deviceInfo.totalMemoryMB > 8000) {
  // Configuration haut de gamme
  await productionFilters.configureForHighEndDevice();
}
```

### Cache Intelligent

```cpp
// Configuration cache production
auto& config = ProductionConfig::getInstance();
config.getMemory().maxCacheSize = 512 * 1024 * 1024;
config.getMemory().enableMemoryTracking = true;
config.getMemory().enablePoolOptimization = true;
```

### GPU vs CPU

```cpp
// Sélection automatique GPU/CPU
if (config.getGPU().preferOpenGL && isOpenGLAvailable()) {
    // Utiliser OpenGL pour les filtres
    filterManager.setPreferredProcessor("OpenGL");
} else {
    // Fallback CPU avec FFmpeg
    filterManager.setPreferredProcessor("FFmpeg");
}
```

## 🔍 Dépannage

### Problèmes Fréquents

#### 1. Performances Dégradées

**Symptômes:** FPS < 30, latence élevée
**Solutions:**
```javascript
// Réduire la qualité
await productionFilters.setTargetFPS(30);
await productionFilters.setCacheSize(128 * 1024 * 1024);

// Désactiver certaines optimisations
await productionFilters.disablePrediction();
```

#### 2. Utilisation Mémoire Élevée

**Symptômes:** > 500MB d'utilisation
**Solutions:**
```javascript
// Nettoyage agressif
await productionFilters.cleanup();
await productionFilters.setCacheSize(256 * 1024 * 1024);

// Monitoring continu
setInterval(() => productionFilters.cleanup(), 30000);
```

#### 3. Erreurs OpenGL

**Symptômes:** Erreurs de contexte, shaders
**Solutions:**
```cpp
// Fallback automatique vers CPU
if (!openglProcessor->initialize()) {
    filterManager.setPreferredProcessor("FFmpeg");
    PROD_LOG("WARN", "OpenGL indisponible, utilisation CPU");
}
```

### Validation Configuration

```cpp
// Valider la configuration avant déploiement
auto& config = ProductionConfig::getInstance();
if (!config.validateConfiguration()) {
    PROD_LOG("ERROR", "Configuration invalide");
    // Utiliser configuration par défaut
}

// Rapport de configuration
std::string report = config.getConfigurationReport();
PROD_LOG("INFO", report);
```

## 📈 Métriques de Succès

### Objectifs Performance Production

| Métrique | Objectif | Critique |
|----------|----------|----------|
| **FPS Moyen** | > 60 | > 30 |
| **Latence** | < 16ms | < 33ms |
| **Mémoire** | < 300MB | < 500MB |
| **Cache Hit Rate** | > 80% | > 50% |
| **Temps Initialisation** | < 2s | < 5s |

### Tests de Validation

```bash
# Exécuter les tests de performance
npm run test:performance

# Benchmark automatique
./scripts/benchmark-production.sh

# Tests de stress mémoire
./scripts/stress-test-memory.sh
```

## 🚀 Déploiement

### Checklist Pré-Déploiement

- [ ] Configuration production activée
- [ ] Variables d'environnement définies
- [ ] Tests de performance validés
- [ ] Monitoring configuré
- [ ] Fallbacks testés
- [ ] Documentation mise à jour

### Commandes de Déploiement

```bash
# Build final optimisé
./scripts/build-production.sh --clean

# Validation finale
npm run validate:production

# Génération des artefacts
npm run build:artifacts
```

---

## 📞 Support

Pour toute question ou problème :

1. Consulter les logs de performance
2. Vérifier la configuration avec `getConfigurationReport()`
3. Tester les fallbacks CPU/GPU
4. Consulter la documentation technique

**Le système de filtres est maintenant optimisé pour la production ! 🎉**
