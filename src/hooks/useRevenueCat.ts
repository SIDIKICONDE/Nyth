import { useState, useEffect } from 'react';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { createLogger } from '../utils/optimizedLogger';
import { useAuth } from '../contexts/AuthContext';

const logger = createLogger('useRevenueCat');

interface RevenueCatState {
  customerInfo: CustomerInfo | null;
  offerings: PurchasesPackage[];
  isLoading: boolean;
  error: string | null;
}

export const useRevenueCat = () => {
  const { currentUser } = useAuth();
  const [state, setState] = useState<RevenueCatState>({
    customerInfo: null,
    offerings: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        // Si l'utilisateur est connecté, identifier l'utilisateur dans RevenueCat
        if (currentUser?.uid) {
          await Purchases.logIn(currentUser.uid);
          logger.info('✅ Utilisateur identifié dans RevenueCat:', currentUser.uid);
        }

        // Récupérer les informations client
        const customerInfo = await Purchases.getCustomerInfo();
        setState(prev => ({ ...prev, customerInfo }));

        // Récupérer les offres disponibles
        const offerings = await Purchases.getOfferings();
        const availablePackages = offerings.current?.availablePackages || [];
        setState(prev => ({ 
          ...prev, 
          offerings: availablePackages,
          isLoading: false 
        }));

        logger.info('✅ RevenueCat initialisé avec succès');
      } catch (error) {
        logger.error('❌ Erreur lors de l\'initialisation de RevenueCat:', error);
        setState(prev => ({ 
          ...prev, 
          error: error.message || 'Erreur inconnue',
          isLoading: false 
        }));
      }
    };

    initializeRevenueCat();

    // Écouter les changements d'informations client
    const customerInfoUpdateListener = (customerInfo: CustomerInfo) => {
      logger.info('📱 Mise à jour des informations client RevenueCat');
      setState(prev => ({ ...prev, customerInfo }));
    };

    Purchases.addCustomerInfoUpdateListener(customerInfoUpdateListener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(customerInfoUpdateListener);
    };
  }, [currentUser?.uid]);

  const purchasePackage = async (purchasePackage: PurchasesPackage) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(purchasePackage);
      setState(prev => ({ ...prev, customerInfo }));
      return { success: true, customerInfo };
    } catch (error) {
      if (error.userCancelled) {
        logger.info('👤 Achat annulé par l\'utilisateur');
        return { success: false, cancelled: true };
      }
      logger.error('❌ Erreur lors de l\'achat:', error);
      return { success: false, error: error.message };
    }
  };

  const restorePurchases = async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      setState(prev => ({ ...prev, customerInfo }));
      logger.info('✅ Achats restaurés avec succès');
      return { success: true, customerInfo };
    } catch (error) {
      logger.error('❌ Erreur lors de la restauration des achats:', error);
      return { success: false, error: error.message };
    }
  };

  const getActiveSubscriptions = () => {
    if (!state.customerInfo) return [];
    return Object.keys(state.customerInfo.activeSubscriptions);
  };

  const hasActiveSubscription = () => {
    const activeSubscriptions = getActiveSubscriptions();
    return activeSubscriptions.length > 0;
  };

  const getEntitlements = () => {
    if (!state.customerInfo) return [];
    return Object.keys(state.customerInfo.entitlements.active);
  };

  const hasEntitlement = (entitlementId: string) => {
    const entitlements = getEntitlements();
    return entitlements.includes(entitlementId);
  };

  return {
    ...state,
    purchasePackage,
    restorePurchases,
    getActiveSubscriptions,
    hasActiveSubscription,
    getEntitlements,
    hasEntitlement,
  };
};
