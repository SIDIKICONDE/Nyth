# 🧪 Test Complet Bibliothèque SIMD

## Vue d'ensemble

Ce dossier contient un système de test complet pour valider et benchmark la bibliothèque SIMD AudioNR. Le système de test couvre tous les aspects de la bibliothèque :

- ✅ **Fonctionnalités de base** : Addition, multiplication, fonctions mathématiques
- ✅ **Précision** : Validation des approximations
- ✅ **Performance** : Benchmarks comparatifs
- ✅ **Détection SIMD** : Validation des capacités matérielles
- ✅ **Gestion mémoire** : Tests d'alignement
- ✅ **Processeurs DSP** : Filtres, distorsions, réverbération
- ✅ **Intégration** : Couche d'intégration complète

## 🚀 Démarrage rapide

### Test rapide (sans compilation)

```bash
# Linux/macOS
node quick_simd_test.js

# Windows
node quick_simd_test.js
```

### Test complet avec compilation

#### Linux/macOS
```bash
# Compiler et exécuter tous les tests
./run_simd_tests.sh all

# Ou étape par étape
./run_simd_tests.sh build    # Compiler
./run_simd_tests.sh test     # Exécuter tests
./run_simd_tests.sh bench    # Benchmarks
```

#### Windows
```batch
# Compiler et exécuter tous les tests
run_simd_tests.bat all

# Ou étape par étape
run_simd_tests.bat build    # Compiler
run_simd_tests.bat test     # Exécuter tests
run_simd_tests.bat bench    # Benchmarks
```

## 📁 Structure des tests

```
__tests__/SIMD/
├── SIMDComprehensiveTest.cpp    # Tests complets C++
├── CMakeLists.txt               # Configuration CMake
├── run_simd_tests.sh           # Script Linux/macOS
├── run_simd_tests.bat          # Script Windows
├── quick_simd_test.js          # Test rapide Node.js
└── README.md                   # Cette documentation
```

## 🧪 Tests inclus

### 1. **Test de détection SIMD**
- Vérification des capacités NEON/AVX
- Validation du type SIMD recommandé
- Taille des vecteurs supportés

### 2. **Fonctions mathématiques de base**
- Addition vectorielle (`SIMDMath::add`)
- Multiplication vectorielle (`SIMDMath::multiply`)
- Calcul de somme (`SIMDMath::sum`)
- Maximum et autres réductions

### 3. **Fonctions mathématiques avancées**
- Intégrales exponentielles (`expint_e1`, `expint_ei`)
- Fonctions trigonométriques optimisées
- Fonctions hyperboliques

### 4. **Gestion mémoire alignée**
- Allocation/désallocation alignée
- Vérification d'alignement
- Tests avec mémoire non-alignée

### 5. **Utilitaires SIMD**
- Conversion de format (int16 ↔ float32)
- Application de gain
- Limiteurs et protection
- Mixage audio

### 6. **Processeurs DSP SIMD**
- **Filtres** : Passe-bas, passe-haut, passe-bande
- **Distorsions** : Tanh, hard clip, soft clip, cubic
- **Effets** : Reverb, delay
- **Analyse** : RMS, peak, mean

### 7. **Benchmarks de performance**
- Comparaison scalaire vs SIMD
- Mesure de débit (échantillons/seconde)
- Tests avec différentes tailles de buffers

### 8. **Tests de précision**
- Validation des approximations
- Comparaison avec implémentations de référence
- Tolérances configurables

### 9. **Intégration système**
- Couche d'intégration `SIMDIntegration`
- Gestionnaire SIMD `SIMDManager`
- Interface unifiée pour les composants audio

## 📊 Exemple de résultats

```
🚀 === TESTS COMPLÉMENTAIRES BIBLIOTHÈQUE SIMD ===

🔍 === TEST DE DÉTECTION SIMD ===
✅ Détection SIMD: DISPONIBLE
✅ Détection NEON: DISPONIBLE
✅ Type SIMD recommandé: ARM NEON (128-bit)
✅ Taille du vecteur: 4 floats

🧮 === TEST FONCTIONS MATHÉMATIQUES DE BASE ===
✅ Addition SIMD - OK
✅ Multiplication SIMD - OK
✅ Somme SIMD - OK (résultat: -15.23)
✅ Maximum SIMD - OK (résultat: 0.99)

⏱️  Addition SIMD: 45.2ms
⏱️  Multiplication SIMD: 42.1ms
⏱️  Somme SIMD: 12.3ms

🎯 === TEST PRÉCISION ===
Précision des approximations:
  Sin (LUT): erreur max = 0.00015
  Tanh: erreur max = 0.00023
✅ Précision des approximations - OK
```

## 🔧 Configuration requise

### Logiciel
- **Compilateur C++17** : g++, clang++, MSVC
- **CMake 3.10+**
- **Node.js** (pour test rapide)

