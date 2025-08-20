# Tests d'authentification

Ce dossier contient les tests unitaires pour le système d'authentification.

## Structure

- `actions.test.ts` - Tests des actions d'authentification (signIn, signUp, logout, etc.)
- `init.test.ts` - Tests d'initialisation et de l'écouteur d'état Firebase

## Couverture

### Actions testées
- ✅ Connexion email/mot de passe (succès/échec)
- ✅ Inscription (succès/échec)
- ✅ Mode invité (création d'utilisateur unique)
- ✅ Déconnexion (utilisateur Firebase vs nettoyage)
- ✅ Mise à jour profil
- ✅ Réinitialisation mot de passe
- ✅ Connexions sociales (Google/Apple)
- ✅ Gestion d'erreurs offline

### Initialisation testée
- ✅ Chemin online (Firebase OK)
- ✅ Chemin offline (restauration cache)
- ✅ Fallback Firebase (échec → offline)
- ✅ Configuration de l'écouteur d'état
- ✅ Nettoyage des ressources

## Exécution

```bash
# Tests auth uniquement
npm run test:auth

# Tous les tests
npm test
```

## CI/CD

- **Pre-commit**: lint + tests auth sur fichiers modifiés
- **GitHub Actions**: lint + tests auth sur PR/push
