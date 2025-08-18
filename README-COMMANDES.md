# 🚀 Guide des Commandes Nyth

## 🎯 Commande Principale (Recommandée)

### Tout Démarrer en Une Commande
```bash
make dev          # Démarre SERVEUR + CLIENT ensemble
make d            # Raccourci pour 'make dev'
```

## Commandes Séparées

### Démarrer le Serveur Backend
```bash
make server       # Démarre le serveur sur le port 3000
make s            # Raccourci pour 'make server'
```

### Démarrer le Client React Native
```bash
make client       # Démarre Metro bundler
make c            # Raccourci pour 'make client'
```

### Mode Développement
```bash
make server-dev   # Serveur avec auto-reload (nodemon)
```

## Commandes d'Installation

```bash
make install-all    # Installe toutes les dépendances
make i             # Raccourci pour 'make install-all'
make install-server # Installe uniquement le serveur
make install-client # Installe uniquement le client
```

## Commandes Utiles

```bash
make check-env     # Vérifie la configuration
make stop-all      # Arrête serveur ET client
make server-stop   # Arrête uniquement le serveur
make clean         # Nettoie les caches
make help          # Affiche l'aide complète
```

## Lancement des Apps

```bash
make client-ios     # Lance sur iOS Simulator
make client-android # Lance sur Android Emulator
```

---

## 🔧 Résolution des Problèmes d'Authentification

Les problèmes d'authentification ont été corrigés en :

1. ✅ **Création du fichier `.env`** avec les bonnes variables
2. ✅ **Synchronisation des clés API** entre client et serveur
3. ✅ **Configuration Firebase** avec le projet `com-naya`
4. ✅ **Variables Google Sign-In** configurées

### Vérification Rapide
```bash
make check-env  # Vérifie que tout est configuré
```

### Si l'authentification ne fonctionne toujours pas :
1. Vérifiez que le serveur est démarré : `make server`
2. Vérifiez la configuration : `make check-env`
3. Redémarrez l'app React Native : `make client`

---

*Toutes les commandes doivent être exécutées depuis la racine du projet `/Users/m1/Desktop/Nyth`*
