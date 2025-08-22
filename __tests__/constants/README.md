# 🧪 Tests Unitaires - Centralisation des Constantes

## 📋 Vue d'ensemble

Cette suite de tests valide la **centralisation complète des constantes** dans les modules audio de Nyth.

### 🎯 **212 constantes centralisées** dans **4 modules** :

| Module | Fichier | Constantes | Domaine |
|--------|---------|------------|---------|
| **Core** | `CoreConstants.hpp` | ~50 | Equalizer, BiquadFilter, Math |
| **Effects** | `EffectConstants.hpp` | ~56 | Compressor, Delay |
| **Safety** | `SafetyContants.hpp` | ~50 | Audio Protection, Clipping |
| **Utils** | `utilsConstants.hpp` | ~56 | Buffers, SIMD, Performance |

## 🚀 Exécution des Tests

### **Windows (PowerShell):**
```powershell
cd __tests__/constants
.\run_tests.ps1
```

### **Windows (Batch):**
```cmd
cd __tests__\constants
run_tests.bat
```

### **Unix/Linux/macOS:**
```bash
cd __tests__/constants
make test
```

## 📁 Fichiers de Test

### **Tests Unitaires C++:**
- `test_core_constants.cpp` - Teste `CoreConstants.hpp` 
- `test_effect_constants.cpp` - Teste `EffectConstants.hpp`
- `test_safety_constants.cpp` - Teste `SafetyContants.hpp`
- `test_utils_constants.cpp` - Teste `utilsConstants.hpp`
- `test_integration.cpp` - Teste la compilation globale

### **Scripts d'Exécution:**
- `run_tests.ps1` - Script PowerShell cross-platform
- `run_tests.bat` - Script Batch Windows
- `Makefile` - Build system Unix/Linux/macOS

## ✅ Ce que les Tests Valident

### **🔍 Compilation:**
- ✅ Tous les headers se compilent sans erreur
- ✅ Includes robustes fonctionnent sur toutes plateformes
- ✅ Types `uint32_t`, `size_t` correctement définis
- ✅ Namespaces cohérents

### **📊 Valeurs des Constantes:**
- ✅ Ranges mathématiques (PI, sample rates, etc.)
- ✅ Cohérence entre modules (DB_CONVERSION_FACTOR = 20.0 partout)
- ✅ Valeurs par défaut dans les bonnes ranges
- ✅ Constantes SIMD optimisées (puissances de 2)

### **🎯 Qualité du Code:**
- ✅ Zéro duplication de constantes entre modules
- ✅ Élimination complète des nombres magiques
- ✅ Organisation logique par catégories
- ✅ Performance (toutes les constantes sont `constexpr`)

## 🔧 Compilation Manuelle

Si vous voulez compiler manuellement :

```bash
# Test CoreConstants
g++ -std=c++17 -I. -o test_core test_core_constants.cpp
./test_core

# Test EffectConstants  
g++ -std=c++17 -I. -o test_effect test_effect_constants.cpp
./test_effect

# Test SafetyConstants
g++ -std=c++17 -I. -o test_safety test_safety_constants.cpp
./test_safety

# Test UtilsConstants
g++ -std=c++17 -I. -o test_utils test_utils_constants.cpp
./test_utils
```

## 🎯 Résultat Attendu

```
🧪 Testing CoreConstants.hpp...
✅ Mathematical constants OK
✅ Sample rates OK
✅ Equalizer bands OK
✅ Q factor ranges OK
✅ Gain ranges OK
✅ EqualizerConstants namespace OK
✅ BiquadConstants namespace OK
✅ Default frequencies OK
✅ Performance constants OK
✅ Preset gains arrays OK
✅ Consteval functions OK
🎉 CoreConstants.hpp - ALL TESTS PASSED!

[... autres tests ...]

🎉 TOUS LES TESTS PASSENT !
✅ 212 constantes centralisées et validées
✅ Cross-platform compatible  
✅ Performance optimisée
```

## ⚠️ Dépannage

### **Erreur "g++ not found":**
- Installer GCC ou Clang
- Ou utiliser MSVC: `cl /std:c++17 test_core_constants.cpp`

### **Erreur de compilation C++:**
- Vérifier que le compilateur supporte C++17 minimum
- Les headers utilisent des includes robustes avec fallbacks

### **Erreur d'include:**
- Vérifier les chemins relatifs vers `shared/Audio/`
- Les tests doivent être exécutés depuis `__tests__/constants/`

## 📈 Bénéfices

Cette approche de test **directement sur le code C++** garantit :
- 🎯 **Tests réels** (pas de mocks)
- ⚡ **Validation compile-time** des constantes  
- 🌐 **Cross-platform compatibility** vérifiée
- 🔒 **Type safety** validée
- 📊 **Performance impact** mesuré
