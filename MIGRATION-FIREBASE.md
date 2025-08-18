# 🔄 Guide de Migration Firebase

## Pourquoi Migrer ?

L'erreur **"We cannot verify the authenticity of this app"** indique que :
- Le projet Firebase actuel a des problèmes de configuration
- Google ne reconnaît pas l'app comme légitime
- Il y a des conflits d'identifiants OAuth

## 📋 Étapes de Migration

### **1. Créer un Nouveau Projet Firebase**

1. **Allez sur [Firebase Console](https://console.firebase.google.com/)**
2. **Cliquez "Ajouter un projet"**
3. **Informations suggérées :**
   - **Nom :** `Nyth App 2024` 
   - **ID :** `nyth-app-2024` (sera généré automatiquement)
   - **Région :** Europe (europe-west1)

### **2. Configurer les Applications**

#### **Application iOS :**
1. **Cliquez "Ajouter une application" → iOS**
2. **Paramètres :**
   - **Bundle ID :** `com.nyth.app` (nouveau, différent de l'ancien)
   - **Nom :** `Nyth`
   - **App Store ID :** (laissez vide)
3. **Téléchargez `GoogleService-Info.plist`**
4. **Suivez les étapes Firebase**

#### **Application Android :**
1. **Cliquez "Ajouter une application" → Android**
2. **Paramètres :**
   - **Package name :** `com.nyth.app`
   - **Nom :** `Nyth`
   - **SHA-1 :** (optionnel pour l'instant)
3. **Téléchargez `google-services.json`**

### **3. Activer Google Sign-In**

1. **Dans Firebase Console → Authentication**
2. **Onglet "Sign-in method"**
3. **Activer "Google"**
4. **Copier le "Web client ID"** (vous en aurez besoin)

### **4. Exécuter la Migration**

```bash
# Lancer le script de migration
make migrate-firebase
```

Le script vous demandera :
- **Project ID** (ex: `nyth-app-2024`)
- **Bundle ID** (ex: `com.nyth.app`)
- **Web Client ID** (copié depuis Firebase)
- **iOS Client ID** (généralement le même que Web Client ID)
- **Android Client ID** (copié depuis Firebase)
- **API Key** (copié depuis GoogleService-Info.plist)

### **5. Remplacer les Fichiers**

```bash
# Remplacer par les vrais fichiers téléchargés depuis Firebase
cp ~/Downloads/GoogleService-Info.plist ios/
cp ~/Downloads/google-services.json android/app/
```

### **6. Configurer le Serveur Backend**

1. **Générer une nouvelle clé de service :**
   - Firebase Console → Paramètres du projet → Comptes de service
   - Générer une nouvelle clé privée
   - Télécharger le fichier JSON

2. **Convertir en Base64 :**
   ```bash
   cat path/to/serviceAccount.json | base64 | tr -d '\n'
   ```

3. **Mettre à jour `server/.env` :**
   ```bash
   FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=<nouvelle_clé_base64>
   ```

### **7. Vérifier la Configuration**

```bash
make check-google    # Vérification Google Sign-In
make check-env       # Vérification générale
```

### **8. Tester**

```bash
make dev            # Lancer serveur + client
```

## ✅ Résultat Attendu

Après la migration :
- ✅ Nouveau projet Firebase propre
- ✅ Nouveaux identifiants OAuth sans conflits
- ✅ Google Sign-In fonctionne sans erreur 400
- ✅ Authentication backend fonctionnelle

## 🚨 Important

- **Sauvegardez** vos données Firestore si nécessaire
- **Notez** les nouveaux identifiants pour la production
- **Testez** l'authentification après chaque étape

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les Bundle IDs (doivent être identiques partout)
2. Assurez-vous que les fichiers GoogleService-Info.plist sont à jour
3. Relancez `make check-google` pour diagnostiquer
