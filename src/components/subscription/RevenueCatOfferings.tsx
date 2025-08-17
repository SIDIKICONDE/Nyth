import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { PaymentService } from "../../services/subscription/PaymentService";
import { PurchasesPackage } from "react-native-purchases";
import { useSubscription } from "../../contexts/SubscriptionContext";
import { useAuth } from "../../contexts/AuthContext";

type OfferingItem = {
  identifier: string;
  serverDescription: string;
  availablePackages: PurchasesPackage[];
};

const RevenueCatOfferings: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { restoreSubscription } = useSubscription();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [offerings, setOfferings] = useState<OfferingItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const items = await PaymentService.getAvailableOfferings();
        if (isMounted) setOfferings(items as OfferingItem[]);
      } catch (e) {
        Alert.alert(
          t("common.error", "Erreur"),
          t(
            "subscription.loadOfferingsError",
            "Impossible de charger les offres."
          )
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [t]);

  const allPackages = useMemo(() => {
    const list: PurchasesPackage[] = [];
    offerings.forEach((o) => {
      o.availablePackages.forEach((p) => list.push(p));
    });
    return list;
  }, [offerings]);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    try {
      setIsProcessing(true);
      const res = await PaymentService.purchaseSubscription(
        pkg.identifier,
        currentUser?.uid || "guest"
      );
      const ok = res.success === true;
      if (ok) {
        Alert.alert(t("subscription.purchaseSuccess", "Achat réussi"));
      } else {
        Alert.alert(
          t("common.error", "Erreur"),
          t("subscription.purchaseFailed", "L'achat a échoué.")
        );
      }
    } catch (e) {
      Alert.alert(
        t("common.error", "Erreur"),
        t("subscription.purchaseFailed", "L'achat a échoué.")
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsProcessing(true);
      const ok = await restoreSubscription();
      if (ok) {
        Alert.alert(t("subscription.restoreSuccess", "Achats restaurés"));
      } else {
        Alert.alert(
          t("common.error", "Erreur"),
          t("subscription.noActiveEntitlement", "Aucun abonnement actif")
        );
      }
    } catch (e) {
      Alert.alert(
        t("common.error", "Erreur"),
        t("subscription.restoreFailed", "La restauration a échoué.")
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <View
        style={[
          tw`p-4 rounded-lg items-center`,
          { backgroundColor: currentTheme.colors.surface },
        ]}
      >
        <ActivityIndicator size="small" color={currentTheme.colors.primary} />
      </View>
    );
  }

  if (allPackages.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        tw`mt-6 p-4 rounded-lg`,
        { backgroundColor: currentTheme.colors.surface },
      ]}
    >
      <View style={tw`flex-row justify-between items-center mb-3`}>
        <Text
          style={[
            tw`text-lg font-semibold`,
            { color: currentTheme.colors.text },
          ]}
        >
          {t("subscription.availableOffers", "Offres disponibles")}
        </Text>
        <TouchableOpacity
          onPress={handleRestore}
          disabled={isProcessing}
          style={[
            tw`px-3 py-2 rounded-md`,
            { backgroundColor: currentTheme.colors.primary },
          ]}
        >
          {isProcessing ? (
            <ActivityIndicator
              size="small"
              color={currentTheme.colors.primary}
            />
          ) : (
            <Text
              style={[
                tw`text-sm font-medium`,
                { color: currentTheme.colors.primary },
              ]}
            >
              {t("subscription.restore", "Restaurer")}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {allPackages.map((pkg) => (
        <View
          key={`${pkg.identifier}`}
          style={[
            tw`mb-3 p-3 rounded-md`,
            { backgroundColor: currentTheme.colors.card },
          ]}
        >
          <View style={tw`flex-row justify-between items-center`}>
            <View style={tw`flex-1 pr-3`}>
              <Text
                style={[
                  tw`text-base font-medium`,
                  { color: currentTheme.colors.text },
                ]}
              >
                {pkg.product.title}
              </Text>
              <Text
                style={[
                  tw`text-sm`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                {pkg.product.description}
              </Text>
            </View>
            <View style={tw`items-end`}>
              <Text
                style={[
                  tw`text-base font-semibold`,
                  { color: currentTheme.colors.text },
                ]}
              >
                {pkg.product.priceString}
              </Text>
              <TouchableOpacity
                onPress={() => handlePurchase(pkg)}
                disabled={isProcessing}
                style={[
                  tw`mt-2 px-3 py-2 rounded-md items-center`,
                  { backgroundColor: currentTheme.colors.primary },
                ]}
              >
                {isProcessing ? (
                  <ActivityIndicator
                    size="small"
                    color={currentTheme.colors.primary}
                  />
                ) : (
                  <Text
                    style={[
                      tw`text-sm font-medium`,
                      { color: currentTheme.colors.primary },
                    ]}
                  >
                    {t("subscription.buy", "Acheter")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

export default RevenueCatOfferings;
