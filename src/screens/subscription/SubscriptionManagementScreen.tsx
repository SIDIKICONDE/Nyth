import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { useContrastOptimization } from "../../hooks/useContrastOptimization";
import { useSubscription } from "../../contexts/SubscriptionContext";
import { CustomHeader } from "../../components/common";

import { RootStackParamList } from "../../types/navigation";
// Stripe removed

type NavigationProp = StackNavigationProp<RootStackParamList>;

const SubscriptionManagementScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { getOptimizedButtonColors } = useContrastOptimization();
  const { 
    currentPlan, 
    subscription, 
    cancelSubscription, 
    restoreSubscription,
    isLoading,
    getRealTimeQuotaStats,
  } = useSubscription();

  // Stripe portal removed
  const [quotaStats, setQuotaStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const loadQuotaStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const stats = await getRealTimeQuotaStats();
      setQuotaStats(stats);
    } catch (error) {
      console.error("Erreur lors du chargement des stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [getRealTimeQuotaStats]);

  useEffect(() => {
    loadQuotaStats();
  }, [loadQuotaStats]);

  const handleCancelSubscription = () => {
    if (!subscription || subscription.status !== "active") {
      Alert.alert(
        t("subscription.noActiveSubscription", "Aucun abonnement actif"),
        t("subscription.noActiveSubscriptionMessage", "Vous n'avez pas d'abonnement actif à annuler.")
      );
      return;
    }

    Alert.alert(
      t("subscription.confirmCancel.title", "Annuler l'abonnement"),
      t("subscription.confirmCancel.message", "Êtes-vous sûr de vouloir annuler votre abonnement ? Vous garderez l'accès jusqu'à la fin de votre période de facturation."),
      [
        {
          text: t("common.cancel", "Annuler"),
          style: "cancel",
        },
        {
          text: t("subscription.confirmCancel.confirm", "Oui, annuler"),
          style: "destructive",
          onPress: async () => {
            const success = await cancelSubscription();
            if (success) {
              Alert.alert(
                t("subscription.cancelSuccess.title", "Abonnement annulé"),
                t("subscription.cancelSuccess.message", "Votre abonnement a été annulé avec succès.")
              );
            } else {
              Alert.alert(
                t("subscription.cancelError.title", "Erreur"),
                t("subscription.cancelError.message", "Impossible d'annuler l'abonnement. Veuillez réessayer.")
              );
            }
          },
        },
      ]
    );
  };

  const handleRestoreSubscription = async () => {
    const success = await restoreSubscription();
    if (success) {
      Alert.alert(
        t("subscription.restoreSuccess.title", "Abonnement restauré"),
        t("subscription.restoreSuccess.message", "Votre abonnement a été restauré avec succès.")
      );
      loadQuotaStats();
    } else {
      Alert.alert(
        t("subscription.restoreError.title", "Aucun abonnement trouvé"),
        t("subscription.restoreError.message", "Aucun abonnement à restaurer n'a été trouvé.")
      );
    }
  };

  // Stripe portal removed

  const renderSubscriptionInfo = () => {
    if (!subscription) {
      return (
        <View style={[
          tw`p-6 rounded-xl mb-6`,
          { backgroundColor: currentTheme.colors.surface }
        ]}>
          <Text style={[
            tw`text-lg font-bold mb-2`,
            { color: currentTheme.colors.text }
          ]}>
            {t("subscription.noSubscription", "Aucun abonnement")}
          </Text>
          <Text style={[
            tw`text-base mb-4`,
            { color: currentTheme.colors.textSecondary }
          ]}>
            {t("subscription.noSubscriptionMessage", "Vous êtes actuellement sur le plan gratuit.")}
          </Text>
          <TouchableOpacity
            style={[
              tw`py-3 px-6 rounded-lg`,
              { backgroundColor: currentTheme.colors.primary }
            ]}
            onPress={() => navigation.navigate("Pricing")}
          >
            <Text style={[
              tw`text-center font-semibold`,
              { color: getOptimizedButtonColors().text }
            ]}>
              {t("subscription.upgrade", "Mettre à niveau")}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[
        tw`p-6 rounded-xl mb-6`,
        { backgroundColor: currentTheme.colors.surface }
      ]}>
        <View style={tw`flex-row items-center justify-between mb-4`}>
          <Text style={[
            tw`text-lg font-bold`,
            { color: currentTheme.colors.text }
          ]}>
            {t("subscription.currentPlan", "Plan actuel")}
          </Text>
          <View style={[
            tw`px-3 py-1 rounded-full`,
            { backgroundColor: currentPlan.color + '20' }
          ]}>
            <Text style={[
              tw`text-sm font-medium`,
              { color: currentPlan.color }
            ]}>
              {subscription.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={[
          tw`text-2xl font-bold mb-2`,
          { color: currentTheme.colors.text }
        ]}>
          {currentPlan.displayName}
        </Text>

        <Text style={[
          tw`text-base mb-4`,
          { color: currentTheme.colors.textSecondary }
        ]}>
          {currentPlan.description}
        </Text>

        {subscription.endDate && (
          <Text style={[
            tw`text-sm mb-4`,
            { color: currentTheme.colors.textSecondary }
          ]}>
            {subscription.status === "active" 
              ? t("subscription.renewsOn", "Se renouvelle le")
              : t("subscription.expiresOn", "Expire le")
            }: {new Date(subscription.endDate).toLocaleDateString()}
          </Text>
        )}

        <View style={tw`flex-row gap-3`}>
          <TouchableOpacity
            style={[
              tw`flex-1 py-3 px-4 rounded-lg`,
              { backgroundColor: currentTheme.colors.primary }
            ]}
            onPress={() => navigation.navigate("Pricing")}
          >
            <Text style={[
              tw`text-center font-semibold`,
              { color: getOptimizedButtonColors().text }
            ]}>
              {t("subscription.changePlan", "Changer de plan")}
            </Text>
          </TouchableOpacity>

          {/* Stripe customer portal removed */}
        </View>
      </View>
    );
  };

  const renderUsageStats = () => {
    if (isLoadingStats) {
      return (
        <View style={[
          tw`p-6 rounded-xl mb-6 items-center`,
          { backgroundColor: currentTheme.colors.surface }
        ]}>
          <ActivityIndicator color={currentTheme.colors.primary} />
          <Text style={[
            tw`mt-2 text-center`,
            { color: currentTheme.colors.textSecondary }
          ]}>
            {t("subscription.loadingStats", "Chargement des statistiques...")}
          </Text>
        </View>
      );
    }

    return (
      <View style={[
        tw`p-6 rounded-xl mb-6`,
        { backgroundColor: currentTheme.colors.surface }
      ]}>
        <Text style={[
          tw`text-lg font-bold mb-4`,
          { color: currentTheme.colors.text }
        ]}>
          {t("subscription.usage", "Utilisation")}
        </Text>

        {quotaStats && (
          <View style={tw`gap-4`}>
            {/* Usage journalier */}
            <View>
              <View style={tw`flex-row justify-between mb-2`}>
                <Text style={[
                  tw`text-sm font-medium`,
                  { color: currentTheme.colors.text }
                ]}>
                  {t("subscription.dailyUsage", "Usage journalier")}
                </Text>
                <Text style={[
                  tw`text-sm`,
                  { color: currentTheme.colors.textSecondary }
                ]}>
                  {quotaStats.daily.used}
                  {quotaStats.daily.limit && ` / ${quotaStats.daily.limit}`}
                </Text>
              </View>
              {quotaStats.daily.limit && (
                <View style={[
                  tw`h-2 rounded-full`,
                  { backgroundColor: currentTheme.colors.border }
                ]}>
                  <View style={[
                    tw`h-2 rounded-full`,
                    { 
                      backgroundColor: currentTheme.colors.primary,
                      width: `${Math.min(100, (quotaStats.daily.used / quotaStats.daily.limit) * 100)}%`
                    }
                  ]} />
                </View>
              )}
            </View>

            {/* Usage mensuel */}
            <View>
              <View style={tw`flex-row justify-between mb-2`}>
                <Text style={[
                  tw`text-sm font-medium`,
                  { color: currentTheme.colors.text }
                ]}>
                  {t("subscription.monthlyUsage", "Usage mensuel")}
                </Text>
                <Text style={[
                  tw`text-sm`,
                  { color: currentTheme.colors.textSecondary }
                ]}>
                  {quotaStats.monthly.used}
                  {quotaStats.monthly.limit && ` / ${quotaStats.monthly.limit}`}
                </Text>
              </View>
              {quotaStats.monthly.limit && (
                <View style={[
                  tw`h-2 rounded-full`,
                  { backgroundColor: currentTheme.colors.border }
                ]}>
                  <View style={[
                    tw`h-2 rounded-full`,
                    { 
                      backgroundColor: currentTheme.colors.primary,
                      width: `${Math.min(100, (quotaStats.monthly.used / quotaStats.monthly.limit) * 100)}%`
                    }
                  ]} />
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderActions = () => {
    return (
      <View style={[
        tw`p-6 rounded-xl mb-6`,
        { backgroundColor: currentTheme.colors.surface }
      ]}>
        <Text style={[
          tw`text-lg font-bold mb-4`,
          { color: currentTheme.colors.text }
        ]}>
          {t("subscription.actions", "Actions")}
        </Text>

        <View style={tw`gap-3`}>
          <TouchableOpacity
            style={[
              tw`py-3 px-4 rounded-lg border`,
              { 
                borderColor: currentTheme.colors.border,
                backgroundColor: "transparent"
              }
            ]}
            onPress={handleRestoreSubscription}
          >
            <Text style={[
              tw`text-center font-semibold`,
              { color: currentTheme.colors.primary }
            ]}>
              {t("subscription.restore", "Restaurer les achats")}
            </Text>
          </TouchableOpacity>

          {subscription && subscription.status === "active" && (
            <TouchableOpacity
              style={[
                tw`py-3 px-4 rounded-lg border`,
                { 
                  borderColor: currentTheme.colors.error,
                  backgroundColor: "transparent"
                }
              ]}
              onPress={handleCancelSubscription}
            >
              <Text style={[
                tw`text-center font-semibold`,
                { color: currentTheme.colors.error }
              ]}>
                {t("subscription.cancel", "Annuler l'abonnement")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[
        tw`flex-1 items-center justify-center`,
        { backgroundColor: currentTheme.colors.background }
      ]}>
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
        <Text style={[
          tw`mt-4 text-center`,
          { color: currentTheme.colors.textSecondary }
        ]}>
          {t("subscription.loading", "Chargement...")}
        </Text>
      </View>
    );
  }

  return (
    <View style={[
      tw`flex-1`,
      { backgroundColor: currentTheme.colors.background }
    ]}>
      <CustomHeader
        title={t("subscription.management", "Gestion des abonnements")}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        {renderSubscriptionInfo()}
        {renderUsageStats()}
        {renderActions()}
      </ScrollView>

      {/* Stripe portal removed */}
    </View>
  );
};

export default SubscriptionManagementScreen;
