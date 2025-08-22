# 🧪 Tests Unitaires - Module Core

## 📋 Vue d'ensemble

Cette suite de tests valide le **module core** de Nyth, comprenant les composants audio principaux :
- **AudioEqualizer** : Égaliseur 10 bandes avec presets
- **BiquadFilter** : 8 types de filtres audio
- **Intégration** : Cohérence entre les composants

### 🎯 **4 suites de tests** pour **2 composants principaux** :

| Suite | Fichier | Composant | Focus |
|-------|---------|-----------|-------|
| **AudioEqualizer** | `test_audio_equalizer.cpp` | AudioEqualizer | Fonctionnalités d'égalisation |
| **BiquadFilter** | `test_biquad_filter.cpp` | BiquadFilter | Types de filtres et calculs |
| **Integration** | `test_core_integration.cpp` | AudioEqualizer + BiquadFilter | Cohérence système |
| **Ultra Stress** | `test_stress_ultra.cpp` | AudioEqualizer + BiquadFilter | Tests de stress extrêmes |

## 🚀 Exécution des Tests

### **Windows (PowerShell) - Recommandé :**
```powershell
cd __tests__/core
.\run_core_tests.ps1
```

### **Tests de Stress Ultra Poussés (PowerShell) :**
```powershell
cd __tests__/core
.\run_stress_tests.ps1
```

### **Windows (Batch) :**
```cmd
cd __tests__\core
run_core_tests.bat
```

### **Tests de Stress Ultra Poussés (Batch) :**
```cmd
cd __tests__\core
run_stress_tests.bat
```

### **Unix/Linux/macOS :**
```bash
cd __tests__/core
make test
```

## 📁 Fichiers de Test

### **Tests Unitaires C++20 :**
- `test_audio_equalizer.cpp` - Teste AudioEqualizer.hpp/.cpp 
- `test_biquad_filter.cpp` - Teste BiquadFilter.hpp/.cpp
- `test_core_integration.cpp` - Teste l'intégration des deux composants
- `test_stress_ultra.cpp` - Tests de stress ultra poussés (mémoire, performance, stabilité)

### **Scripts d'Exécution :**
- `run_core_tests.ps1` - Script PowerShell cross-platform
- `run_stress_tests.ps1` - Script PowerShell pour tests de stress ultra poussés
- `run_core_tests.bat` - Script Batch Windows  
- `run_stress_tests.bat` - Script Batch pour tests de stress ultra poussés
- `Makefile` - Build system Unix/Linux/macOS

## ✅ Ce que les Tests Valident

### **🎛️ AudioEqualizer :**
- ✅ **Construction** : Par défaut et avec paramètres
- ✅ **Contrôles de bandes** : Gain (-24dB à +24dB), fréquence, facteur Q
- ✅ **Types de filtres** : 8 types (lowpass, highpass, bandpass, notch, peak, lowshelf, highshelf, allpass)
- ✅ **Activation/désactivation** : Gestion individuelle des bandes
- ✅ **Gain master** : Contrôle global avec limites
- ✅ **Bypass** : Mode transparent
- ✅ **Sample rate** : Changement dynamique
- ✅ **Reset** : Remise à zéro de toutes les bandes
- ✅ **Traitement audio** : Mono et stéréo, avec et sans bypass
- ✅ **Presets** : Chargement/sauvegarde, factory de 10 presets
- ✅ **Thread safety** : ParameterUpdateGuard, verrous atomiques
- ✅ **Validation** : Index de bandes, paramètres hors limites

### **🔧 BiquadFilter :**
- ✅ **Construction** : Coefficients par défaut corrects
- ✅ **Coefficients manuels** : Configuration et normalisation
- ✅ **8 types de filtres** :
  - **Lowpass** : Passe-bas avec calcul correct des coefficients
  - **Highpass** : Passe-haut avec vérification des coefficients
  - **Bandpass** : Passe-bande (a1=0, a0=-a2)
  - **Notch** : Coupe-bande (a0=a2=1)
  - **Peak** : Bell avec gain positif/négatif
  - **Lowshelf** : Étagère basse fréquences
  - **Highshelf** : Étagère haute fréquences  
  - **Allpass** : Filtre déphaseur
- ✅ **Traitement** : Mono et stéréo optimisé
- ✅ **Reset** : Remise à zéro de l'état interne
- ✅ **Échantillon unique** : API processSample()
- ✅ **Stabilité** : Valeurs extrêmes, pas de NaN/infini
- ✅ **Cohérence** : Différentes fréquences et facteurs Q
- ✅ **Cas dégénérés** : Gestion b0=0

