import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { StripeService } from "../../services/payment/StripeService";
import { useAuth } from "../../contexts/AuthContext";
import { useSubscription } from "../../contexts/SubscriptionContext";
import { SUBSCRIPTION_PLANS } from "../../constants/subscriptionPlans";
import { createOptimizedLogger } from "../../utils/optimizedLogger";

const logger = createOptimizedLogger("StripeCheckout");

interface StripeCheckoutProps {
  planId: string;
  priceId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
}

export const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  planId,
  priceId,
  onSuccess,
  onCancel,
  onError,
}) => {
  const { currentUser } = useAuth();
  const { syncSubscription } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [isStripeReady, setIsStripeReady] = useState(false);

  const plan = SUBSCRIPTION_PLANS[planId];

  useEffect(() => {
    initializeStripe();
  }, []);

  const initializeStripe = async () => {
    try {
      if (!StripeService.isConfigured()) {
        throw new Error("Stripe n'est pas configuré correctement");
      }

      await StripeService.initializeClient();
      setIsStripeReady(true);
      logger.info("✅ Stripe initialisé pour le checkout");
    } catch (error) {
      logger.error("❌ Erreur d'initialisation Stripe:", error);
      onError?.(error instanceof Error ? error.message : "Erreur d'initialisation");
    }
  };

  const handleCheckout = async () => {
    if (!currentUser) {
      Alert.alert("Erreur", "Vous devez être connecté pour procéder à l'achat");
      return;
    }

    if (!currentUser.email) {
      Alert.alert("Erreur", "Email utilisateur manquant");
      return;
    }

    try {
      setIsLoading(true);
      logger.info("🛒 Début du processus de checkout", { planId, priceId });

      const result = await StripeService.purchaseSubscription(
        priceId,
        currentUser.uid,
        currentUser.email,
        planId
      );

      if (result.success) {
        if (result.checkoutUrl) {
          // Pour mobile, ouvrir l'URL dans le navigateur
          const supported = await Linking.canOpenURL(result.checkoutUrl);
          if (supported) {
            await Linking.openURL(result.checkoutUrl);
            logger.info("🔗 Redirection vers le checkout mobile");
          } else {
            throw new Error("Impossible d'ouvrir l'URL de checkout");
          }
        } else {
          // Pour web, la redirection est automatique
          logger.info("🔄 Redirection automatique vers le checkout");
        }

        // Optionnel: polling pour vérifier le succès du paiement
        pollForPaymentSuccess();
      } else {
        throw new Error(result.error || "Erreur lors de la création du checkout");
      }
    } catch (error) {
      logger.error("❌ Erreur checkout:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      Alert.alert("Erreur de paiement", errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const pollForPaymentSuccess = () => {
    let attempts = 0;
    const maxAttempts = 30; // 30 secondes
    
    const interval = setInterval(async () => {
      attempts++;
      
      try {
        // Synchroniser l'abonnement pour vérifier les changements
        const success = await syncSubscription();
        
        if (success) {
          clearInterval(interval);
          logger.info("✅ Paiement confirmé via synchronisation");
          onSuccess?.();
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          logger.warn("⏰ Timeout de vérification du paiement");
        }
      } catch (error) {
        logger.error("❌ Erreur lors de la vérification:", error);
        if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }
    }, 1000);
  };

  const handleCancel = () => {
    logger.info("🚫 Checkout annulé par l'utilisateur");
    onCancel?.();
  };

  if (!isStripeReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Initialisation du paiement...</Text>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Plan non trouvé</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.planCard}>
        <Text style={styles.planName}>{plan.displayName}</Text>
        <Text style={styles.planPrice}>
          {plan.price}€ / {plan.period === "month" ? "mois" : "an"}
        </Text>
        <Text style={styles.planDescription}>{plan.description}</Text>
        
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Inclus dans ce plan :</Text>
          {plan.limits.dailyGenerations && (
            <Text style={styles.feature}>
              • {plan.limits.dailyGenerations} générations par jour
            </Text>
          )}
          {plan.limits.monthlyGenerations && (
            <Text style={styles.feature}>
              • {plan.limits.monthlyGenerations} générations par mois
            </Text>
          )}
          {plan.limits.features.map((feature, index) => (
            <Text key={index} style={styles.feature}>
              • {feature}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleCheckout}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              S'abonner à {plan.displayName}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleCancel}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>Annuler</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.securityContainer}>
        <Text style={styles.securityText}>
          🔒 Paiement sécurisé par Stripe
        </Text>
        <Text style={styles.securitySubtext}>
          Vos informations de paiement sont protégées
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  errorText: {
    fontSize: 18,
    color: "#FF3B30",
    fontWeight: "600",
  },
  planCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0066CC",
    marginBottom: 12,
  },
  planDescription: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    lineHeight: 24,
  },
  featuresContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingTop: 16,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  feature: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  actionContainer: {
    marginBottom: 24,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#0066CC",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#0066CC",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#0066CC",
    fontSize: 16,
    fontWeight: "600",
  },
  securityContainer: {
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  securityText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    marginBottom: 4,
  },
  securitySubtext: {
    fontSize: 12,
    color: "#999",
  },
});
