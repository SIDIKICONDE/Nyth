# Guide de configuration RevenueCat pour Nyth

Ce guide vous explique comment configurer RevenueCat pour gérer les abonnements dans votre application.

## 📋 Prérequis

- Compte développeur Apple (pour iOS)
- Compte Google Play Console (pour Android)
- Compte RevenueCat

## 🚀 Configuration RevenueCat

### 1. Créer un compte RevenueCat

1. Allez sur [RevenueCat](https://app.revenuecat.com/signup)
2. Créez votre compte
3. Créez un nouveau projet

### 2. Configuration iOS

#### App Store Connect

1. Connectez-vous à [App Store Connect](https://appstoreconnect.apple.com)
2. Allez dans "Mes apps" > Votre app > "Fonctionnalités" > "Achats intégrés"
3. Créez vos produits d'abonnement :
   - `com.nyth.starter.monthly` - Starter Mensuel
   - `com.nyth.pro.monthly` - Pro Mensuel
   - `com.nyth.enterprise.monthly` - Enterprise Mensuel
   - `com.nyth.starter.yearly` - Starter Annuel
   - `com.nyth.pro.yearly` - Pro Annuel
   - `com.nyth.enterprise.yearly` - Enterprise Annuel

#### RevenueCat

1. Dans RevenueCat, allez dans "Project Settings" > "Apps" > "Add App"
2. Sélectionnez "iOS"
3. Entrez votre Bundle ID
4. Copiez votre clé API iOS

### 3. Configuration Android

#### Google Play Console

1. Connectez-vous à [Google Play Console](https://play.google.com/console)
2. Allez dans votre app > "Monétisation" > "Produits" > "Abonnements"
3. Créez vos produits d'abonnement :
   - `starter_monthly` - Starter Mensuel
   - `pro_monthly` - Pro Mensuel
   - `enterprise_monthly` - Enterprise Mensuel
   - `starter_yearly` - Starter Annuel
   - `pro_yearly` - Pro Annuel
   - `enterprise_yearly` - Enterprise Annuel

#### RevenueCat

1. Dans RevenueCat, ajoutez une app Android
2. Entrez votre Package Name
3. Uploadez votre clé de service Google Play
4. Copiez votre clé API Android

### 4. Configuration des produits dans RevenueCat

1. Allez dans "Products" dans RevenueCat
2. Importez vos produits depuis l'App Store et Google Play
3. Créez des "Entitlements" :
   - `starter_access` - Accès Starter
   - `pro_access` - Accès Pro
   - `enterprise_access` - Accès Enterprise
4. Associez vos produits aux entitlements correspondants

### 5. Configuration des Offerings

1. Allez dans "Offerings" dans RevenueCat
2. Créez un offering "default"
3. Ajoutez vos packages :
   - Package "Starter Monthly" → produit starter_monthly
   - Package "Pro Monthly" → produit pro_monthly
   - Package "Enterprise Monthly" → produit enterprise_monthly
   - Package "Starter Yearly" → produit starter_yearly
   - Package "Pro Yearly" → produit pro_yearly
   - Package "Enterprise Yearly" → produit enterprise_yearly

## 🔧 Configuration dans l'application

### 1. Variables d'environnement

Créez un fichier `.env` à la racine du projet et ajoutez :

```env
# RevenueCat
REVENUECAT_IOS_API_KEY=your_ios_api_key_here
REVENUECAT_ANDROID_API_KEY=your_android_api_key_here
REVENUECAT_WEBHOOK_SECRET=your_webhook_secret_here
```

### 2. Configuration Firebase Functions

Pour les webhooks RevenueCat, ajoutez dans vos variables d'environnement Firebase :

```bash
firebase functions:config:set revenuecat.webhook_secret="your_webhook_secret"
```

### 3. Configuration des webhooks

1. Dans RevenueCat, allez dans "Integrations" > "Webhooks"
2. Ajoutez votre URL de webhook : `https://your-region-your-project.cloudfunctions.net/revenueCatWebhook`
3. Copiez le secret et ajoutez-le dans vos variables d'environnement

## 🧪 Test

### Mode Sandbox

1. **iOS** : Utilisez un compte Sandbox Apple
2. **Android** : Ajoutez des testeurs dans Google Play Console

### Vérification

1. Lancez l'application
2. Vérifiez dans les logs : "✅ PaymentService (RevenueCat) initialized successfully"
3. Testez un achat avec un compte de test

## 🐛 Dépannage

### Erreurs courantes

1. **"RevenueCat API key not configured"**
   - Vérifiez que vos clés API sont bien dans le fichier `.env`
   - Redémarrez Metro bundler après avoir ajouté les variables

2. **"Product not found"**
   - Vérifiez que les produits sont bien créés dans App Store Connect / Google Play
   - Attendez quelques heures après la création des produits
   - Vérifiez que les identifiants correspondent exactement

3. **Achats qui ne fonctionnent pas**
   - Vérifiez les entitlements iOS (déjà configurés)
   - Pour Android, vérifiez que l'app est signée
   - Vérifiez que vous utilisez un compte de test

## 📱 Test sur device

### iOS
```bash
# Installer sur device
npm run ios -- --device
```

### Android
```bash
# Build de release pour tester les achats
cd android
./gradlew assembleRelease
# Installer l'APK sur votre device
```

## 🔗 Ressources

- [Documentation RevenueCat](https://docs.revenuecat.com)
- [React Native Purchases SDK](https://docs.revenuecat.com/docs/reactnative)
- [App Store Connect Help](https://developer.apple.com/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
