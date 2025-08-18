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

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (cardWidth + 2 * cardMargin));
    setCurrentIndex(index);
  };

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
    plan: (typeof SUBSCRIPTION_PLANS)[keyof typeof SUBSCRIPTION_PLANS],
    index: number
  ) => {
    const isCurrentPlan = plan.id === currentPlan.id;
    const isSelected = plan.id === selectedPlan;

    return (
      <TouchableOpacity
        key={plan.id}
        onPress={() => handleSelectPlan(plan.id)}
        disabled={isProcessing}
        style={[
          tw`rounded-2xl overflow-hidden`,
          {
            width: cardWidth,
            marginHorizontal: cardMargin,
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
          style={tw`p-5 h-full`}
        >
          <View style={tw`flex-row justify-between items-start mb-3`}>
            <View style={tw`flex-1`}>
              <Text
                style={[
                  tw`text-xl font-bold mb-1`,
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

          <View style={tw`mb-3`}>
            <Text style={[tw`text-2xl font-bold`, { color: plan.color }]}>
              {plan.price === 0
                ? t("subscription.free", "Gratuit")
                : isYearlyPlan && plan.price > 0
                ? `${Math.round(plan.price * 12 * 0.8)}€`
                : `${plan.price}€`}
              {plan.price > 0 && (
                <Text
                  style={[
                    tw`text-sm font-normal`,
                    { color: currentTheme.colors.textSecondary },
                  ]}
                >
                  /{t(`subscription.period.${isYearlyPlan ? "yearly" : plan.period}`, isYearlyPlan ? "an" : "mois")}
                </Text>
              )}
            </Text>
            {isYearlyPlan && plan.price > 0 && (
              <Text style={[tw`text-xs`, { color: currentTheme.colors.success }]}>
                {t("subscription.save", "Économisez 20%")}
              </Text>
            )}
          </View>

          <View style={tw`mb-3`}>
            {plan.limits.dailyGenerations && (
              <View style={tw`flex-row items-center mb-2`}>
                <MaterialCommunityIcons
                  name="calendar-today"
                  size={14}
                  color={currentTheme.colors.textSecondary}
                />
                <Text
                  style={[
                    tw`ml-2 text-xs`,
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
                  size={14}
                  color={currentTheme.colors.textSecondary}
                />
                <Text
                  style={[
                    tw`ml-2 text-xs`,
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
                  size={14}
                  color={plan.color}
                />
                  <Text
                    style={[
                      tw`ml-2 text-xs font-medium`,
                      { color: plan.color },
                    ]}
                  >
                    {t("subscription.unlimited", "Générations illimitées")}
                  </Text>
                </View>
              )}
          </View>

          <View style={tw`flex-1`}>
            {plan.limits.features.slice(0, 4).map((feature, index) => (
              <View key={index} style={tw`flex-row items-start mb-1.5`}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={14}
                  color={plan.color}
                  style={tw`mt-0.5`}
                />
                <Text
                  style={[
                    tw`ml-2 text-xs flex-1`,
                    { color: currentTheme.colors.text },
                  ]}
                >
                  {feature}
                </Text>
              </View>
            ))}
            {plan.limits.features.length > 4 && (
              <Text
                style={[
                  tw`text-xs mt-1`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                +{plan.limits.features.length - 4} {t("subscription.moreFeatures", "autres fonctionnalités")}
              </Text>
            )}
          </View>

          {!isCurrentPlan && (
            <TouchableOpacity
              onPress={() => handleSelectPlan(plan.id)}
              disabled={isProcessing}
              style={[
                tw`mt-3 py-2.5 rounded-lg items-center`,
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
                    tw`font-semibold text-sm`,
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

  const renderPaginationDots = () => {
    const plans = Object.values(SUBSCRIPTION_PLANS);
    return (
      <View style={tw`flex-row justify-center mt-4 mb-2`}>
        {plans.map((_, index) => (
          <View
            key={index}
            style={[
              tw`mx-1 rounded-full`,
              {
                width: currentIndex === index ? 20 : 8,
                height: 8,
                backgroundColor: currentIndex === index 
                  ? currentTheme.colors.primary 
                  : currentTheme.colors.border,
              },
            ]}
          />
        ))}
      </View>
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
        showsVerticalScrollIndicator={false}
      >
        <View style={tw`p-4`}>
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

          {/* Switch pour plan annuel */}
          {isStripeConfigured() && (
            <View style={[
              tw`flex-row items-center justify-between p-4 rounded-lg mb-4`,
              { backgroundColor: currentTheme.colors.surface }
            ]}>
              <View style={tw`flex-1`}>
                <Text
                  style={[
                    tw`font-medium`,
                    { color: currentTheme.colors.text }
                  ]}
                >
                  {t("subscription.yearlyPlan", "Plan annuel")}
                </Text>
                <Text
                  style={[
                    tw`text-xs`,
                    { color: currentTheme.colors.success }
                  ]}
                >
                  {t("subscription.yearlyDiscount", "Économisez 20% avec un paiement annuel")}
                </Text>
              </View>
              <Switch
                value={isYearlyPlan}
                onValueChange={setIsYearlyPlan}
                trackColor={{ 
                  false: currentTheme.colors.border, 
                  true: currentTheme.colors.primary 
                }}
                thumbColor={isYearlyPlan ? getOptimizedButtonColors().text : "#f4f3f4"}
                ios_backgroundColor={currentTheme.colors.border}
              />
            </View>
          )}
        </View>

        {/* Slider horizontal des plans */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingHorizontal: (screenWidth - cardWidth) / 2,
          }}
          snapToInterval={cardWidth + 2 * cardMargin}
          decelerationRate="fast"
        >
          {Object.values(SUBSCRIPTION_PLANS).map((plan, index) => renderPlanCard(plan, index))}
        </ScrollView>

        {/* Indicateurs de pagination */}
        {renderPaginationDots()}

        <View
          style={[
            tw`mx-4 mt-4 mb-6 p-4 rounded-lg`,
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
              priceId={getStripePriceId(checkoutPlanId, isYearlyPlan ? "yearly" : "monthly")}
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