### Matériel
- **ARM** : Processeur avec NEON (tous les appareils modernes)
- **x86/x64** : AVX2 recommandé, SSE2 minimum
- **Mémoire** : 32 octets d'alignement supportés

## 🎛️ Personnalisation

### Modifier les paramètres de test
```cpp
// Dans SIMDComprehensiveTest.cpp
const size_t TEST_SIZE = 1024;           // Taille des buffers de test
const size_t BENCHMARK_SIZE = 100000;    // Taille pour benchmarks
const int BENCHMARK_ITERATIONS = 100;    // Nombre d'itérations
```

### Activer/désactiver les optimisations
```bash
# Compilation avec optimisations SIMD
cmake .. -DENABLE_SIMD_OPTIMIZATIONS=ON

# Compilation sans optimisations SIMD
cmake .. -DENABLE_SIMD_OPTIMIZATIONS=OFF
```

### Flags de compilation recommandés

#### ARM (NEON)
```cmake
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -march=armv8-a+simd -mfpu=neon")
```

#### x86/x64 (AVX2)
```cmake
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -mavx2 -mfma")
```

#### Optimisations générales
```cmake
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3 -ffast-math -funroll-loops")
```

## 🔍 Dépannage

### Erreurs courantes

#### "SIMD not available"
```bash
# Vérifier les capacités du processeur
./run_simd_tests.sh test  # Le programme affichera les capacités détectées
```

#### Erreur de compilation
```bash
# Vérifier la version du compilateur
g++ --version  # Doit supporter C++17

# Vérifier CMake
cmake --version  # Doit être ≥ 3.10
```

#### Problèmes d'alignement mémoire
```bash
# Sur Windows, vérifier _aligned_malloc
# Sur Linux/macOS, vérifier posix_memalign
```

### Logs et débogage

Les tests génèrent des logs détaillés :
- **Résultats de benchmark** : `build/benchmark_results.txt`
- **Erreurs de compilation** : `build/CMakeFiles/*.log`

## 📈 Performance attendue

### Gains typiques SIMD

| Opération | Gain typique | Conditions |
|-----------|--------------|------------|
| Addition/multiplication | 3-8x | Données alignées |
| Fonctions trigonométriques | 5-15x | Avec tables de recherche |
| Réductions (sum, max) | 2-6x | Grandes tailles de données |
| Filtres DSP | 4-12x | Chaîne de traitement complète |

### Facteurs influençant les performances

1. **Taille des données** : SIMD plus efficace sur de gros buffers
2. **Alignement mémoire** : Améliore significativement les performances
3. **Architecture CPU** : NEON (mobile) vs AVX2 (desktop)
4. **Optimisations compilateur** : `-O3 -ffast-math` requis

## 🚀 Intégration dans le projet

### Utilisation dans le code existant

```cpp
// 1. Initialisation
AudioNR::SIMD::SIMDManager::getInstance().initialize();

// 2. Utilisation des fonctions SIMD
float* result = AudioNR::SIMD::AlignedMemory::allocate<float>(1024);
AudioNR::SIMD::SIMDMath::add(result, input1, input2, 1024);

// 3. Utilisation des processeurs DSP
AudioNR::SIMD::SIMDFilter filter(AudioNR::SIMD::SIMDFilter::LOWPASS, 1000.0f);
filter.process(audioBuffer, bufferSize);
```

### Interface avec React Native

```cpp
// Dans les modules TurboModules ou JSI
#include "SIMDCore.hpp"
#include "SIMDIntegration.hpp"

// Wrapper pour JavaScript
void processAudioWithSIMD(float* buffer, size_t size) {
    if (AudioNR::SIMD::SIMDDetector::hasSIMD()) {
        AudioNR::SIMD::SIMDUtils::applyGain(buffer, size, 0.8f);
    }
}
```

## 📚 Ressources supplémentaires

- [Guide d'optimisation SIMD](SIMDOptimizationGuide.md)
- [Documentation SIMDCore](shared/Audio/common/SIMD/SIMDCore.hpp)
- [Exemples d'utilisation](shared/Audio/common/SIMD/SIMDIntegration.hpp)

## 🤝 Contribution

Pour ajouter de nouveaux tests :

1. **Tests unitaires** : Ajouter dans `SIMDComprehensiveTest.cpp`
2. **Benchmarks** : Créer une nouvelle fonction `test*Benchmark()`
3. **Validation** : Mettre à jour `quick_simd_test.js`

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs de compilation : `build/CMakeFiles/*.log`
2. Testez avec le mode debug : `cmake .. -DCMAKE_BUILD_TYPE=Debug`
3. Validez la détection SIMD avec le test rapide

---

**🎯 Résultat attendu** : Tous les tests passent avec des gains de performance significatifs (3-15x selon les opérations)
