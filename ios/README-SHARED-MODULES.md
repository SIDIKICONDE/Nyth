# 📦 Scripts de gestion des modules Shared

## Description

Ces scripts permettent d'ajouter ou supprimer automatiquement tous les fichiers du dossier `shared/` au projet Xcode.

## 📁 Structure des modules

Le dossier `shared/` contient :

### 🎵 Audio/
- **Core** : Module audio principal (Equalizer, Filtres, etc.)
- **Effects** : Effets audio (Compressor, Delay, etc.)
- **FFT** : Analyse spectrale
- **Noise** : Réduction de bruit (Spectral NR, Wiener, etc.)
- **Safety** : Sécurité audio (Clipping, Limiteur, etc.)
- **Common** : Utilitaires communs (DSP, SIMD, Config)

### 🎬 Videos/
- **Core** : Traitement vidéo FFmpeg
- **Components** : Gestionnaire de filtres
- **Platform** : Support multi-plateforme
- **Utils** : Utilitaires FFmpeg

## 🚀 Utilisation

### 🛠️ **Via Makefile (recommandé)**

```bash
cd ios

# Afficher l'aide
make help

# Voir la démonstration
make demo

# Ajouter tous les modules shared/
make add-shared

# Supprimer tous les modules shared/
make remove-shared

# Voir l'état du projet
make status

# Créer une sauvegarde manuelle
make backup

# Lister les sauvegardes
make list-backups
```

### 🔧 **Via Scripts Ruby (direct)**

```bash
cd ios

# Ajouter les modules
ruby add_shared_modules.rb

# Supprimer les modules
ruby remove_shared_modules.rb

# Voir la démonstration
ruby demo_shared_modules.rb
```

### 📋 **Raccourcis Makefile :**

```bash
# Raccourcis pratiques
make install    # = make add-shared
make uninstall  # = make remove-shared
make clean      # Supprimer les scripts temporaires
```

### 📋 **Ce que font les scripts :**

#### **Script d'ajout :**
- ✅ **Sauvegarde automatique** avant modifications
- ✅ **Protection contre les doublons** - détecte les fichiers déjà présents
- ✅ Parcourt récursivement le dossier `../shared/`
- ✅ Identifie automatiquement les fichiers C/C++/Objective-C
- ✅ Crée une structure de groupes identique à l'arborescence
- ✅ Ajoute tous les fichiers sources à la compilation
- ✅ Ajoute les headers aux groupes (pour la navigation)
- ✅ Sauvegarde le projet

#### **Script de suppression :**
- ✅ **Sauvegarde automatique** avant modifications
- ✅ Supprime tous les fichiers du groupe 'shared'
- ✅ Supprime tous les groupes créés
- ✅ Nettoie les références de compilation
- ✅ Sauvegarde le projet

## 📋 Prérequis

- Ruby installé (version >= 2.0)
- Gem `xcodeproj` : `gem install xcodeproj`
- Projet Xcode `Nyth.xcodeproj` dans le dossier `ios/`
- Dossier `shared/` au niveau parent (`../shared/`)

## 🔧 Configuration

Le script utilise ces chemins par défaut :
- **Dossier shared** : `../shared` (relatif au dossier ios/)
- **Projet Xcode** : `Nyth.xcodeproj`
- **Target** : `Nyth`

Pour modifier ces chemins, éditez les constantes en haut des scripts.

## 📊 Extensions supportées

### Sources (ajoutés à la compilation) :
- `.cpp`, `.c`, `.mm`, `.m`

### Headers (ajoutés aux groupes) :
- `.hpp`, `.h`

## 🛡️ Sauvegardes automatiques

Les scripts créent automatiquement des sauvegardes horodatées avant chaque modification :

```
ios/Nyth.xcodeproj/
├── project.pbxproj
├── project.pbxproj.backup_20241225_143022  ← Sauvegarde automatique
├── project.pbxproj.backup_20241225_145500  ← Autre sauvegarde
└── project.pbxproj.backup_safety           ← Version connue stable
```

