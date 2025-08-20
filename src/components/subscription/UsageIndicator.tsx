import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { useSubscription } from "../../contexts/SubscriptionContext";
import { RootStackParamList } from "../../types/navigation";

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface UsageIndicatorProps {
  style?: any;
  showUpgradeButton?: boolean;
}

export const UsageIndicator: React.FC<UsageIndicatorProps> = ({
  style,
  showUpgradeButton = true,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { currentPlan, getRemainingGenerations, isManaged } = useSubscription();

  const remaining = getRemainingGenerations();
  const hasLimit =
    remaining.daily !== undefined || remaining.monthly !== undefined;

  // Ne pas afficher si l'utilisateur utilise ses propres clés
  if (!isManaged) {
    return null;
  }

  // Ne pas afficher si pas de limite
  if (!hasLimit) {
    return null;
  }

  const getUsageColor = () => {
    if (remaining.daily !== undefined) {
      if (remaining.daily === 0) return currentTheme.colors.error;
      if (remaining.daily <= 2) return currentTheme.colors.warning;
    }
    if (remaining.monthly !== undefined) {
      const percentUsed =
        remaining.monthly / (currentPlan.limits.monthlyGenerations || 1);
      if (percentUsed <= 0.1) return currentTheme.colors.warning;
    }
    return currentTheme.colors.success;
  };

  return (
    <View
      style={[
        tw`px-4 py-2 rounded-lg flex-row items-center justify-between`,
        { backgroundColor: currentTheme.colors.surface },
        style,
      ]}
    >
      <View style={tw`flex-row items-center`}>
        <MaterialCommunityIcons
          name="lightning-bolt"
          size={20}
          color={getUsageColor()}
        />
        <View style={tw`ml-2`}>
          {remaining.daily !== undefined && (
            <Text style={[tw`text-sm font-medium`, { color: getUsageColor() }]}>
              {remaining.daily}{" "}
              {t(
                "subscription.generationsLeft",
                "générations restantes aujourd'hui"
              )}
            </Text>
          )}
          {remaining.monthly !== undefined && (
            <Text
              style={[
                tw`text-xs`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {remaining.monthly} {t("subscription.thisMonth", "ce mois")}
            </Text>
          )}
        </View>
      </View>

      {showUpgradeButton &&
        currentPlan.id !== "pro" &&
        currentPlan.id !== "enterprise" && (
          <TouchableOpacity
            onPress={() => navigation.navigate("Pricing")}
            style={[
              tw`px-3 py-1.5 rounded-full`,
              { backgroundColor: currentTheme.colors.primary },
            ]}
          >
            <Text style={[tw`text-xs font-medium`, { color: "#fff" }]}>
              {t("subscription.upgrade", "Upgrade")}
            </Text>
          </TouchableOpacity>
        )}
    </View>
  );
};
