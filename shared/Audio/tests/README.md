# Audio Core Test Suite

## 📋 Vue d'ensemble

Suite de tests professionnelle complète pour le module Audio Core, couvrant tous les aspects critiques du traitement audio en temps réel.

## 🎯 Couverture des tests

### Tests unitaires principaux (`TestAudioCore.cpp`)

#### 1. **Gestion des erreurs (AudioError)**
- ✅ Codes d'erreur et valeurs
- ✅ AudioResult (succès/échec)
- ✅ Conversion en chaînes
- ✅ Validation des entrées
- ✅ Opérations chaînées

#### 2. **Filtres Biquad (BiquadFilter)**
- ✅ Initialisation et coefficients
- ✅ Filtre passe-bas
- ✅ Filtre passe-haut
- ✅ Filtre passe-bande
- ✅ Filtre coupe-bande (notch)
- ✅ Filtre de crête (peaking)
- ✅ Traitement stéréo
- ✅ Traitement échantillon par échantillon
- ✅ Réinitialisation du filtre
- ✅ Gestion des dénormaux

#### 3. **Égaliseur Audio (AudioEqualizer)**
- ✅ Initialisation et configuration
- ✅ Configuration des bandes
- ✅ Gestion des presets
- ✅ Traitement stéréo
- ✅ Mode bypass
- ✅ Gain principal
- ✅ Mise à jour thread-safe des paramètres

#### 4. **Pool de mémoire (MemoryPool)**
- ✅ Allocation/désallocation basique
- ✅ Allocation concurrente
- ✅ Alignement pour SIMD
- ✅ Test de stress

#### 5. **Thread Safety**
- ✅ ThreadSafeBiquadFilter
- ✅ Opérations concurrentes
- ✅ Détection de deadlock

#### 6. **Performance**
- ✅ Débit BiquadFilter
- ✅ Débit Equalizer
- ✅ Vitesse d'allocation mémoire

#### 7. **Cas limites**
- ✅ Fréquences extrêmes
- ✅ Gains extrêmes
- ✅ Buffers vides
- ✅ Tailles de buffer incompatibles

#### 8. **Tests d'intégration**
- ✅ Chaîne de traitement complète
- ✅ Validation de bout en bout

### Tests des composants spécialisés (`TestSpecializedComponents.cpp`)

#### 1. **Algorithmes sans branches (BranchFreeAlgorithms)**
- ✅ Clamp (limitation)
- ✅ Abs (valeur absolue)
- ✅ Sign (signe)
- ✅ Select (sélection conditionnelle)
- ✅ SoftClip (écrêtage doux)
- ✅ FastTanh (approximation rapide)
- ✅ Lerp (interpolation linéaire)
- ✅ Smoothstep
- ✅ Tests de performance

#### 2. **Table de conversion dB (DbLookupTable)**
- ✅ Conversion dB vers linéaire
- ✅ Conversion linéaire vers dB
- ✅ Précision de la table
- ✅ Conversion aller-retour
- ✅ Comparaison de performance

#### 3. **Filtre Biquad sécurisé (BiquadFilterSafe)**
- ✅ Gestion des pointeurs null
- ✅ Gestion des tailles invalides
- ✅ Détection de NaN
- ✅ Détection d'infini
- ✅ Traitement valide

#### 4. **Optimisations SIMD**
- ✅ Traitement SSE
- ✅ Traitement AVX (si disponible)
- ✅ Comparaison de performance
- ✅ Validation des résultats

#### 5. **Validation des constantes**
- ✅ Constantes mathématiques
- ✅ Constantes audio
- ✅ Seuils de sécurité

## 🚀 Exécution des tests

### Méthode rapide (script automatisé)

```bash
# Exécuter tous les tests
./run_tests.sh

# Tests unitaires seulement
./run_tests.sh -m unit

# Benchmarks de performance
./run_tests.sh -m benchmark -b Release

# Tests avec Valgrind (détection de fuites mémoire)
./run_tests.sh -m valgrind -b Debug

# Génération du rapport de couverture
./run_tests.sh -m coverage -b Debug

# Build propre avec sortie verbose
./run_tests.sh -c -v
```

### Méthode manuelle (CMake)

```bash
# Créer le répertoire de build
mkdir build && cd build

# Configurer avec CMake
cmake .. -DCMAKE_BUILD_TYPE=Release

# Compiler
make -j$(nproc)

# Exécuter les tests
./TestAudioCore
./TestSpecializedComponents
./BenchmarkOptimizations

# Ou utiliser CTest
ctest --output-on-failure
```

## 📊 Métriques de performance attendues

