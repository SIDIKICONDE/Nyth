import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import LinearGradient from "react-native-linear-gradient";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useSubscription } from "../../contexts/SubscriptionContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { useContrastOptimization } from "../../hooks/useContrastOptimization";
import { RootStackParamList } from "../../types/navigation";
import { UIText } from "../ui/Typography";
import { useSubscriptionLock } from "./SubscriptionLockManager";

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const SubscriptionSection: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { getOptimizedButtonColors } = useContrastOptimization();
  const { currentPlan, subscription, isManaged } = useSubscription();

  // Utilisation du hook de verrouillage centralisé
  const { isLocked: isSubscriptionLocked, reason } = useSubscriptionLock();

  const handlePress = () => {
    if (isSubscriptionLocked) {
      // Ne rien faire si la section est verrouillée
      return;
    }
    navigation.navigate("Pricing");
  };

  return (
    <View
      style={[
        tw`rounded-xl overflow-hidden`,
        { backgroundColor: currentTheme.colors.surface },
      ]}
    >
      <LinearGradient
        colors={[`${currentPlan.color}30`, `${currentPlan.color}10`]}
        style={tw`p-4`}
      >
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <View style={tw`flex-row items-center`}>
            <MaterialCommunityIcons
              name={isSubscriptionLocked ? "lock" : "crown"}
              size={24}
              color={
                isSubscriptionLocked
                  ? currentTheme.colors.textSecondary
                  : currentPlan.color
              }
            />
            <UIText
              size="lg"
              weight="semibold"
              style={tw`ml-3`}
              color={currentTheme.colors.text}
            >
              {t("settings.subscription.title", "Abonnement")}
            </UIText>
          </View>
          <View
            style={[
              tw`px-2 py-1 rounded-full`,
              {
                backgroundColor: isSubscriptionLocked
                  ? currentTheme.colors.textSecondary
                  : getOptimizedButtonColors().background,
              },
            ]}
          >
            <UIText
              size="xs"
              weight="medium"
              style={{ color: getOptimizedButtonColors().text }}
            >
              {isSubscriptionLocked
                ? t("settings.subscription.locked", "Verrouillé")
                : currentPlan.displayName}
            </UIText>
          </View>
        </View>

        {isSubscriptionLocked ? (
          <View style={tw`mb-3`}>
            <UIText
              size="sm"
              style={tw`mb-2`}
              color={currentTheme.colors.textSecondary}
            >
              {t(
                "settings.subscription.temporarilyLocked",
                "Cette section est temporairement verrouillée."
              )}
            </UIText>
            <View
              style={[
                tw`p-3 rounded-lg flex-row items-center`,
                { backgroundColor: currentTheme.colors.warning + "20" },
              ]}
            >
              <MaterialCommunityIcons
                name="information"
                size={16}
                color={currentTheme.colors.warning}
              />
              <UIText
                size="xs"
                style={tw`ml-2 flex-1`}
                color={currentTheme.colors.warning}
              >
                {reason ||
                  t(
                    "settings.subscription.maintenanceMode",
                    "Fonctionnalité en cours de maintenance."
                  )}
              </UIText>
            </View>
          </View>
        ) : (
          <>
            {isManaged ? (
              <View style={tw`mb-3`}>
                <UIText
                  size="sm"
                  style={tw`mb-1`}
                  color={currentTheme.colors.textSecondary}
                >
                  {t(
                    "settings.subscription.managedMode",
                    "Mode managé - Clés API fournies"
                  )}
                </UIText>
                {currentPlan.limits.dailyGenerations && (
                  <UIText size="sm" color={currentTheme.colors.text}>
                    {currentPlan.limits.dailyGenerations}{" "}
                    {t(
                      "settings.subscription.generationsPerDay",
                      "générations/jour"
                    )}
                  </UIText>
                )}
                {currentPlan.limits.monthlyGenerations && (
                  <UIText size="sm" color={currentTheme.colors.text}>
                    {currentPlan.limits.monthlyGenerations}{" "}
                    {t(
                      "settings.subscription.generationsPerMonth",
                      "générations/mois"
                    )}
                  </UIText>
                )}
              </View>
            ) : (
              <View style={tw`mb-3`}>
                <UIText size="sm" color={currentTheme.colors.textSecondary}>
                  {t(
                    "settings.subscription.ownKeysMode",
                    "Vous utilisez vos propres clés API"
                  )}
                </UIText>
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          onPress={handlePress}
          disabled={isSubscriptionLocked}
          style={[
            tw`py-3 rounded-lg items-center flex-row justify-center`,
            {
              backgroundColor: isSubscriptionLocked
                ? currentTheme.colors.textSecondary + "50"
                : getOptimizedButtonColors().background,
              opacity: isSubscriptionLocked ? 0.6 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={isSubscriptionLocked ? "lock" : "rocket-launch"}
            size={20}
            color={getOptimizedButtonColors().text}
          />
          <UIText
            weight="semibold"
            style={[tw`ml-2`, { color: getOptimizedButtonColors().text }]}
          >
            {isSubscriptionLocked
              ? t("settings.subscription.sectionLocked", "Section verrouillée")
              : currentPlan.id === "free"
              ? t("settings.subscription.viewPlans", "Voir les plans")
              : t("settings.subscription.managePlan", "Gérer mon plan")}
          </UIText>
        </TouchableOpacity>

        {!isSubscriptionLocked && subscription?.status === "trial" && (
          <View
            style={[
              tw`mt-3 p-2 rounded-lg flex-row items-center`,
              { backgroundColor: currentTheme.colors.warning + "20" },
            ]}
          >
            <MaterialCommunityIcons
              name="clock-alert"
              size={16}
              color={currentTheme.colors.warning}
            />
            <UIText
              size="xs"
              style={tw`ml-2`}
              color={currentTheme.colors.warning}
            >
              {t(
                "settings.subscription.trialEndsIn",
                "Période d'essai se termine dans"
              )}{" "}
              {t("settings.subscription.xDays", "X jours")}
            </UIText>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};
