# 🔍 Vérifications CI/CD des Namespaces

Ce guide explique comment intégrer les vérifications automatiques des namespaces dans votre pipeline CI/CD.

## 🎯 Objectif

Maintenir la cohérence des namespaces refactorisés et empêcher les régressions.

## 📋 Règles Vérifiées

### ✅ Conventions Respectées

- **Using declarations** présentes dans chaque module TurboModule
- **Références courtes** utilisées au lieu de `Nyth::Audio::*`
- **Namespace `facebook::react`** pour les modules TurboModule
- **Using declarations** dans le bon namespace

### ❌ Erreurs Détectées

- Références longues `Nyth::Audio::*` non autorisées
- Using declarations manquantes
- Structure de namespaces incorrecte

## 🚀 Utilisation

### Exécution Locale

```bash
# Rendre le script exécutable
chmod +x scripts/verify_namespaces.sh

# Exécuter la vérification
./scripts/verify_namespaces.sh
```

### Intégration CI/CD

#### GitHub Actions

```yaml
# Copier .github/workflows/verify-namespaces.yml
# Le workflow se déclenche automatiquement sur push/PR
```

#### GitLab CI

```yaml
# Ajouter à votre .gitlab-ci.yml existant
include:
  - .gitlab-ci.yml # Votre config existante
```

#### Jenkins

```groovy
// Copier le Jenkinsfile dans votre repository
// Configurer le job Jenkins pour utiliser ce pipeline
```

#### Azure DevOps

```yaml
# Copier azure-pipelines.yml
# Le pipeline se déclenche sur les changements de fichiers
```

## 📊 Exemple de Sortie

### ✅ Succès

```
🔍 Vérification des namespaces...
📁 Vérification de shared/Audio/safety/NativeAudioSafetyModule.h...
✅ shared/Audio/safety/NativeAudioSafetyModule.h - OK
📁 Vérification de shared/Audio/safety/NativeAudioSafetyModule.cpp...
✅ shared/Audio/safety/NativeAudioSafetyModule.cpp - OK
...
🎉 Toutes les vérifications de namespaces sont passées avec succès !
```

### ❌ Échec

```
🔍 Vérification des namespaces...
📁 Vérification de shared/Audio/safety/NativeAudioSafetyModule.h...
❌ ERREUR: shared/Audio/safety/NativeAudioSafetyModule.h - Using declarations Nyth::Audio manquantes
❌ ERREUR: shared/Audio/safety/NativeAudioSafetyModule.h - Références longues Nyth::Audio::* non autorisées
42:Nyth::Audio::SafetyConfig config_;
❌ 2 erreurs de namespaces trouvées. Veuillez corriger.
```

## 🛠️ Personnalisation

### Ajouter de Nouveaux Modules

Éditer `scripts/verify_namespaces.sh` :

```bash
MODULE_FILES=(
    # Ajouter vos nouveaux modules ici
    "shared/Audio/nouveau/NativeNouveauModule.h"
    "shared/Audio/nouveau/NativeNouveauModule.cpp"
    # ... autres fichiers
)
```

### Modifier les Règles

Ajuster les patterns de vérification selon vos besoins :

```bash
# Exemple : Autoriser certains namespaces spécifiques
if grep -q "Nyth::Audio::[A-Z]" "$file" && ! grep -q "using Nyth::Audio::" "$file"; then
    # Erreur seulement si pas de using declaration
fi
```

## 🔧 Dépannage

### Erreur : "Permission denied"

```bash
chmod +x scripts/verify_namespaces.sh
```

### Erreur : "Fichier non trouvé"

- Vérifier les chemins dans `MODULE_FILES`
- S'assurer que les fichiers existent dans le repository

### Pipeline qui échoue injustement

- Vérifier la syntaxe des using declarations
- S'assurer que tous les namespaces sont corrects
- Exécuter localement pour diagnostiquer

## 🎯 Avantages CI/CD

### 🚀 Automatisation

- **Vérifications automatiques** à chaque commit
- **Blocage des merges** si erreurs détectées
- **Rapports détaillés** des problèmes

### 👥 Collaboration

- **Standards imposés** pour toute l'équipe
- **Feedback rapide** aux développeurs
- **Qualité garantie** du code

### 📈 Maintenance

- **Prévention des régressions** de namespaces
- **Documentation vivante** des conventions
- **Évolution contrôlée** de l'architecture

## 📞 Support

Pour toute question ou problème :

1. Exécuter le script localement pour diagnostiquer
2. Vérifier la syntaxe des using declarations
3. Consulter les logs détaillés du pipeline
