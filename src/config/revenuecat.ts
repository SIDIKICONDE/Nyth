/**
 * Configuration RevenueCat
 * 
 * IMPORTANT: Ajoutez vos clés API RevenueCat dans les variables d'environnement
 * 
 * Pour obtenir vos clés API:
 * 1. Créez un compte sur https://app.revenuecat.com
 * 2. Créez un nouveau projet
 * 3. Récupérez vos clés API pour iOS et Android
 * 4. Ajoutez-les dans votre fichier .env
 */

import { Platform } from 'react-native';

// Clés API RevenueCat (à remplacer par vos vraies clés)
export const REVENUECAT_API_KEYS = {
  ios: process.env.REVENUECAT_IOS_API_KEY || 'YOUR_IOS_API_KEY_HERE',
  android: process.env.REVENUECAT_ANDROID_API_KEY || 'YOUR_ANDROID_API_KEY_HERE',
};

// Configuration des identifiants de produits
export const REVENUECAT_PRODUCTS = {
  // Plans mensuels
  STARTER_MONTHLY: Platform.select({
    ios: 'com.nyth.starter.monthly',
    android: 'starter_monthly',
    default: 'starter_monthly',
  }),
  PRO_MONTHLY: Platform.select({
    ios: 'com.nyth.pro.monthly',
    android: 'pro_monthly',
    default: 'pro_monthly',
  }),
  ENTERPRISE_MONTHLY: Platform.select({
    ios: 'com.nyth.enterprise.monthly',
    android: 'enterprise_monthly',
    default: 'enterprise_monthly',
  }),

  // Plans annuels
  STARTER_YEARLY: Platform.select({
    ios: 'com.nyth.starter.yearly',
    android: 'starter_yearly',
    default: 'starter_yearly',
  }),
  PRO_YEARLY: Platform.select({
    ios: 'com.nyth.pro.yearly',
    android: 'pro_yearly',
    default: 'pro_yearly',
  }),
  ENTERPRISE_YEARLY: Platform.select({
    ios: 'com.nyth.enterprise.yearly',
    android: 'enterprise_yearly',
    default: 'enterprise_yearly',
  }),
};

// Mapping des plans vers les identifiants de produits
export const PLAN_TO_PRODUCT_MAP = {
  // Plans mensuels
  starter_monthly: REVENUECAT_PRODUCTS.STARTER_MONTHLY,
  pro_monthly: REVENUECAT_PRODUCTS.PRO_MONTHLY,
  enterprise_monthly: REVENUECAT_PRODUCTS.ENTERPRISE_MONTHLY,
  
  // Plans annuels
  starter_yearly: REVENUECAT_PRODUCTS.STARTER_YEARLY,
  pro_yearly: REVENUECAT_PRODUCTS.PRO_YEARLY,
  enterprise_yearly: REVENUECAT_PRODUCTS.ENTERPRISE_YEARLY,
};

// Configuration des entitlements RevenueCat
export const REVENUECAT_ENTITLEMENTS = {
  STARTER: 'starter_access',
  PRO: 'pro_access',
  ENTERPRISE: 'enterprise_access',
};

// Configuration des offerings
export const REVENUECAT_OFFERINGS = {
  DEFAULT: 'default',
  CURRENT: 'current',
};

// Options de configuration RevenueCat
export const REVENUECAT_CONFIG = {
  // Active le mode debug en développement
  useDebugMode: __DEV__,
  
  // Configure le comportement des achats
  purchasesAreCompletedBy: {
    // RevenueCat gère automatiquement la finalisation des achats
    automaticallyFinishTransactions: true,
  },
  
  // Configure l'attribution
  appUserID: null, // Sera défini lors de la connexion de l'utilisateur
};

// Messages d'erreur personnalisés
export const REVENUECAT_ERROR_MESSAGES = {
  NOT_CONFIGURED: 'RevenueCat n\'est pas configuré. Veuillez ajouter vos clés API.',
  PURCHASE_CANCELLED: 'L\'achat a été annulé.',
  PRODUCT_NOT_AVAILABLE: 'Ce produit n\'est pas disponible.',
  ALREADY_SUBSCRIBED: 'Vous êtes déjà abonné à ce plan.',
  RESTORE_FAILED: 'Impossible de restaurer vos achats.',
  NETWORK_ERROR: 'Erreur de connexion. Veuillez réessayer.',
  UNKNOWN_ERROR: 'Une erreur inattendue s\'est produite.',
};