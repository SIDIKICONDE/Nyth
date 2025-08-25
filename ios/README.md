# 🛠️ Maintenance iOS React Native - Documentation Complète

## Vue d'ensemble

Ce dossier contient un système complet de maintenance pour votre projet iOS React Native, avec **30+ commandes organisées** accessibles via `make`.

## 📂 Structure

```
ios/
├── Makefile                    # 🚀 Commandes principales (30+)
├── README-MAKE.md             # 📖 Guide complet détaillé
├── README-SHARED-MODULES.md   # 📚 Guide gestion modules C++
├── maintenance/               # 🛠️ Scripts de maintenance
├── maintenance.sh             # 🎯 Lanceur menu interactif
└── [Scripts Ruby]             # 🔧 Gestion modules shared
```

## 🎯 Commandes Principales par Catégorie

### 🛠️ Maintenance & Diagnostic
```bash
make help              # Aide complète
make check-project     # Diagnostic du projet
make monitor           # Monitoring performances
make backup-project    # Sauvegarde complète
make maintenance       # Menu interactif complet
```

### ⚛️ React Native & Dépendances
```bash
make setup-react-native # Installation complète
make install-deps       # Dépendances + pods
make link-deps          # Lier dépendances natives
make clean-deps         # Nettoyer tout
```

### 🚀 Simulateur & Processus
```bash
make fresh-start       # Démarrage propre complet
make stop-ports        # Libérer ports (Metro, etc.)
make clean-simulator   # Nettoyer données sim (sims préservés)
make start-simulator   # Démarrer simulateur
```

### 🧪 Tests & Qualité
```bash
make test              # Tests automatisés
make test-watch        # Tests en développement
make test-coverage     # Tests avec coverage
```

### 📦 Déploiement & Distribution
```bash
make build-dev         # Archive + export développement
make build-prod        # Archive + export production
make code-sign-check   # Vérifier certificats
make provisioning      # Gérer profiles
```

### 📱 Debugging & Development
```bash
make devices           # Lister devices connectés
make logs              # Logs temps réel
make version           # Version actuelle
make bump-version      # Incrémenter version
make open-project      # Ouvrir dans Xcode
make xcode             # Raccourci Xcode
```

## 🏃 Workflows Recommandés

### 🚀 Configuration Initiale
```bash
make setup-react-native    # Installation complète
make dev-setup            # Setup développement
make open-project         # Ouvrir dans Xcode
```

### 🔄 Développement Quotidien
```bash
make check-project        # Diagnostic
make clean-cache         # Si lent
make dev-logs            # Debug si nécessaire
```

### 📦 Release Preparation
```bash
make test-all            # Tests complets
make bump-version        # Nouvelle version
make build-prod          # Build production
```

### 🛠️ Troubleshooting
```bash
make troubleshoot        # Dépannage automatique
make fresh-start        # Redémarrage propre
```

## 📚 Documentation

### Guides Disponibles
- **[`README-MAKE.md`](./README-MAKE.md)** - Guide complet détaillé (recommandé)
- **[`README-SHARED-MODULES.md`](./README-SHARED-MODULES.md)** - Gestion modules C++

### Documentation Interactive
```bash
make help                # Aide complète organisée
make demo                # Démonstration scripts
make status              # État actuel du projet
```

## ⚠️ Notes Importantes

### Sécurité
- ✅ **Sauvegardes automatiques** avant opérations importantes
- ✅ **Simulateurs TOUJOURS préservés**
- ✅ **Confirmations** pour actions destructives

### Prérequis
- ✅ **Ruby >= 2.0** + **gem xcodeproj**
- ✅ **Dossier `../shared/`** pour modules C++
- ✅ **Xcode** pour commandes natives

## 🎯 Commencer

```bash
# 1. Voir toutes les commandes
make help

# 2. Configuration initiale
make setup-react-native

# 3. Workflow quotidien
make check-project
make clean-cache
```

## 🏆 Avantages

- **⏱️ Gain de temps** : 30+ commandes automatisées
- **🛡️ Sécurité maximale** : Sauvegardes et vérifications
- **📚 Documentation** : Guides complets intégrés
- **🎨 Interface cohérente** : Même style partout
- **🔄 Workflows optimisés** : Raccourcis intelligents

---

**🎉 Prêt pour un développement iOS React Native professionnel !**

**📖 Consultez [`README-MAKE.md`](./README-MAKE.md) pour le guide complet détaillé.**
