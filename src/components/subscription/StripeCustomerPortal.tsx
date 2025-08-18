import React, { useState } from "react";
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
import { createOptimizedLogger } from "../../utils/optimizedLogger";

const logger = createOptimizedLogger("StripeCustomerPortal");

interface StripeCustomerPortalProps {
  customerId?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const StripeCustomerPortal: React.FC<StripeCustomerPortalProps> = ({
  customerId,
  onSuccess,
  onError,
}) => {
  const { currentUser } = useAuth();
  const { subscription } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);

  const openCustomerPortal = async () => {
    if (!currentUser) {
      Alert.alert("Erreur", "Vous devez être connecté");
      return;
    }

    try {
      setIsLoading(true);
      logger.info("🔧 Ouverture du portail client Stripe");

      let customerIdToUse = customerId;

      // Si pas de customerId fourni, créer ou récupérer le client
      if (!customerIdToUse && currentUser.email) {
        const customer = await StripeService.createOrGetCustomer(
          currentUser.uid,
          currentUser.email,
          currentUser.displayName || undefined
        );

        if (!customer) {
          throw new Error("Impossible de créer ou récupérer le client Stripe");
        }

        customerIdToUse = customer.id;
      }

      if (!customerIdToUse) {
        throw new Error("ID client Stripe manquant");
      }

      const portalSession = await StripeService.createCustomerPortalSession(customerIdToUse);

      if (!portalSession) {
        throw new Error("Impossible de créer la session du portail client");
      }

      // Ouvrir le portail client
      const supported = await Linking.canOpenURL(portalSession.url);
      if (supported) {
        await Linking.openURL(portalSession.url);
        logger.info("✅ Portail client ouvert avec succès");
        onSuccess?.();
      } else {
        throw new Error("Impossible d'ouvrir l'URL du portail client");
      }
    } catch (error) {
      logger.error("❌ Erreur lors de l'ouverture du portail:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      Alert.alert("Erreur", errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Gérer votre abonnement</Text>
        <Text style={styles.description}>
          Accédez au portail client Stripe pour gérer votre abonnement, 
          modifier vos informations de paiement, télécharger vos factures 
          et bien plus encore.
        </Text>

        {subscription && (
          <View style={styles.subscriptionInfo}>
            <Text style={styles.subscriptionLabel}>Abonnement actuel :</Text>
            <Text style={styles.subscriptionValue}>{subscription.planId}</Text>
            <Text style={styles.subscriptionStatus}>
              Statut : {subscription.status}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={openCustomerPortal}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>
              Ouvrir le portail client
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.features}>
          <Text style={styles.featuresTitle}>Dans le portail client, vous pouvez :</Text>
          <Text style={styles.feature}>• Modifier vos informations de paiement</Text>
          <Text style={styles.feature}>• Télécharger vos factures</Text>
          <Text style={styles.feature}>• Mettre à jour votre plan d'abonnement</Text>
          <Text style={styles.feature}>• Annuler votre abonnement</Text>
          <Text style={styles.feature}>• Consulter l'historique des paiements</Text>
        </View>

        <View style={styles.security}>
          <Text style={styles.securityText}>
            🔒 Portail sécurisé géré par Stripe
          </Text>
        </View>
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 24,
    textAlign: "center",
  },
  subscriptionInfo: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  subscriptionLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  subscriptionValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  subscriptionStatus: {
    fontSize: 14,
    color: "#0066CC",
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#0066CC",
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: "#A0A0A0",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  features: {
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingTop: 20,
    marginBottom: 20,
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
  security: {
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  securityText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
});