### **🔗 Integration :**
- ✅ **Intégration AudioEqualizer + BiquadFilter** : Fonctionnement conjoint
- ✅ **Presets end-to-end** : Application complète des presets
- ✅ **Traitement stéréo intégré** : Canaux indépendants cohérents
- ✅ **Paramètres temps réel** : Changements dynamiques
- ✅ **Thread safety** : ParameterUpdateGuard complet
- ✅ **Bypass vs actif** : Modes transparents vs traitement
- ✅ **Save/Load presets** : Cohérence complète
- ✅ **Tous types de filtres** : Stabilité système complète
- ✅ **Performance** : Gros buffers (8192 échantillons)
- ✅ **Reset système** : Remise à zéro globale

### **🔥 Ultra Stress :**
- ✅ **Stress de mémoire massive** : 1000 instances + 1M échantillons
- ✅ **Stress de performance extrême** : 10M échantillons + 10k itérations
- ✅ **Stress de stabilité numérique** : Valeurs extrêmes + denormales
- ✅ **Stress multi-threading** : Tous les cœurs CPU simultanément
- ✅ **Stress de paramètres temps réel** : 10k modifications en boucle
- ✅ **Stress de cascade de filtres** : 100 filtres en cascade
- ✅ **Stress de presets** : 1000 presets + 10k opérations
- ✅ **Stress de validation de paramètres** : Valeurs hors limites extrêmes
- ✅ **Stress de débordement de buffer** : 14 tailles différentes
- ✅ **Stress de régression** : 10k tests de cohérence

## 🔧 Compilation Manuelle

Si vous voulez compiler manuellement :

```bash
# Test AudioEqualizer
g++ -std=c++20 -Wall -Wextra -I. -I../../ -O2 -o test_audio_equalizer test_audio_equalizer.cpp ../../shared/Audio/core/AudioEqualizer.cpp ../../shared/Audio/core/BiquadFilter.cpp
./test_audio_equalizer

# Test BiquadFilter  
g++ -std=c++20 -Wall -Wextra -I. -I../../ -O2 -o test_biquad_filter test_biquad_filter.cpp ../../shared/Audio/core/BiquadFilter.cpp
./test_biquad_filter

# Test Integration
g++ -std=c++20 -Wall -Wextra -I. -I../../ -O2 -o test_core_integration test_core_integration.cpp ../../shared/Audio/core/AudioEqualizer.cpp ../../shared/Audio/core/BiquadFilter.cpp
./test_core_integration

# Test Ultra Stress (⚠️ Très intensif)
g++ -std=c++20 -Wall -Wextra -I. -I../../ -O2 -pthread -o test_stress_ultra test_stress_ultra.cpp ../../shared/Audio/core/AudioEqualizer.cpp ../../shared/Audio/core/BiquadFilter.cpp
./test_stress_ultra

## 🎯 Résultat Attendu

```
🧪 Testing AudioEqualizer.hpp...
✅ Default constructor OK
✅ Parameterized constructor OK
✅ Band gain controls OK
✅ Band frequency controls OK
✅ Band Q controls OK
✅ Band filter types OK
✅ Band enable/disable OK
✅ Master gain controls OK
✅ Bypass controls OK
✅ Sample rate controls OK
✅ Reset all bands OK
✅ Basic mono processing (bypass) OK
✅ Basic stereo processing (bypass) OK
✅ Preset management OK
✅ Preset factory OK
✅ Thread safety (ParameterUpdateGuard) OK
✅ Band index validation OK
✅ Processing with master gain OK
🎉 AudioEqualizer.hpp - ALL TESTS PASSED!

🧪 Testing BiquadFilter.hpp...
✅ Default constructor OK
✅ Manual coefficient setting OK
✅ Lowpass filter calculation OK
✅ Highpass filter calculation OK
✅ Bandpass filter calculation OK
✅ Notch filter calculation OK
✅ Peaking filter calculation OK
✅ Low shelf filter calculation OK
✅ High shelf filter calculation OK
✅ Allpass filter calculation OK
✅ Mono processing OK
✅ Stereo processing OK
✅ Filter reset OK
✅ Single sample processing OK
✅ Stability with extreme values OK
✅ Coefficient consistency across frequencies OK
✅ Different Q factors OK
✅ Degenerate case handling (b0=0) OK
🎉 BiquadFilter.hpp - ALL TESTS PASSED!