### Restaurer une sauvegarde :
```bash
cp ios/Nyth.xcodeproj/project.pbxproj.backup_20241225_143022 ios/Nyth.xcodeproj/project.pbxproj
```

## 🚫 Protection contre les doublons

### Comment ça fonctionne :
- ✅ **Vérification d'existence** avant chaque ajout
- ✅ **Messages d'avertissement** quand un doublon est détecté
- ✅ **Pas d'écrasement** des fichiers existants
- ✅ **Statistiques détaillées** des doublons évités

### Exemple de messages :
```bash
✅ Source: Audio/common/dsp/BiquadFilter.cpp
⚠️  Source déjà présent: Audio/common/dsp/BiquadFilter.hpp
📄 Header: Audio/common/dsp/FFTEngine.hpp
⚠️  Header déjà présent: Audio/common/dsp/BranchFreeAlgorithms.hpp
```

### Avantages :
- **Sécurité** : Impossible de créer des doublons accidentels
- **Performance** : Évite les recompilations inutiles
- **Clarté** : Arborescence propre sans fichiers dupliqués
- **Feedback** : Messages clairs sur ce qui est ajouté/ignoré

## ⚠️ Important

### Avant d'ajouter :
1. **Sauvegarde automatique** créée par le script ✅
2. **Fermez** Xcode complètement
3. **Vérifiez** que le dossier `shared/` existe et contient les fichiers

### Après l'ajout :
1. **Ouvrez** le workspace : `open ios/Nyth.xcworkspace`
2. **Vérifiez** la structure dans le navigateur (groupe 'shared')
3. **Configurez** les chemins d'inclusion si nécessaire :
   - Dans Build Settings → Header Search Paths : `../shared`
   - Dans Build Settings → User Header Search Paths : `../shared`
4. **Testez** la compilation : Cmd+B

### Nettoyage :
- Le script de suppression ne touche pas au dossier physique `shared/`
- Utilisez `git status` pour voir les modifications
- Utilisez `git checkout HEAD -- ios/Nyth.xcodeproj/project.pbxproj` pour restaurer

## 🎯 Résultat attendu

Après exécution du script `add_shared_modules.rb` :

```
ios/Nyth.xcodeproj/
├── Nyth/
├── Frameworks/
├── Products/
└── shared/           ← Nouveau groupe
    ├── Audio/
    │   ├── core/
    │   ├── effects/
    │   ├── fft/
    │   ├── noise/
    │   ├── safety/
    │   └── common/
    └── Videos/
        ├── Core/
        ├── Components/
        └── ...
```

## 🐛 Dépannage

### Erreur "Target 'Nyth' non trouvée"
- Vérifiez que le projet contient bien une target nommée 'Nyth'
- Modifiez la ligne `t.name == 'Nyth'` dans le script

### Erreur "Dossier shared/ non trouvé"
- Vérifiez que vous exécutez le script depuis `ios/`
- Vérifiez que `../shared/` existe
- Modifiez `SHARED_PATH` dans le script

### Compilation échoue
- Vérifiez les chemins d'inclusion dans Build Settings
- Assurez-vous que toutes les dépendances sont installées
- Vérifiez les erreurs spécifiques dans le rapport de compilation

### Trop de fichiers ajoutés
- Le script ajoute tous les fichiers C/C++, ce qui peut être volumineux
- Utilisez le script de suppression puis modifiez les extensions dans `SOURCE_EXTENSIONS`

## 📝 Notes

- Le script préserve la structure hiérarchique exacte du dossier `shared/`
- Les fichiers sont ajoutés avec des chemins relatifs (`../shared/...`)
- Seuls les fichiers sources sont ajoutés à la compilation
- Les headers sont visibles dans l'arborescence pour la navigation
- Le dossier `output/` est automatiquement ignoré (fichiers générés)

---

*Scripts créés pour automatiser l'intégration des modules C++ dans les projets React Native iOS*