### BiquadFilter
- **Débit minimum**: 100x temps réel
- **Latence**: < 1μs par échantillon
- **Utilisation CPU**: < 1% pour un canal @ 48kHz

### AudioEqualizer (10 bandes)
- **Débit minimum**: 10x temps réel
- **Latence**: < 10μs par buffer
- **Utilisation CPU**: < 5% pour stéréo @ 48kHz

### MemoryPool
- **Allocation/Désallocation**: < 100ns par opération
- **Thread-safe**: Aucun blocage sous charge
- **Fragmentation**: 0% (pool pré-alloué)

### Optimisations SIMD
- **Speedup SSE**: > 1.5x vs scalaire
- **Speedup AVX**: > 2.5x vs scalaire
- **Précision**: < 0.01% d'erreur

## 🔍 Analyse de la qualité du code

### Couverture de code
```bash
# Générer le rapport de couverture
./run_tests.sh -m coverage -b Debug

# Le rapport HTML sera dans build/coverage/index.html
```

### Analyse mémoire (Valgrind)
```bash
# Vérifier les fuites mémoire
./run_tests.sh -m valgrind -b Debug

# Analyse détaillée
valgrind --leak-check=full --show-leak-kinds=all ./build/TestAudioCore
```

### Analyse statique
```bash
# Avec clang-tidy
clang-tidy ../core/*.cpp -- -I../core -std=c++17

# Avec cppcheck
cppcheck --enable=all --std=c++17 ../core/
```

## 📈 Benchmarks

Les benchmarks mesurent:
- Débit en échantillons par seconde
- Ratio temps réel (x fois plus rapide que le temps réel)
- Latence par opération
- Utilisation mémoire
- Efficacité du cache

Résultats typiques sur CPU moderne (Intel i7/AMD Ryzen):
- BiquadFilter: 500+ MSamples/sec
- Equalizer 10 bandes: 100+ MSamples/sec
- Memory Pool: 10M+ allocations/sec

## 🛠️ Configuration requise

### Dépendances obligatoires
- CMake >= 3.14
- Compilateur C++17 (GCC 7+, Clang 5+, MSVC 2017+)
- Google Test (téléchargé automatiquement)

### Dépendances optionnelles
- Valgrind (analyse mémoire)
- lcov/gcov (couverture de code)
- clang-tidy (analyse statique)
- cppcheck (analyse statique)

## 🎯 Objectifs de qualité

| Métrique | Objectif | Statut |
|----------|----------|--------|
| Couverture de code | > 90% | ✅ |
| Tests unitaires | 100% des fonctions publiques | ✅ |
| Fuites mémoire | 0 | ✅ |
| Warnings compilation | 0 | ✅ |
| Performance temps réel | > 10x | ✅ |
| Thread safety | 100% sans data race | ✅ |

## 📝 Conventions de test

### Nommage
- Tests unitaires: `TEST_F(ClassNameTest, MethodName_Scenario_ExpectedResult)`
- Fixtures: `ClassNameTest`
- Benchmarks: `BM_ClassName_Operation`

### Organisation
- Un fichier de test par module principal
- Tests groupés par fonctionnalité
- Fixtures pour partager le setup
- Benchmarks séparés des tests unitaires

### Assertions
- `EXPECT_*` pour les tests non-critiques
- `ASSERT_*` pour les préconditions
- `EXPECT_NEAR` pour les comparaisons float/double
- Messages descriptifs pour les échecs

## 🔧 Dépannage

### Échec de compilation
```bash
# Nettoyer et reconstruire
./run_tests.sh -c -v
```

### Tests qui échouent
```bash
# Exécuter avec plus de détails
./build/TestAudioCore --gtest_filter=*NomDuTest* --gtest_break_on_failure
```

### Performance insuffisante
```bash
# Vérifier les optimisations
cmake .. -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_FLAGS="-O3 -march=native"
```

## 📚 Documentation supplémentaire

- [Google Test Documentation](https://google.github.io/googletest/)
- [CMake Testing](https://cmake.org/cmake/help/latest/manual/ctest.1.html)
- [Valgrind Manual](https://valgrind.org/docs/manual/manual.html)
- [Code Coverage Best Practices](https://github.com/codecov/example-cpp11-cmake)

## 🤝 Contribution

Pour ajouter de nouveaux tests:
1. Créer le test dans le fichier approprié
2. Suivre les conventions de nommage
3. Documenter les cas de test
4. Vérifier la couverture
5. Exécuter l'analyse mémoire
6. Mettre à jour ce README si nécessaire

## 📄 Licence

Les tests suivent la même licence que le module Audio Core principal.