# 📋 Guide Complet des Commandes Make - Maintenance iOS React Native

## Vue d'ensemble

Ce guide présente le système complet de maintenance pour votre projet iOS React Native. Toutes les commandes sont accessibles via `make` et organisées par catégories pour faciliter la navigation.

## 🎯 Commandes de Base

### Aide et Information
```bash
make help              # Afficher cette aide complète
make demo              # Voir la démonstration des scripts
```

## 📂 Gestion des Modules Shared

### Commandes principales
```bash
make add-shared        # ➕ Ajouter tous les modules shared/ au projet
make remove-shared     # ➖ Supprimer tous les modules shared/ du projet
```

### Description
- **add-shared** : Intègre automatiquement tous les fichiers C++ du dossier `../shared/` dans le projet Xcode
- **remove-shared** : Retire proprement tous les modules shared du projet (sans supprimer les fichiers physiques)

### Utilisation
```bash
# Après avoir ajouté du code dans shared/
make add-shared

# Pour nettoyer le projet
make remove-shared
```

## 🛠️ Maintenance Complète

### Diagnostic et Monitoring
```bash
make maintenance       # 🎯 Menu de maintenance interactif complet
make check-project     # 🔍 Diagnostiquer l'état du projet
make monitor           # 📊 Monitorer les performances système
make maintenance-all   # 🔄 Exécuter toutes les vérifications
```

### Sauvegarde et Sécurité
```bash
make backup-project    # 💾 Sauvegarde complète du projet
make backup            # 📋 Créer une sauvegarde manuelle rapide
make list-backups      # 📂 Lister toutes les sauvegardes
```

### Nettoyage et Cache
```bash
make clean-cache       # 🧹 Nettoyer tous les caches (Metro, Xcode, etc.)
make assets-clean      # 🖼️  Nettoyer le cache des assets React Native
make clear-logs        # 🗑️  Effacer tous les logs système
make clean             # 🧽 Nettoyer les fichiers temporaires
```

### 🔧 Problèmes de Compilation
```bash
make fix-react-imports   # Corriger les imports React
make rebuild-xcode-cache # Rebuild cache Xcode
make fix-build-issues    # Fix complet des problèmes de build
```

### Raccourcis de compilation
```bash
make fix-build           # = fix-build-issues
make rebuild-cache       # = rebuild-xcode-cache
make fix-imports         # = fix-react-imports
```

### Utilisation recommandée
```bash
# Workflow de maintenance quotidien
make check-project
make clean-cache
make backup-project

# En cas de problèmes de compilation
make fix-build-issues  # 🛠️ Fix automatique des erreurs React
make rebuild-xcode-cache # 🔄 Rebuild cache si nécessaire
make fix-react-imports # 🔧 Diagnostic des imports React

# En cas de problèmes généraux
make troubleshoot      # 🛠️ Dépannage automatique
```

## ⚛️ Dépendances React Native

### Installation complète
```bash
make install-deps      # 📦 Installer node_modules + mettre à jour pods
make setup-react-native # 🚀 Configuration complète React Native
```

### Gestion séparée
```bash
make install-node-modules  # 📦 Installer seulement node_modules
make update-deps          # 🔄 Mettre à jour CocoaPods
make link-deps            # 🔗 Lier les dépendances natives
```

### Nettoyage
```bash
make clean-deps           # 🧹 Nettoyer node_modules + pods
make clean-node-modules   # 📦 Supprimer node_modules uniquement
```

### Utilisation
```bash
# Configuration initiale
make setup-react-native

# Mise à jour régulière
make install-deps

# En cas de problèmes de dépendances
make clean-deps
make install-deps
make link-deps
```

## 🚀 Simulateur & Processus

### Gestion des processus
```bash
make stop-ports          # 🛑 Arrêter les processus sur les ports (8081, 3000, etc.)
make kill-processes      # 💀 Tuer tous les processus React Native
```

### Gestion du simulateur
```bash
make clean-simulator     # 🧹 Nettoyer les données du simulateur (sims préservés)
make reset-simulator     # 🔄 Reset des données (sims préservés)
make start-simulator     # 🚀 Démarrer le simulateur iOS
```

