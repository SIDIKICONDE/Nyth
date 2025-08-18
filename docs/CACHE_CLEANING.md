# 🧹 Nettoyage du Cache - Projet Nyth

Ce document explique comment nettoyer efficacement le cache de votre projet React Native Nyth.

## 🚀 Commandes Rapides

### Nettoyage Complet (Recommandé)
```bash
npm run clean
```
ou
```bash
./scripts/clean-cache.sh --all
```

### Nettoyage Rapide (Sans réinstaller les dépendances)
```bash
npm run clean:quick
```
ou
```bash
./scripts/quick-clean.sh
```

## 📱 Nettoyage Spécifique par Plateforme

### iOS uniquement
```bash
npm run clean:ios
```
ou
```bash
./scripts/clean-cache.sh --ios
```

### Android uniquement
```bash
npm run clean:android
```
ou
```bash
./scripts/clean-cache.sh --android
```

### Metro uniquement
```bash
npm run clean:metro
```
ou
```bash
./scripts/clean-cache.sh --metro
```

### NPM uniquement
```bash
npm run clean:npm
```
ou
```bash
./scripts/clean-cache.sh --npm
```

## 🔧 Quand Utiliser Chaque Type de Nettoyage

### Nettoyage Rapide (`clean:quick`)
- **Quand** : Problèmes mineurs avec Metro, redémarrage nécessaire
- **Ce qui est nettoyé** : Cache Metro, Watchman, fichiers temporaires
- **Ce qui n'est PAS supprimé** : `node_modules`, dépendances, caches de build
- **Temps** : ~10-30 secondes

### Nettoyage Complet (`clean`)
- **Quand** : Problèmes persistants, erreurs de dépendances, migration
- **Ce qui est nettoyé** : Tout le cache + `node_modules` + dépendances
- **Ce qui est supprimé** : Tous les caches, dépendances, fichiers temporaires
- **Temps** : ~2-5 minutes (selon la vitesse de votre connexion)

### Nettoyage Spécifique
- **iOS** : Problèmes de build iOS, erreurs Xcode
- **Android** : Problèmes de build Android, erreurs Gradle
- **Metro** : Problèmes de bundling, erreurs de cache Metro
- **NPM** : Problèmes de dépendances, conflits de versions

## 🛠️ Scripts Disponibles

### `scripts/clean-cache.sh`
Script principal de nettoyage avec options avancées :
```bash
./scripts/clean-cache.sh --help          # Afficher l'aide
./scripts/clean-cache.sh --all           # Nettoyer tout
./scripts/clean-cache.sh --ios --metro   # Combinaison d'options
```

### `scripts/quick-clean.sh`
Script de nettoyage rapide pour les cas d'usage courants.

## 📋 Processus de Nettoyage Complet

1. **Arrêt des processus** : Metro, serveur, Watchman
2. **Nettoyage Metro** : Cache Metro, fichiers temporaires
3. **Nettoyage iOS** : Build, DerivedData, Pods
4. **Nettoyage Android** : Build, Gradle cache
5. **Nettoyage Watchman** : Cache Watchman
6. **Nettoyage NPM** : `node_modules`, cache NPM
7. **Nettoyage fichiers temporaires** : Logs, builds, etc.
8. **Option de réinstallation** : Réinstaller automatiquement les dépendances

## ⚠️ Points d'Attention

### Avant le Nettoyage Complet
- Sauvegardez vos modifications non commitées
- Assurez-vous d'avoir une bonne connexion internet
- Prévoyez 5-10 minutes pour la réinstallation

### Après le Nettoyage
- Relancez Metro : `npm start`
- Pour iOS : `cd ios && pod install` puis `npm run ios`
- Pour Android : `npm run android`

## 🔍 Diagnostic des Problèmes

### Problèmes Courants et Solutions

#### Metro ne démarre pas
```bash
npm run clean:metro
npm start
```

#### Erreurs de build iOS
```bash
npm run clean:ios
cd ios && pod install
npm run ios
```

#### Erreurs de build Android
```bash
npm run clean:android
npm run android
```

#### Problèmes de dépendances
```bash
npm run clean:npm
npm install
```

#### Problèmes persistants
```bash
npm run clean
# Attendre la réinstallation automatique
```

## 📚 Commandes Utiles

### Vérifier l'état du projet
```bash
make check-env          # Vérifier la configuration
make check-google       # Vérifier Google Sign-In
```

### Redémarrer les services
```bash
make stop-all           # Arrêter tous les services
make dev                # Redémarrer serveur + client
```

## 🎯 Bonnes Pratiques

1. **Commencez toujours par un nettoyage rapide** avant un nettoyage complet
2. **Utilisez le nettoyage spécifique** quand vous connaissez la source du problème
3. **Gardez une sauvegarde** avant un nettoyage complet
4. **Documentez les problèmes** pour éviter de les répéter

## 🆘 Support

Si vous rencontrez des problèmes avec le nettoyage :
1. Vérifiez que vous avez les permissions d'écriture
2. Assurez-vous que tous les processus sont arrêtés
3. Consultez les logs d'erreur
4. Contactez l'équipe de développement

---

**💡 Conseil** : Le nettoyage rapide (`clean:quick`) résout 80% des problèmes de cache. Utilisez-le en premier !
