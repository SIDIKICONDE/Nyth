# Configuration Stripe - Guide d'installation

Ce guide vous aide à configurer Stripe pour votre application Nyth.

## 📋 Prérequis

1. Compte Stripe créé sur [https://stripe.com](https://stripe.com)
2. Firebase CLI installé et configuré
3. Accès au dashboard Stripe

## 🔑 Configuration des clés API

### 1. Récupérer les clés Stripe

Dans le dashboard Stripe :
1. Allez dans **Developers** > **API keys**
2. Copiez la **Publishable key** (pk_test_... ou pk_live_...)
3. Copiez la **Secret key** (sk_test_... ou sk_live_...)

### 2. Configurer les variables d'environnement

#### Pour le développement local (.env.local) :
```bash
# Clé publique (côté client)
STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique

# URL de base
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

#### Pour Firebase Functions (secrets) :
```bash
# Configurer la clé secrète
firebase functions:secrets:set STRIPE_SECRET_KEY --project votre-projet-id

# Configurer le secret webhook (après création du webhook)
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET --project votre-projet-id
```

## 🛍️ Configuration des produits Stripe

### 1. Créer les produits

Dans le dashboard Stripe, allez dans **Products** et créez :

1. **Produit Starter**
   - Nom : "Plan Starter"
   - Description : "Plan d'entrée de gamme"

2. **Produit Pro** 
   - Nom : "Plan Pro"
   - Description : "Plan pour les professionnels"

3. **Produit Enterprise**
   - Nom : "Plan Enterprise"
   - Description : "Plan pour les grandes entreprises"

### 2. Créer les prix pour chaque produit

Pour chaque produit, créez deux prix :
- **Mensuel** : Facturation récurrente mensuelle
- **Annuel** : Facturation récurrente annuelle (avec réduction recommandée)

### 3. Mettre à jour la configuration

Modifiez le fichier `src/config/stripe.ts` avec vos vrais IDs :

```typescript
export const STRIPE_CONFIG = {
  products: {
    starter: {
      productId: "prod_VotreIDProduitStarter",
      prices: {
        monthly: "price_VotreIDPrixStarterMensuel",
        yearly: "price_VotreIDPrixStarterAnnuel",
      },
    },
    // ... répéter pour pro et enterprise
  },
};
```

## 🪝 Configuration des webhooks

### 1. Créer l'endpoint webhook

Dans le dashboard Stripe :
1. Allez dans **Developers** > **Webhooks**
2. Cliquez sur **Add endpoint**
3. URL de l'endpoint : `https://votre-region-votre-projet.cloudfunctions.net/handleStripeWebhook`
4. Sélectionnez ces événements :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 2. Configurer le secret webhook

```bash
# Récupérer le signing secret depuis le dashboard Stripe
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET="whsec_votre_secret_webhook"
```

## 🚀 Déploiement

### 1. Déployer les fonctions Firebase

```bash
# Déployer toutes les fonctions
firebase deploy --only functions

# Ou déployer seulement les fonctions Stripe
firebase deploy --only functions:createStripeCheckoutSession,functions:handleStripeWebhook
```

### 2. Tester la configuration

1. Utilisez les cartes de test Stripe :
   - **Succès** : `4242424242424242`
   - **Échec** : `4000000000000002`

2. Vérifiez les logs dans Firebase Console
3. Vérifiez les événements dans le dashboard Stripe

## 📱 Configuration mobile (optionnel)

Si vous utilisez RevenueCat en parallèle :

```bash
# Variables d'environnement pour RevenueCat
REVENUECAT_IOS_API_KEY=votre_cle_ios
REVENUECAT_ANDROID_API_KEY=votre_cle_android
```

## 🔧 Configuration du PaymentService

Dans votre code, configurez le provider préféré :

```typescript
import { PaymentService } from "./services/subscription/PaymentService";

// Pour utiliser Stripe par défaut
PaymentService.setPreferredProvider("stripe");

// Ou RevenueCat pour mobile
if (Platform.OS !== "web") {
  PaymentService.setPreferredProvider("revenuecat");
}
```

## 🧪 Tests

### 1. Tests locaux

```bash
# Utiliser le CLI Stripe pour tester les webhooks localement
stripe listen --forward-to localhost:5001/votre-projet/us-central1/handleStripeWebhook
```

### 2. Cartes de test

- **Visa réussie** : `4242424242424242`
- **Visa avec authentification 3D Secure** : `4000002500003155`
- **Carte refusée** : `4000000000000002`
- **Fonds insuffisants** : `4000000000009995`

## 🔒 Sécurité

1. **Jamais** exposer la clé secrète côté client
2. Toujours valider les webhooks avec le signing secret
3. Utiliser HTTPS en production
4. Configurer les domaines autorisés dans Stripe

## 📊 Surveillance

1. Configurez les alertes Stripe pour les paiements échoués
2. Surveillez les logs Firebase Functions
3. Configurez des notifications pour les événements critiques

## 🆘 Dépannage

### Erreurs courantes

1. **"Invalid API key"** : Vérifiez que vous utilisez la bonne clé (test/live)
2. **"Webhook signature verification failed"** : Vérifiez le webhook secret
3. **"Product not found"** : Vérifiez les IDs de produits dans la config

### Logs utiles

```bash
# Voir les logs des fonctions Firebase
firebase functions:log --only handleStripeWebhook

# Voir les événements Stripe en temps réel
stripe listen
```

## 📚 Ressources

- [Documentation Stripe](https://stripe.com/docs)
- [Dashboard Stripe](https://dashboard.stripe.com)
- [Test cards Stripe](https://stripe.com/docs/testing)
- [Firebase Functions](https://firebase.google.com/docs/functions)