### Workflows combinés
```bash
make fresh-start         # 🔄 Tuer processus + nettoyer sim + démarrer
make troubleshoot        # 🛠️ Arrêt ports + kill processus + clean cache
```

### ⚠️ Note importante
**Toutes les commandes préservent vos simulateurs iOS** - seules les données d'applications sont nettoyées.

### Utilisation
```bash
# Démarrage propre de développement
make fresh-start

# En cas de blocage de port Metro
make stop-ports
make start-simulator

# Nettoyage sans risque
make clean-simulator
```

## 🧪 Tests & Qualité

### Exécution des tests
```bash
make test               # 🧪 Exécuter tous les tests (Jest/Mocha/Jasmine)
make test-watch         # 👀 Tests en mode watch (développement)
make test-coverage      # 📊 Tests avec rapport de couverture
```

### Raccourcis
```bash
make test-all           # 🧪 Tests + coverage
make test-dev           # 👀 Tests en mode développement
```

### Configuration
Les tests détectent automatiquement votre framework de test dans `package.json`. Si aucun n'est trouvé :
```bash
npm install --save-dev jest
```

### Utilisation
```bash
# Tests complets avant commit
make test-all

# Développement avec tests
make test-watch

# Vérification de la qualité
make test-coverage
```

## 📦 Déploiement & Distribution

### Création d'archives
```bash
make archive            # 📦 Créer une archive iOS pour distribution
```

### Export pour différentes destinations
```bash
make export-dev         # 📤 Export pour développement/test (AdHoc)
make export-prod        # 📤 Export pour production (App Store)
```

### Workflows complets
```bash
make build-dev          # 📦 Archive + export développement
make build-prod         # 📦 Archive + export production
make build-archive      # 📦 Archive seule
```

### Vérifications préalables
```bash
make code-sign-check    # 🔐 Vérifier les certificats de signature
make provisioning       # 📄 Gérer les provisioning profiles
```

### Prérequis pour le déploiement
1. **Certificat de distribution** valide
2. **Provisioning profile** pour la destination
3. **Fichiers exportOptions** configurés :
   - `exportOptions-dev.plist`
   - `exportOptions-prod.plist`

### Utilisation
```bash
# Vérifications avant déploiement
make code-sign-check
make provisioning

# Build pour développement
make build-dev

# Build pour production
make build-prod
```

## 📱 Devices & Debugging

### Gestion des devices
```bash
make devices            # 📱 Lister tous les devices connectés
```

### Debugging et logs
```bash
make logs               # 📋 Afficher les logs en temps réel
```

### Gestion des versions
```bash
make version            # 📋 Afficher la version actuelle
make bump-version       # ⬆️ Incrémenter la version (build number)
```

### Xcode et développement
```bash
make open-project       # 📱 Ouvrir le projet dans Xcode
make xcode              # 🏃 Raccourci rapide pour Xcode
```

### Raccourcis
```bash
make show-version       # 📋 = version
make inc-version        # ⬆️ = bump-version
```

### Utilisation
```bash
# Vérifier les devices disponibles
make devices

# Debug temps réel (Ctrl+C pour arrêter)
make logs

# Gestion des versions
make version
make bump-version
```

## 🏃 Raccourcis Pratiques

### Workflows combinés
```bash
# Développement
make dev-setup          # 🛠️ Setup complet : clean + install + link + sim
make dev-clean          # 🧹 Nettoyage complet : assets + logs + cache
make dev-logs           # 📋 = logs

# Maintenance
make fix-issues         # 🛠️ = troubleshoot
make doctor             # 🔍 = check-project
make perf               # 📊 = monitor

# Dépannage
make setup-rn           # 🚀 = setup-react-native
make install-all        # 📦 = install-deps
make clean-all          # 🧹 Nettoyage complet
make clean-all-deps     # 🧹 = clean-deps
```

### Raccourcis de gestion
```bash
# Modules shared
make install            # ➕ = add-shared
make uninstall          # ➖ = remove-shared

# Simulateur
make stop-all           # 🛑 = stop-ports
make kill-all           # 💀 Rappel vers kill-processes
make clean-sim          # 🧹 = clean-simulator
make reset-sim          # 🔄 = reset-simulator
make start-sim          # 🚀 = start-simulator
make fresh-start        # 🔄 Démarrage propre complet

# Sauvegardes
make full-backup        # 💾 = backup-project
```

