import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import LinearGradient from "react-native-linear-gradient";
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

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Stripe portal removed
  const [quotaStats, setQuotaStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Animation d'entrée
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
        <Animated.View
          style={[
            tw`rounded-3xl mb-6 overflow-hidden shadow-lg`,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
              shadowColor: currentTheme.colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
            },
          ]}
        >
          <LinearGradient
            colors={[currentTheme.colors.surface, `${currentTheme.colors.surface}80`]}
            style={tw`p-8`}
          >
            <View style={tw`items-center mb-6`}>
              <View
                style={[
                  tw`w-16 h-16 rounded-full items-center justify-center mb-4`,
                  { backgroundColor: `${currentTheme.colors.primary}20` },
                ]}
              >
                <MaterialCommunityIcons
                  name="crown-outline"
                  size={32}
                  color={currentTheme.colors.primary}
                />
              </View>
              <Text style={[
                tw`text-xl font-bold mb-2`,
                { color: currentTheme.colors.text }
              ]}>
                {t("subscription.noSubscription", "Aucun abonnement")}
              </Text>
              <Text style={[
                tw`text-base text-center leading-6`,
                { color: currentTheme.colors.textSecondary }
              ]}>
                {t("subscription.noSubscriptionMessage", "Vous êtes actuellement sur le plan gratuit.")}
              </Text>
            </View>
            <TouchableOpacity
              style={tw`mb-2`}
              onPress={() => navigation.navigate("Pricing")}
            >
              <LinearGradient
                colors={[currentTheme.colors.primary, `${currentTheme.colors.primary}DD`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={tw`py-4 px-8 rounded-2xl items-center shadow-md`}
              >
                <Text style={[
                  tw`text-center font-bold text-lg`,
                  { color: getOptimizedButtonColors().text }
                ]}>
                  {t("subscription.upgrade", "Mettre à niveau")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        style={[
          tw`rounded-3xl mb-6 overflow-hidden shadow-lg`,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
            shadowColor: currentPlan.color,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 8,
          },
        ]}
      >
        <LinearGradient
          colors={[currentPlan.color + '15', currentPlan.color + '08', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={tw`p-8`}
        >
          <View style={tw`flex-row items-center justify-between mb-6`}>
            <View style={tw`flex-row items-center`}>
              <View
                style={[
                  tw`w-12 h-12 rounded-full items-center justify-center mr-3`,
                  { backgroundColor: currentPlan.color + '30' },
                ]}
              >
                <MaterialCommunityIcons
                  name="check-circle"
                  size={24}
                  color={currentPlan.color}
                />
              </View>
              <Text style={[
                tw`text-xl font-bold`,
                { color: currentTheme.colors.text }
              ]}>
                {t("subscription.currentPlan", "Plan actuel")}
              </Text>
            </View>
            <View style={[
              tw`px-4 py-2 rounded-full border-2`,
              {
                backgroundColor: currentPlan.color + '20',
                borderColor: currentPlan.color + '40',
              }
            ]}>
              <Text style={[
                tw`text-sm font-bold`,
                { color: currentPlan.color }
              ]}>
                {subscription.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={tw`mb-6`}>
            <Text style={[
              tw`text-3xl font-bold mb-3`,
              { color: currentTheme.colors.text }
            ]}>
              {currentPlan.displayName}
            </Text>

            <Text style={[
              tw`text-lg leading-6 mb-4`,
              { color: currentTheme.colors.textSecondary }
            ]}>
              {currentPlan.description}
            </Text>

            {subscription.endDate && (
              <View style={tw`flex-row items-center`}>
                <MaterialCommunityIcons
                  name={subscription.status === "active" ? "calendar-refresh" : "calendar-remove"}
                  size={18}
                  color={currentTheme.colors.textSecondary}
                />
                <Text style={[
                  tw`text-base ml-2`,
                  { color: currentTheme.colors.textSecondary }
                ]}>
                  {subscription.status === "active"
                    ? t("subscription.renewsOn", "Se renouvelle le")
                    : t("subscription.expiresOn", "Expire le")
                  }: {new Date(subscription.endDate).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          <View style={tw`flex-row gap-4`}>
            <TouchableOpacity
              style={tw`flex-1`}
              onPress={() => navigation.navigate("Pricing")}
            >
              <LinearGradient
                colors={[currentPlan.color, currentPlan.color + 'DD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={tw`py-4 px-6 rounded-2xl items-center shadow-md`}
              >
                <Text style={[
                  tw`text-center font-bold text-base`,
                  { color: '#fff' }
                ]}>
                  {t("subscription.changePlan", "Changer de plan")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Stripe customer portal removed */}
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderUsageStats = () => {
    if (isLoadingStats) {
      return (
        <Animated.View
          style={[
            tw`rounded-3xl mb-6 overflow-hidden shadow-lg`,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
              shadowColor: currentTheme.colors.text,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 6,
            },
          ]}
        >
          <LinearGradient
            colors={[currentTheme.colors.surface, `${currentTheme.colors.surface}80`]}
            style={tw`p-8 items-center`}
          >
            <ActivityIndicator size="large" color={currentTheme.colors.primary} />
            <Text style={[
              tw`mt-4 text-center text-base`,
              { color: currentTheme.colors.textSecondary }
            ]}>
              {t("subscription.loadingStats", "Chargement des statistiques...")}
            </Text>
          </LinearGradient>
        </Animated.View>
      );
    }

    const renderProgressBar = (used: number, limit: number, color: string, title: string) => {
      const percentage = Math.min(100, (used / limit) * 100);
      const isNearLimit = percentage > 80;

      return (
        <View style={tw`mb-6`}>
          <View style={tw`flex-row justify-between items-center mb-3`}>
            <Text style={[
              tw`text-base font-semibold`,
              { color: currentTheme.colors.text }
            ]}>
              {title}
            </Text>
            <View style={tw`flex-row items-center`}>
              <Text style={[
                tw`text-sm font-bold mr-2`,
                { color: isNearLimit ? currentTheme.colors.error : color }
              ]}>
                {used}
              </Text>
              <Text style={[
                tw`text-sm`,
                { color: currentTheme.colors.textSecondary }
              ]}>
                / {limit}
              </Text>
            </View>
          </View>

          <View style={[
            tw`h-4 rounded-full overflow-hidden`,
            { backgroundColor: currentTheme.colors.border + '40' }
          ]}>
            <LinearGradient
              colors={[
                isNearLimit ? currentTheme.colors.error : color,
                isNearLimit ? `${currentTheme.colors.error}DD` : `${color}DD`
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                tw`h-full rounded-full shadow-sm`,
                { width: `${percentage}%` }
              ]}
            />
          </View>

          {isNearLimit && (
            <View style={tw`flex-row items-center mt-2`}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={16}
                color={currentTheme.colors.error}
              />
              <Text style={[
                tw`text-sm ml-2`,
                { color: currentTheme.colors.error }
              ]}>
                {t("subscription.nearLimit", "Limite bientôt atteinte")}
              </Text>
            </View>
          )}
        </View>
      );
    };

    return (
      <Animated.View
        style={[
          tw`rounded-3xl mb-6 overflow-hidden shadow-lg`,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
            shadowColor: currentTheme.colors.text,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 6,
          },
        ]}
      >
        <LinearGradient
          colors={[currentTheme.colors.surface, `${currentTheme.colors.surface}80`]}
          style={tw`p-8`}
        >
          <View style={tw`flex-row items-center mb-6`}>
            <MaterialCommunityIcons
              name="chart-line"
              size={24}
              color={currentTheme.colors.primary}
            />
            <Text style={[
              tw`text-xl font-bold ml-3`,
              { color: currentTheme.colors.text }
            ]}>
              {t("subscription.usage", "Utilisation")}
            </Text>
          </View>

          {quotaStats && (
            <View>
              {/* Usage journalier */}
              {quotaStats.daily.limit && renderProgressBar(
                quotaStats.daily.used,
                quotaStats.daily.limit,
                currentTheme.colors.primary,
                t("subscription.dailyUsage", "Usage journalier")
              )}

              {/* Usage mensuel */}
              {quotaStats.monthly.limit && renderProgressBar(
                quotaStats.monthly.used,
                quotaStats.monthly.limit,
                currentPlan.color,
                t("subscription.monthlyUsage", "Usage mensuel")
              )}
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderActions = () => {
    return (
      <Animated.View
        style={[
          tw`rounded-3xl mb-6 overflow-hidden shadow-lg`,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
            shadowColor: currentTheme.colors.text,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 6,
          },
        ]}
      >
        <LinearGradient
          colors={[currentTheme.colors.surface, `${currentTheme.colors.surface}80`]}
          style={tw`p-8`}
        >
          <View style={tw`flex-row items-center mb-6`}>
            <MaterialCommunityIcons
              name="settings-outline"
              size={24}
              color={currentTheme.colors.primary}
            />
            <Text style={[
              tw`text-xl font-bold ml-3`,
              { color: currentTheme.colors.text }
            ]}>
              {t("subscription.actions", "Actions")}
            </Text>
          </View>

          <View style={tw`gap-4`}>
            <TouchableOpacity
              style={tw`overflow-hidden`}
              onPress={handleRestoreSubscription}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[`${currentTheme.colors.primary}20`, `${currentTheme.colors.primary}10`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={tw`py-4 px-6 rounded-2xl border-2 items-center`}
              >
                <Text style={[
                  tw`text-center font-bold text-base`,
                  { color: currentTheme.colors.primary }
                ]}>
                  {t("subscription.restore", "Restaurer les achats")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {subscription && subscription.status === "active" && (
              <TouchableOpacity
                style={tw`overflow-hidden`}
                onPress={handleCancelSubscription}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[`${currentTheme.colors.error}20`, `${currentTheme.colors.error}10`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={tw`py-4 px-6 rounded-2xl border-2 items-center`}
                >
                  <Text style={[
                    tw`text-center font-bold text-base`,
                    { color: currentTheme.colors.error }
                  ]}>
                    {t("subscription.cancel", "Annuler l'abonnement")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
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
