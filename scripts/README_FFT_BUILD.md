# Scripts de Build et Validation FFT

Ce dossier contient les scripts de validation et build pour le module FFT corrigé.

## Scripts Disponibles

### 1. `build_fft_module.sh` - Build Complet

Script complet de validation du module FFT avec compilation croisée iOS/Android.

**Usage:**

```bash
./scripts/build_fft_module.sh
```

**Ce qu'il fait:**

- ✅ Vérifie la présence de tous les fichiers requis
- ✅ Valide les corrections de compilation appliquées
- ✅ Compile les fichiers C++ (avec mock des headers React Native)
- ✅ Vérifie l'intégration iOS et Android
- ✅ Valide la cohérence TypeScript
- ✅ Génère un rapport détaillé

**Sortie attendue:**

```
🔧 Script de build et validation du module FFT
==============================================
[INFO] Vérification des fichiers requis...
[INFO] Tous les fichiers requis sont présents
[INFO] Vérification des corrections apportées...
[INFO] Toutes les corrections ont été appliquées correctement
[INFO] Compilation C++ basique des fichiers FFT...
[INFO] Compilation des headers réussie
[INFO] Compilation des sources réussie
[INFO] Spec TypeScript valide
[INFO] Compilation iOS...
[INFO] Compilation Android...
✅ Toutes les validations ont réussi !
Le module FFT est prêt pour l'intégration
```

### 2. `validate_fft_integration.sh` - Validation CI/CD

Script optimisé pour les pipelines CI/CD avec tests détaillés.

**Usage:**

```bash
./scripts/validate_fft_integration.sh
```

**Tests effectués:**

1. 📁 Présence des fichiers critiques
2. 🔧 Corrections de compilation
3. 🔗 API JSI correctement exposée
4. 📡 Callbacks implémentés
5. 📋 Includes corrigés
6. 🍎 Intégration iOS
7. 🤖 Intégration Android
8. 📘 Interface TypeScript

**Pour GitHub Actions:**

```yaml
- name: Validate FFT Module
  run: ./scripts/validate_fft_integration.sh
```

### 3. `test_fft_quick.sh` - Test Ultra-Rapide

Version minimaliste pour les workflows où le temps est critique.

**Usage:**

```bash
./scripts/test_fft_quick.sh
```

**Idéal pour:**

- Pré-commit hooks
- Tests de pull request rapides
- Validation avant push

## Corrections Validées

Les scripts vérifient que toutes les corrections suivantes sont appliquées:

### C++ Compilation

- ❌ ~~Using declarations non qualifiés~~ → ✅ Utilisation de noms qualifiés
- ❌ ~~Appels récursifs dans helpers~~ → ✅ Appels qualifiés `Nyth::Audio::*`
- ❌ ~~ArrayView mal initialisé~~ → ✅ Constructeur avec pointeur + taille
- ❌ ~~Includes relatifs incorrects~~ → ✅ Chemins corrigés

### JSI API

- ❌ ~~getState() retourne objet~~ → ✅ Retourne `number`
- ❌ ~~processAudioBuffer() retourne objet~~ → ✅ Retourne `boolean`
- ❌ ~~dispose() manquant~~ → ✅ Alias de `release()`
- ❌ ~~getSpectrumData() manquant~~ → ✅ Alias de `getLastSpectrumData()`
- ❌ ~~validateConfig() non exposé~~ → ✅ Exposé dans `install()`

### Callbacks

- ❌ ~~Signatures incohérentes~~ → ✅ `error(code, message)`, `stateChange(old, new)`
- ❌ ~~Arguments limités~~ → ✅ Support 2-4 arguments dans JSICallbackManager

### Intégration

- ❌ ~~Fichier iOS corrompu~~ → ✅ Includes nettoyés
- ❌ ~~CMakeLists Android incomplet~~ → ✅ FFTEngine.hpp référencé

## Utilisation dans CI

### GitHub Actions

```yaml
name: Validate FFT Module
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate FFT Integration
        run: ./scripts/validate_fft_integration.sh
```

### Jenkins

```groovy
stage('FFT Validation') {
    steps {
        sh './scripts/validate_fft_integration.sh'
    }
}
```

### Azure DevOps

```yaml
- task: Bash@3
  displayName: 'FFT Module Validation'
  inputs:
    targetType: 'inline'
    script: './scripts/validate_fft_integration.sh'
```

## Résolution des Problèmes

### Erreur: "Fichier critique manquant"

**Solution:** Vérifiez que tous les fichiers FFT sont présents dans `shared/Audio/fft/`

### Erreur: "Using declarations non qualifiés"

**Solution:** Les corrections n'ont pas été appliquées. Relancez les modifications.

### Erreur: "Compilation iOS échouée"

**Solution:** Installez Xcode ou vérifiez le workspace iOS.

### Erreur: "FFTEngine.hpp non référencé"

**Solution:** Ajoutez `FFTEngine.hpp` au `CMakeLists.txt` Android.

## Métriques de Validation

Le script `validate_fft_integration.sh` fournit:

- **8 tests** couvrant tous les aspects critiques
- **Rapport détaillé** avec emojis pour lisibilité
- **Code de sortie** approprié pour CI (0 = succès, 1 = échec)
- **Messages d'erreur** spécifiques pour faciliter le debug

## Support

Pour toute question sur ces scripts ou le module FFT:

1. Vérifiez d'abord que toutes les corrections sont appliquées
2. Exécutez `validate_fft_integration.sh` pour diagnostiquer
3. Consultez les logs détaillés pour identifier les problèmes spécifiques