## 🚨 Résolution des Erreurs de Compilation

### Erreur: "no such module 'React'"
**Symptôme:** Erreur Swift "import React" non trouvé

**Solution automatique:**
```bash
make fix-build-issues  # Fix complet en une commande
```

**Solutions détaillées:**
```bash
# 1. Fix complet automatique
make fix-build-issues

# 2. Si persiste, rebuild cache Xcode
make rebuild-xcode-cache

# 3. Diagnostic des imports
make fix-react-imports
```

**Actions effectuées par `fix-build-issues`:**
- ✅ Tue tous les processus React Native
- ✅ Nettoie le cache Metro
- ✅ Rebuild le cache Xcode
- ✅ Supprime les données dérivées

**Après le fix:**
```bash
make xcode              # Ouvrir Xcode
# Puis dans Xcode:
# Product > Clean Build Folder (Maj+Cmd+K)
# Cmd+B pour recompiler
```

### Autres Erreurs Courantes

#### Erreur: "Pods not found"
```bash
make clean-deps         # Nettoyer
make install-deps       # Réinstaller
```

#### Erreur: "Port 8081 already in use"
```bash
make stop-ports         # Libérer les ports
```

#### Erreur: "Simulator timeout"
```bash
make clean-simulator    # Nettoyer le sim
make start-simulator    # Redémarrer
```

## 📋 Workflows Recommandés

### 🚀 Configuration Initiale
```bash
make setup-react-native    # Installation complète
make dev-setup            # Setup développement
make test                 # Vérifier les tests
```

### 🔄 Développement Quotidien
```bash
make check-project        # Diagnostic matin
make clean-cache         # Nettoyage si lent
make dev-logs            # Debug si nécessaire
```

### 📦 Préparation de Release
```bash
make test-all            # Tests complets
make bump-version        # Incrémenter version
make build-prod          # Build production
make backup-project      # Sauvegarde avant release
```

### 🛠️ Dépannage
```bash
make troubleshoot        # Dépannage automatique
make clean-deps         # Si problèmes de dépendances
make install-deps       # Réinstallation complète
make fresh-start        # Redémarrage propre
```

### 🧹 Maintenance Hebdomadaire
```bash
make maintenance-all     # Vérifications complètes
make clean-all          # Nettoyage général
make backup-project      # Sauvegarde de sécurité
make list-backups        # Vérifier les sauvegardes
```

## ⚠️ Notes Importantes

### Sécurité
- **Sauvegardes automatiques** créées avant les opérations importantes
- **Confirmations utilisateur** pour les actions destructives
- **Simulateurs préservés** dans toutes les commandes

### Prérequis
- **Ruby >= 2.0** et **gem xcodeproj**
- **Dossier `../shared/`** pour les modules partagés
- **Xcode** installé pour les commandes natives
- **React Native CLI** pour certaines commandes

### Bonnes Pratiques
1. **Utilisez `make help`** pour découvrir les commandes
2. **Fermez Xcode** avant les opérations importantes
3. **Vérifiez les sauvegardes** avec `make list-backups`
4. **Testez sur simulateur** avant déploiement
5. **Utilisez les raccourcis** pour les workflows courants

## 🎯 Résumé des Catégories

| **Catégorie** | **Nombre** | **Objectif** |
|---------------|------------|--------------|
| **Maintenance** | 7 cmd | Sauvegardes, diagnostic, monitoring |
| **React Native** | 6 cmd | Dépendances, installation |
| **Simulateur** | 5 cmd | Processus, nettoyage |
| **Tests** | 3 cmd | Qualité, développement |
| **Déploiement** | 5 cmd | Distribution, archivage |
| **Debugging** | 4 cmd | Devices, logs, versions |
| **Nettoyage** | 3 cmd | Cache, assets, logs |
| **Shared** | 2 cmd | Modules C++ |
| **Raccourcis** | 15+ | Workflows combinés |

---

## 🎉 Prêt à l'utilisation !

**Votre système de maintenance iOS React Native est maintenant complet avec 30+ commandes organisées !**

**🚀 Commande principale :** `make help` pour explorer toutes les possibilités.

**📚 Documentation :** Ce guide couvre toutes les fonctionnalités disponibles.
