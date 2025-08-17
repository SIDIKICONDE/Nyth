# 🔒 Bonnes Pratiques de Sécurité - Gestion des Clés API

## ⚠️ RÈGLES CRITIQUES DE SÉCURITÉ

### 1. NE JAMAIS EXPOSER LES CLÉS API

❌ **JAMAIS faire ceci :**
```javascript
// DANGEREUX - NE JAMAIS FAIRE CELA !
const API_KEY = "AIzaSyAMRbVovK6Rds9wJzWeeqHp7c42163Vdyg";
const CLIENT_ID = "322730783133-k9sbjni8tqmlut4c2uuual7hs5i4ci0a.apps.googleusercontent.com";
```

✅ **TOUJOURS faire ceci :**
```javascript
// SÉCURISÉ - Utiliser les variables d'environnement
import { API_KEY, CLIENT_ID } from '@env';
```

### 2. FICHIER .env

#### Configuration
1. **Créer** un fichier `.env` à la racine du projet
2. **Copier** `.env.example` et remplacer par vos vraies valeurs
3. **NE JAMAIS** commiter `.env` dans Git

#### Vérification
```bash
# Vérifier que .env n'est pas dans Git
git status --ignored

# Si .env est déjà dans Git, le retirer
git rm --cached .env
git commit -m "Remove .env from tracking"
```

### 3. GITIGNORE

Assurez-vous que `.gitignore` contient :
```gitignore
# Variables d'environnement
.env
.env.local
.env.*.local
.env.production

# Ne pas ignorer l'exemple
!.env.example
```

### 4. ROTATION DES CLÉS

Si une clé a été exposée accidentellement :

1. **Immédiatement** :
   - Révoquer la clé compromise
   - Générer une nouvelle clé
   - Mettre à jour `.env`

2. **Dans Firebase Console** :
   - Aller dans Project Settings
   - Régénérer les clés API
   - Mettre à jour les restrictions

3. **Dans Google Cloud Console** :
   - Créer de nouveaux OAuth 2.0 Client IDs
   - Supprimer les anciens

### 5. RESTRICTIONS DES CLÉS

#### Firebase API Keys
Dans Firebase Console > Project Settings :
- Restreindre par domaine/app
- Limiter les API autorisées
- Activer les quotas

#### Google OAuth Client IDs
Dans Google Cloud Console :
- Configurer les origines JavaScript autorisées
- Définir les URI de redirection autorisés
- Limiter les scopes

### 6. ENVIRONNEMENTS

Utiliser des clés différentes par environnement :

```bash
# Développement
.env.development

# Staging
.env.staging

# Production
.env.production
```

### 7. CI/CD

Pour les builds automatisés :

#### GitHub Actions
```yaml
env:
  GOOGLE_WEB_CLIENT_ID: ${{ secrets.GOOGLE_WEB_CLIENT_ID }}
  FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
```

#### Fastlane
```ruby
ENV['GOOGLE_WEB_CLIENT_ID'] = ENV['CI_GOOGLE_WEB_CLIENT_ID']
```

### 8. AUDIT DE SÉCURITÉ

Vérifications régulières :

```bash
# Rechercher les clés en dur dans le code
grep -r "AIzaSy" --exclude-dir=node_modules .
grep -r "apps.googleusercontent.com" --exclude-dir=node_modules .

# Vérifier l'historique Git
git log -p -S"AIzaSy"
```

### 9. REACT NATIVE SPECIFIQUE

#### iOS
- Stocker les clés sensibles dans Keychain
- Utiliser `react-native-keychain` pour les tokens

#### Android
- Utiliser Android Keystore
- Configurer ProGuard pour l'obfuscation

### 10. MONITORING

Surveiller l'utilisation :
1. Firebase Console > Usage and billing
2. Google Cloud Console > APIs & Services > Metrics
3. Configurer des alertes pour usage anormal

## 🚨 QUE FAIRE EN CAS D'EXPOSITION

1. **Révoquer immédiatement** toutes les clés exposées
2. **Générer** de nouvelles clés
3. **Auditer** les logs pour détecter un usage non autorisé
4. **Notifier** l'équipe de sécurité
5. **Documenter** l'incident
6. **Mettre à jour** tous les environnements

## 📚 RESSOURCES

- [Firebase Security Checklist](https://firebase.google.com/docs/projects/security-checklist)
- [Google Cloud API Keys Best Practices](https://cloud.google.com/docs/authentication/api-keys)
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)

## ✅ CHECKLIST DE SÉCURITÉ

- [ ] `.env` créé et configuré
- [ ] `.env` dans `.gitignore`
- [ ] `.env.example` documenté
- [ ] Aucune clé en dur dans le code
- [ ] Clés restreintes dans Firebase/Google Console
- [ ] Monitoring activé
- [ ] Procédure de rotation documentée
- [ ] Équipe formée aux bonnes pratiques

---

⚠️ **RAPPEL** : La sécurité est l'affaire de tous. Une seule clé exposée peut compromettre toute l'application.