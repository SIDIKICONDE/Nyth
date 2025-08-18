import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Switch,
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
import { SUBSCRIPTION_PLANS } from "../../constants/subscriptionPlans";
import { RootStackParamList } from "../../types/navigation";
import { StripeCheckout } from "../../components/subscription/StripeCheckout";
import { StripeCustomerPortal } from "../../components/subscription/StripeCustomerPortal";
import { PaymentService } from "../../services/subscription/PaymentService";
import { getStripePriceId } from "../../config/stripe";
import { useStripe } from "../../hooks/useStripe";

type NavigationProp = StackNavigationProp<RootStackParamList>;

const PricingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { getOptimizedButtonColors } = useContrastOptimization();
  const { currentPlan, subscription, upgradePlan, isLoading } =
    useSubscription();
  const { isStripeConfigured } = useStripe();

  const [selectedPlan, setSelectedPlan] = useState<string>(currentPlan.id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [showCustomerPortal, setShowCustomerPortal] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState<string>("");
  const [isYearlyPlan, setIsYearlyPlan] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const scrollRef = useRef<ScrollView>(null);
  const { width: screenWidth } = Dimensions.get("window");
  const cardWidth = screenWidth * 0.85;
  const cardMargin = 10;

  const handleSelectPlan = async (planId: string) => {
    if (planId === currentPlan.id) {
      // Si l'utilisateur est déjà sur ce plan, ouvrir le portail client
      if (subscription && subscription.status === "active" && planId !== "free") {
        setShowCustomerPortal(true);
      } else {
        Alert.alert(
          t("subscription.alreadyOnPlan.title", "Déjà abonné"),
          t("subscription.alreadyOnPlan.message", "Vous êtes déjà sur ce plan.")
        );
      }
      return;
    }

    setSelectedPlan(planId);

    // Si c'est le plan gratuit, utiliser l'ancienne méthode
    if (planId === "free") {
      Alert.alert(
        t("subscription.confirmDowngrade.title", "Confirmer le changement"),
        t(
          "subscription.confirmDowngrade.message",
          "Voulez-vous passer au plan gratuit ? Vous perdrez l'accès aux fonctionnalités premium."
        ),
        [
          {
            text: t("common.cancel", "Annuler"),
            style: "cancel",
          },
          {
            text: t("common.confirm", "Confirmer"),
            onPress: () => performUpgrade(planId),
          },
        ]
      );
      return;
    }

    // Pour les plans payants, configurer le provider et ouvrir Stripe
    if (isStripeConfigured()) {
      PaymentService.setPreferredProvider("stripe");
      setCheckoutPlanId(planId);
      setShowStripeCheckout(true);
    } else {
      // Fallback vers l'ancienne méthode si Stripe n'est pas configuré
      Alert.alert(
        t("subscription.confirmUpgrade.title", "Confirmer le changement"),
        t(
          "subscription.confirmUpgrade.message",
          `Voulez-vous passer au plan ${SUBSCRIPTION_PLANS[planId].displayName} ?`
        ),
        [
          {
            text: t("common.cancel", "Annuler"),
            style: "cancel",
          },
          {
            text: t("common.confirm", "Confirmer"),
            onPress: () => performUpgrade(planId),
          },
        ]
      );
    }
  };

  const performUpgrade = async (planId: string) => {
    setIsProcessing(true);
    try {
      const success = await upgradePlan(planId);
      if (success) {
        Alert.alert(
          t("subscription.upgradeSuccess.title", "Succès"),
          t(
            "subscription.upgradeSuccess.message",
            "Votre plan a été mis à jour avec succès."
          )
        );
        navigation.goBack();
      } else {
        throw new Error("Upgrade failed");
      }
    } catch (error) {
      Alert.alert(
        t("common.error", "Erreur"),
        t(
          "subscription.upgradeError",
          "Impossible de changer de plan. Veuillez réessayer."
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripeSuccess = () => {
    setShowStripeCheckout(false);
    Alert.alert(
      t("subscription.upgradeSuccess.title", "Paiement réussi"),
      t(
        "subscription.upgradeSuccess.message",
        "Votre abonnement a été mis à jour avec succès !"
      )
    );
    navigation.goBack();
  };

  const handleStripeError = (error: string) => {
    setShowStripeCheckout(false);
    Alert.alert(
      t("subscription.upgradeError.title", "Erreur de paiement"),
      error
    );
  };

  const handleStripeCancel = () => {
    setShowStripeCheckout(false);
  };

  const renderPlanCard = (
    plan: (typeof SUBSCRIPTION_PLANS)[keyof typeof SUBSCRIPTION_PLANS]
  ) => {
    const isCurrentPlan = plan.id === currentPlan.id;
    const isSelected = plan.id === selectedPlan;

    return (
      <TouchableOpacity
        key={plan.id}
        onPress={() => handleSelectPlan(plan.id)}
        disabled={isProcessing}
        style={[
          tw`mb-4 rounded-2xl overflow-hidden`,
          {
            borderWidth: isCurrentPlan ? 2 : 1,
            borderColor: isCurrentPlan
              ? plan.color
              : currentTheme.colors.border,
            opacity: isProcessing ? 0.7 : 1,
          },
        ]}
      >
        {plan.popular && (
          <View
            style={[
              tw`absolute top-0 right-0 px-3 py-1 rounded-bl-lg z-10`,
              { backgroundColor: plan.color },
            ]}
          >
            <Text
              style={[
                tw`text-xs font-bold`,
                { color: getOptimizedButtonColors().text },
              ]}
            >
              {t("subscription.popular", "Populaire")}
            </Text>
          </View>
        )}

        <LinearGradient
          colors={[`${plan.color}20`, "transparent"]}
          style={tw`p-5`}
        >
          <View style={tw`flex-row justify-between items-start mb-3`}>
            <View>
              <Text
                style={[
                  tw`text-2xl font-bold mb-1`,
                  { color: currentTheme.colors.text },
                ]}
              >
                {plan.displayName}
              </Text>
              <Text
                style={[
                  tw`text-sm`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                {plan.description}
              </Text>
            </View>

            {isCurrentPlan && (
              <View
                style={[
                  tw`px-2 py-1 rounded-full`,
                  { backgroundColor: getOptimizedButtonColors().background },
                ]}
              >
                <Text
                  style={[
                    tw`text-xs font-medium`,
                    { color: getOptimizedButtonColors().text },
                  ]}
                >
                  {t("subscription.current", "Actuel")}
                </Text>
              </View>
            )}
          </View>

          <View style={tw`mb-4`}>
            <Text style={[tw`text-3xl font-bold`, { color: plan.color }]}>
              {plan.price === 0
                ? t("subscription.free", "Gratuit")
                : `${plan.price}€`}
              {plan.price > 0 && (
                <Text
                  style={[
                    tw`text-base font-normal`,
                    { color: currentTheme.colors.textSecondary },
                  ]}
                >
                  /{t(`subscription.period.${plan.period}`, "mois")}
                </Text>
              )}
            </Text>
          </View>

          <View style={tw`mb-4`}>
            {plan.limits.dailyGenerations && (
              <View style={tw`flex-row items-center mb-2`}>
                <MaterialCommunityIcons
                  name="calendar-today"
                  size={16}
                  color={currentTheme.colors.textSecondary}
                />
                <Text
                  style={[
                    tw`ml-2 text-sm`,
                    { color: currentTheme.colors.text },
                  ]}
                >
                  {plan.limits.dailyGenerations}{" "}
                  {t("subscription.generationsPerDay", "générations/jour")}
                </Text>
              </View>
            )}

            {plan.limits.monthlyGenerations && (
              <View style={tw`flex-row items-center mb-2`}>
                <MaterialCommunityIcons
                  name="calendar-month"
                  size={16}
                  color={currentTheme.colors.textSecondary}
                />
                <Text
                  style={[
                    tw`ml-2 text-sm`,
                    { color: currentTheme.colors.text },
                  ]}
                >
                  {plan.limits.monthlyGenerations}{" "}
                  {t("subscription.generationsPerMonth", "générations/mois")}
                </Text>
              </View>
            )}

            {!plan.limits.dailyGenerations &&
              !plan.limits.monthlyGenerations && (
                <View style={tw`flex-row items-center mb-2`}>
                  <MaterialCommunityIcons
                    name="infinity"
                    size={16}
                    color={plan.color}
                  />
                  <Text
                    style={[
                      tw`ml-2 text-sm font-medium`,
                      { color: plan.color },
                    ]}
                  >
                    {t("subscription.unlimited", "Générations illimitées")}
                  </Text>
                </View>
              )}
          </View>

          <View>
            {plan.limits.features.map((feature, index) => (
              <View key={index} style={tw`flex-row items-start mb-2`}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={16}
                  color={plan.color}
                  style={tw`mt-0.5`}
                />
                <Text
                  style={[
                    tw`ml-2 text-sm flex-1`,
                    { color: currentTheme.colors.text },
                  ]}
                >
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {!isCurrentPlan && (
            <TouchableOpacity
              onPress={() => handleSelectPlan(plan.id)}
              disabled={isProcessing}
              style={[
                tw`mt-4 py-3 rounded-lg items-center`,
                {
                  backgroundColor: isSelected
                    ? getOptimizedButtonColors().background
                    : `${plan.color}20`,
                },
              ]}
            >
              {isProcessing && isSelected ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text
                  style={[
                    tw`font-semibold`,
                    {
                      color: isSelected
                        ? getOptimizedButtonColors().text
                        : plan.color,
                    },
                  ]}
                >
                  {t("subscription.selectPlan", "Choisir ce plan")}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View
        style={[
          tw`flex-1 items-center justify-center`,
          { backgroundColor: currentTheme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}
    >
      <CustomHeader
        title={t("subscription.title", "Abonnements")}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        <View style={tw`mb-6`}>
          <Text
            style={[
              tw`text-2xl font-bold mb-2`,
              { color: currentTheme.colors.text },
            ]}
          >
            {t("subscription.chooseYourPlan", "Choisissez votre plan")}
          </Text>
          <Text
            style={[
              tw`text-base mb-4`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {t("subscription.subtitle", "Débloquez tout le potentiel de l'IA")}
          </Text>

          {/* Sélecteur de période pour Stripe */}
          {isStripeConfigured() && (
            <View style={[
              tw`flex-row rounded-lg p-1 mb-4`,
              { backgroundColor: currentTheme.colors.surface }
            ]}>
              <TouchableOpacity
                style={[
                  tw`flex-1 py-2 px-4 rounded-md`,
                  {
                    backgroundColor: selectedPeriod === "monthly" 
                      ? currentTheme.colors.primary 
                      : "transparent"
                  }
                ]}
                onPress={() => setSelectedPeriod("monthly")}
              >
                <Text
                  style={[
                    tw`text-center font-medium`,
                    {
                      color: selectedPeriod === "monthly"
                        ? getOptimizedButtonColors().text
                        : currentTheme.colors.text
                    }
                  ]}
                >
                  {t("subscription.monthly", "Mensuel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  tw`flex-1 py-2 px-4 rounded-md`,
                  {
                    backgroundColor: selectedPeriod === "yearly" 
                      ? currentTheme.colors.primary 
                      : "transparent"
                  }
                ]}
                onPress={() => setSelectedPeriod("yearly")}
              >
                <Text
                  style={[
                    tw`text-center font-medium`,
                    {
                      color: selectedPeriod === "yearly"
                        ? getOptimizedButtonColors().text
                        : currentTheme.colors.text
                    }
                  ]}
                >
                  {t("subscription.yearly", "Annuel")}
                  <Text style={[tw`text-xs`, { color: currentTheme.colors.success }]}>
                    {" "}({t("subscription.save", "Économisez 20%")})
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {Object.values(SUBSCRIPTION_PLANS).map(renderPlanCard)}

        <View
          style={[
            tw`mt-6 p-4 rounded-lg`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
        >
          <Text
            style={[
              tw`text-sm text-center`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {t(
              "subscription.disclaimer",
              "Vous pouvez annuler votre abonnement à tout moment. Les utilisateurs avec leurs propres clés API peuvent continuer à les utiliser gratuitement."
            )}
          </Text>
        </View>
      </ScrollView>

      {/* Modal Stripe Checkout */}
      {showStripeCheckout && checkoutPlanId && (
        <View style={tw`absolute inset-0 bg-black bg-opacity-50 items-center justify-center`}>
          <View style={[
            tw`w-11/12 max-h-5/6 rounded-xl overflow-hidden`,
            { backgroundColor: currentTheme.colors.background }
          ]}>
            <StripeCheckout
              planId={checkoutPlanId}
              priceId={getStripePriceId(checkoutPlanId, selectedPeriod)}
              onSuccess={handleStripeSuccess}
              onCancel={handleStripeCancel}
              onError={handleStripeError}
            />
          </View>
        </View>
      )}

      {/* Modal Portail Client */}
      {showCustomerPortal && (
        <View style={tw`absolute inset-0 bg-black bg-opacity-50 items-center justify-center`}>
          <View style={[
            tw`w-11/12 max-h-5/6 rounded-xl overflow-hidden`,
            { backgroundColor: currentTheme.colors.background }
          ]}>
            <StripeCustomerPortal
              onSuccess={() => {
                setShowCustomerPortal(false);
                Alert.alert(
                  t("subscription.portal.success", "Portail ouvert"),
                  t("subscription.portal.message", "Le portail client a été ouvert dans votre navigateur.")
                );
              }}
              onError={(error) => {
                setShowCustomerPortal(false);
                Alert.alert(
                  t("subscription.portal.error", "Erreur"),
                  error
                );
              }}
            />
            <TouchableOpacity
              style={[
                tw`absolute top-4 right-4 w-8 h-8 rounded-full items-center justify-center`,
                { backgroundColor: currentTheme.colors.surface }
              ]}
              onPress={() => setShowCustomerPortal(false)}
            >
              <MaterialCommunityIcons
                name="close"
                size={20}
                color={currentTheme.colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default PricingScreen;
