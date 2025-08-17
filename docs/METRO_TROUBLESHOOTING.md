# Guide de résolution des problèmes Metro

## Problèmes courants et solutions

### 1. Erreurs de parsing JSON
**Symptômes :**
```
SyntaxError: "undefined" is not valid JSON
```

**Solutions :**
- Exécuter `yarn start:clean` pour redémarrer avec un cache propre
- Vérifier la configuration Metro dans `metro.config.js`
- Utiliser le script de diagnostic : `yarn diagnostic`

### 2. Erreurs de propriétés undefined
**Symptômes :**
```
TypeError: Cannot read property 'S' of undefined
TypeError: Cannot read property 'default' of undefined
```

**Solutions :**
- Nettoyer le cache : `yarn clean`
- Réinstaller les dépendances : `yarn clean:all`
- Vérifier les imports dans le code

### 3. Erreurs de symbolication
**Symptômes :**
```
SyntaxError: "undefined" is not valid JSON
at JSON.parse (<anonymous>)
at Server._symbolicate
```

**Solutions :**
- Le gestionnaire d'erreurs personnalisé gère automatiquement ces erreurs
- Redémarrer le serveur Metro
- Vérifier les stack traces dans les logs

## Scripts disponibles

### Nettoyage et redémarrage
```bash
# Nettoyer le cache Metro
yarn clean

# Redémarrer avec cache propre
yarn start:clean

# Nettoyage complet (cache + node_modules)
yarn clean:all
```

### Diagnostic
```bash
# Exécuter le diagnostic complet
yarn diagnostic
```

## Configuration Metro améliorée

La configuration Metro a été améliorée avec :

1. **Gestionnaire d'erreurs personnalisé** (`metro.error-handler.js`)
   - Gestion spécifique des erreurs de parsing JSON
   - Gestion des propriétés undefined
   - Gestion des erreurs de symbolication

2. **Configuration optimisée** (`metro.config.js`)
   - Alias pour les modules problématiques
   - Gestion améliorée des erreurs
   - Optimisations de performance

3. **Scripts de maintenance**
   - Nettoyage automatique du cache
   - Diagnostic des problèmes
   - Redémarrage sécurisé

## Recommandations

1. **En cas de problème persistant :**
   - Exécuter `yarn diagnostic` pour identifier la cause
   - Utiliser `yarn start:clean` pour un redémarrage propre
   - Vérifier les logs Metro pour plus de détails

2. **Pour éviter les problèmes :**
   - Éviter les imports circulaires
   - Vérifier que tous les modules sont correctement installés
   - Maintenir les dépendances à jour

3. **En développement :**
   - Utiliser `yarn start:clean` au lieu de `yarn start` si des problèmes surviennent
   - Surveiller les logs Metro pour détecter les problèmes tôt