🧪 TESTING CORE INTEGRATION...
✅ AudioEqualizer processes signal through BiquadFilters
✅ Preset integration with filters OK
✅ Integrated stereo processing OK
✅ Real-time parameter changes OK
✅ Thread-safe parameter updates OK
✅ Bypass vs active processing OK
✅ Complete preset save/load OK
✅ Stability with all filter types OK
✅ Performance with large buffers OK
✅ Complete system reset OK
🎉 CORE INTEGRATION - ALL TESTS PASSED!

🔥🔥🔥 TESTS DE STRESS ULTRA PUSSÉS - MODULE CORE 🔥🔥🔥
=====================================================
✅ Test 1: Stress de mémoire massive OK
✅ Test 2: Stress de performance extrême OK
✅ Test 3: Stress de stabilité numérique extrême OK
✅ Test 4: Stress multi-threading extrême OK
✅ Test 5: Stress de paramètres temps réel extrême OK
✅ Test 6: Stress de cascade de filtres extrême OK
✅ Test 7: Stress de presets extrême OK
✅ Test 8: Stress de validation de paramètres extrême OK
✅ Test 9: Stress de débordement de buffer extrême OK
✅ Test 10: Stress de régression extrême OK

🎉 TOUS LES TESTS CORE PASSENT !
✅ Code fonctionnel testé
✅ Intégration validée  
✅ Stabilité vérifiée
✅ Performance optimisée
✅ Thread safety assurée
✅ Tests de stress ultra poussés validés

## ⚠️ Dépannage

### **Erreur "g++ not found" :**
- Installer GCC, Clang ou MSVC
- Ou utiliser MSVC : `cl /std:c++20 /EHsc test_audio_equalizer.cpp ...`

### **Erreur de compilation C++ :**
- Vérifier que le compilateur supporte C++20 (requis)
- Les tests utilisent `std::span`, `std::ranges`, concepts C++20

### **Erreur d'include :**
- Vérifier les chemins relatifs vers `shared/Audio/core/`
- Les tests doivent être exécutés depuis `__tests__/core/`
- Vérifier que `compat/format.hpp` est présent

### **Erreurs de linkage :**
- Compiler avec tous les fichiers source nécessaires
- AudioEqualizer nécessite BiquadFilter.cpp
- Utiliser `-I../../` pour les includes

## 📈 Fonctionnalités Testées

### **🎛️ AudioEqualizer :**
- **10 bandes d'égalisation** avec fréquences prédéfinies
- **8 types de filtres** par bande
- **10 presets d'usine** (Rock, Pop, Jazz, Classical, etc.)
- **Gain master** avec limites (-24dB à +24dB)  
- **Mode bypass** transparent
- **Thread safety** avec verrous atomiques
- **Traitement optimisé** mono et stéréo
- **Validation robuste** des paramètres

### **🔧 BiquadFilter :**
- **8 types de filtres** audio professionnels
- **Calcul des coefficients** mathématiquement correct
- **Traitement optimisé** avec unrolling et prefetch
- **Support stéréo** avec état indépendant
- **Prévention des denormales** et stabilité numérique
- **API moderne C++20** avec concepts et spans

### **🔗 Integration :**
- **Cohérence système** entre tous les composants
- **Performance temps réel** validée
- **Robustesse** avec configurations complexes
- **Gestion mémoire** correcte et thread-safe

### **🔥 Ultra Stress :**
- **Tests de mémoire massive** : Validation de la gestion mémoire avec 1000 instances
- **Tests de performance extrême** : Validation du débit avec 10M échantillons
- **Tests de stabilité numérique** : Validation avec valeurs extrêmes et denormales
- **Tests multi-threading** : Validation de la concurrence sur tous les cœurs
- **Tests de paramètres temps réel** : Validation des modifications dynamiques
- **Tests de cascade** : Validation de la stabilité avec 100 filtres en série
- **Tests de presets** : Validation de la gestion de 1000 presets
- **Tests de validation** : Validation avec paramètres hors limites
- **Tests de buffer** : Validation avec différentes tailles de buffer
- **Tests de régression** : Validation de la cohérence sur 10k itérations

## 🎯 Bénéfices

Cette approche de test **directement sur le code fonctionnel** garantit :
- 🎯 **Tests réels** des fonctionnalités audio
- ⚡ **Validation performance** en conditions réelles  
- 🌐 **Cross-platform compatibility** vérifiée
- 🔒 **Thread safety** validée en pratique
- 📊 **Qualité audio** mesurée et vérifiée
- 🔥 **Tests de stress ultra poussés** pour validation production intensive
