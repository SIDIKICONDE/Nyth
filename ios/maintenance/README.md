# 🛠️ Scripts de Maintenance iOS

## Vue d'ensemble

Cette collection de scripts facilite la maintenance quotidienne du projet iOS React Native Nyth. Tous les scripts sont conçus pour être sûrs, automatisés et réversibles.

## 📂 Structure

```
ios/maintenance/
├── README.md                    # Cette documentation
├── maintenance_menu.sh          # Menu principal interactif
├── clean_cache.sh              # Nettoyage des caches
├── check_project.sh            # Diagnostic du projet
├── backup_project.sh           # Sauvegarde complète
├── update_dependencies.sh      # Mise à jour CocoaPods
└── monitor_performance.sh      # Monitoring performances
```

## 🚀 Utilisation

### Menu Interactif (Recommandé)

```bash
cd ios
./maintenance/maintenance_menu.sh
```

**Interface interactive avec :**
- Menu coloré et intuitif
- Descriptions claires des actions
- Confirmations avant exécution
- Résumés des opérations

### Scripts Individuels

#### 1. Nettoyage Complet
```bash
./maintenance/clean_cache.sh
```
- Supprime les données dérivées Xcode
- Nettoie les caches CocoaPods
- Supprime les builds temporaires
- Nettoie les fichiers de sauvegarde anciens

#### 2. Diagnostic du Projet
```bash
./maintenance/check_project.sh
```
- Vérifie la structure du projet
- Contrôle les dépendances
- Analyse l'état des sauvegardes
- Détecte les problèmes potentiels

#### 3. Sauvegarde Complète
```bash
./maintenance/backup_project.sh
```
- Sauvegarde horodatée complète
- Configuration Xcode + Workspace
- Scripts et configurations
- Documentation automatique

#### 4. Mise à Jour Dépendances
```bash
./maintenance/update_dependencies.sh
```
- Met à jour CocoaPods
- Réinstalle tous les pods
- Nettoie les caches
- Vérifie la compatibilité

#### 5. Monitoring Performances
```bash
./maintenance/monitor_performance.sh
```
- Analyse des ressources système
- État des caches et builds
- Recommandations d'optimisation
- Métriques de performance

## 🎯 Commandes Make (Alternative)

```bash
# Aide et démonstration
make help          # Aide complète
make demo          # Simulation

# Modules shared/
make add-shared    # Ajouter tous les modules
make remove-shared # Supprimer tous les modules
make status        # État du projet

# Sauvegardes
make backup        # Sauvegarde manuelle
make list-backups  # Lister les sauvegardes

# Nettoyage
make clean         # Supprimer scripts temporaires
```

## 🛡️ Fonctionnalités de Sécurité

### Sauvegardes Automatiques
- **Créées automatiquement** avant chaque modification
- **Horodatées** : `backup_AAAAMMJJ_HHMMSS`
- **Réversibles** : Restauration simple
- **Nettoyées** : Anciennes sauvegardes supprimées automatiquement

### Vérifications de Prérequis
- **Ruby et gem xcodeproj** : Vérifiés avant exécution
- **Structure du projet** : Validée avant modifications
- **Dépendances** : Contrôlées avant mise à jour

### Gestion d'Erreurs
- **Arrêt sécurisé** en cas d'erreur
- **Messages clairs** pour le diagnostic
- **Suggestions de résolution** des problèmes

## 📊 Fonctionnalités Clés

### 🔍 Diagnostic Intelligent
- **Structure complète** : Vérification de tous les fichiers
- **État des caches** : Analyse des tailles et âges
- **Dépendances** : Contrôle des pods et versions
- **Sauvegardes** : Historique et intégrité

### 💾 Sauvegarde Complète
- **Tous les fichiers importants** sauvegardés
- **Documentation automatique** des changements
- **Compression optimisée** pour l'espace disque
- **Restauration simple** en cas de problème

### ⚡ Monitoring Performances
- **Ressources système** : CPU, mémoire, disque
- **Caches et builds** : Tailles et états
- **Recommandations** : Optimisations suggérées
- **Métriques temps réel** : Pendant la compilation

### 🧹 Nettoyage Intelligent
- **Caches volumineux** détectés automatiquement
- **Fichiers temporaires** nettoyés en sécurité
- **Anciennes sauvegardes** gérées automatiquement
- **Espace disque** optimisé

## 🎨 Interface Utilisateur

### Couleurs et Symboles
- 🔵 **Bleu** : Informations générales
- 🟢 **Vert** : Succès et confirmations
- 🟡 **Jaune** : Avertissements
- 🔴 **Rouge** : Erreurs
- 🟣 **Violet** : Titres et résumés

### Messages Clairs
- ✅ **Succès** : Actions terminées avec succès
- ⚠️  **Avertissements** : Points d'attention
- ❌ **Erreurs** : Problèmes nécessitant action
- ℹ️  **Informations** : Détails techniques

## 🔧 Personnalisation

### Modification des Chemins
```bash
# Dans chaque script, modifiez ces variables :
SHARED_PATH="../shared"          # Chemin vers shared/
PROJECT_PATH="Nyth.xcodeproj"    # Nom du projet
WORKSPACE_NAME="Nyth"           # Nom de la target
```

### Ajout de Nouveaux Scripts
```bash
# 1. Créer le script dans maintenance/
# 2. Le rendre exécutable: chmod +x maintenance/script.sh
# 3. L'ajouter au menu maintenance_menu.sh
# 4. Mettre à jour cette documentation
```

## 🐛 Dépannage

### Script ne s'exécute pas
```bash
# Vérifier les permissions
ls -la maintenance/*.sh

# Rendre exécutable
chmod +x maintenance/*.sh
```

### Erreur "command not found"
```bash
# Installer les dépendances manquantes
gem install xcodeproj
brew install cocoapods
```

### Problème de chemins
```bash
# Vérifier la structure
cd ios
ls -la
ls -la maintenance/
```

### Restauration d'urgence
```bash
# Utiliser une sauvegarde
cp ios/Nyth.xcodeproj/project.pbxproj.backup_* ios/Nyth.xcodeproj/project.pbxproj
```

## 📋 Bonnes Pratiques

### Maintenance Régulière
1. **Hebdomadaire** : `./maintenance/clean_cache.sh`
2. **Mensuel** : `./maintenance/backup_project.sh`
3. **Avant modifications** : `./maintenance/check_project.sh`

### Avant de Commiter
1. Nettoyer : `make clean`
2. Vérifier : `make status`
3. Sauvegarder : `make backup`

### En Cas de Problème
1. Diagnostiquer : `./maintenance/check_project.sh`
2. Restaurer : Utiliser une sauvegarde
3. Nettoyer : `./maintenance/clean_cache.sh`

## 🎉 Avantages

### ⏱️ **Gain de Temps**
- Scripts automatisés remplacent les tâches manuelles
- Interface interactive guide l'utilisateur
- Exécution en une commande

### 🛡️ **Sécurité Maximale**
- Sauvegardes automatiques avant chaque action
- Vérifications de prérequis systématiques
- Possibilité d'annulation à tout moment

### 📊 **Visibilité Complète**
- État du projet toujours connu
- Métriques et statistiques détaillées
- Recommandations d'optimisation

### 🔧 **Maintenance Simplifiée**
- Problèmes détectés automatiquement
- Solutions suggérées pour chaque problème
- Documentation intégrée et à jour

---

*Scripts de maintenance créés pour optimiser le développement iOS React Native*
