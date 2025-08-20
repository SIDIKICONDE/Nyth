import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Switch,
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
import { SUBSCRIPTION_PLANS } from "../../constants/subscriptionPlans";
import { RootStackParamList } from "../../types/navigation";


type NavigationProp = StackNavigationProp<RootStackParamList>;

const PricingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { getOptimizedButtonColors } = useContrastOptimization();
  const { currentPlan, upgradePlan, isLoading } =
    useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<string>(currentPlan.id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isYearlyPlan, setIsYearlyPlan] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const scrollRef = useRef<ScrollView>(null);
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const cardWidth = screenWidth * 0.82;
  const cardMargin = 12;

  // Animation d'entrée
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (cardWidth + 2 * cardMargin));
    setCurrentIndex(index);
  };

  const handleSelectPlan = async (planId: string) => {
    if (planId === currentPlan.id) {
      Alert.alert(
        t("subscription.alreadyOnPlan.title", "Déjà abonné"),
        t("subscription.alreadyOnPlan.message", "Vous êtes déjà sur ce plan.")
      );
      return;
    }

    setSelectedPlan(planId);

    // Confirmation pour tous les changements de plan
    const confirmTitle = planId === "free" 
      ? t("subscription.confirmDowngrade.title", "Confirmer le changement")
      : t("subscription.confirmUpgrade.title", "Confirmer le changement");
    
    const confirmMessage = planId === "free"
      ? t(
          "subscription.confirmDowngrade.message",
          "Voulez-vous passer au plan gratuit ? Vous perdrez l'accès aux fonctionnalités premium."
        )
      : t(
          "subscription.confirmUpgrade.message",
          `Voulez-vous passer au plan ${SUBSCRIPTION_PLANS[planId].displayName} ?`
        );

    Alert.alert(
      confirmTitle,
      confirmMessage,
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
  };

  const performUpgrade = async (planId: string) => {
    setIsProcessing(true);
    try {
      const success = await upgradePlan(planId, isYearlyPlan);
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



  const renderPlanCard = (
    plan: (typeof SUBSCRIPTION_PLANS)[keyof typeof SUBSCRIPTION_PLANS],
    index: number
  ) => {
    const isCurrentPlan = plan.id === currentPlan.id;
    const isSelected = plan.id === selectedPlan;
    const isPopular = plan.popular;

    // Dégradés dynamiques selon le plan
    const gradientColors = isCurrentPlan
      ? [plan.color, `${plan.color}CC`, `${plan.color}99`]
      : [`${plan.color}15`, `${plan.color}08`, "transparent"];

    return (
      <Animated.View
        style={[
          {
            width: cardWidth,
            marginHorizontal: cardMargin,
            transform: [
              { scale: currentIndex === index ? 1 : 0.95 },
            ],
            opacity: currentIndex === index ? 1 : 0.7,
          },
        ]}
      >
        <TouchableOpacity
          key={plan.id}
          onPress={() => handleSelectPlan(plan.id)}
          disabled={isProcessing}
          activeOpacity={0.8}
          style={[
            tw`rounded-3xl overflow-hidden shadow-lg`,
            {
              shadowColor: plan.color,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isCurrentPlan ? 0.3 : 0.15,
              shadowRadius: 16,
              elevation: isCurrentPlan ? 12 : 8,
              borderWidth: isCurrentPlan ? 3 : 1,
              borderColor: isCurrentPlan ? plan.color : currentTheme.colors.border,
              opacity: isProcessing ? 0.7 : 1,
            },
          ]}
        >
          {/* Badge Populaire */}
          {isPopular && (
            <View
              style={[
                tw`absolute top-0 right-0 z-20`,
              ]}
            >
              <LinearGradient
                colors={[plan.color, `${plan.color}DD`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={tw`px-4 py-2 rounded-bl-2xl rounded-tr-3xl`}
              >
                <View style={tw`flex-row items-center`}>
                  <MaterialCommunityIcons
                    name="crown"
                    size={14}
                    color="#fff"
                  />
                  <Text style={tw`text-white text-xs font-bold ml-1`}>
                    {t("subscription.popular", "Populaire")}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Badge Plan Actuel */}
          {isCurrentPlan && (
            <View
              style={[
                tw`absolute top-2 left-4 px-3 py-1 rounded-full z-10`,
                { backgroundColor: `${plan.color}EE` },
              ]}
            >
              <Text style={tw`text-white text-xs font-bold`}>
                {t("subscription.current", "Actuel")}
              </Text>
            </View>
          )}

          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[tw`p-6 h-full`]}
          >
            {/* Header avec nom et description */}
            <View style={tw`mb-6`}>
              <View style={tw`flex-row items-center mb-2`}>
                <View
                  style={[
                    tw`w-3 h-3 rounded-full mr-2`,
                    { backgroundColor: plan.color },
                  ]}
                />
                <Text
                  style={[
                    tw`text-2xl font-bold`,
                    { color: currentTheme.colors.text },
                  ]}
                >
                  {plan.displayName}
                </Text>
              </View>
              <Text
                style={[
                  tw`text-sm leading-5`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                {plan.description}
              </Text>
            </View>

            {/* Prix */}
            <View style={tw`mb-6`}>
              <View style={tw`flex-row items-baseline`}>
                <Text
                  style={[
                    tw`text-4xl font-bold`,
                    { color: plan.color },
                  ]}
                >
                  {plan.price === 0
                    ? t("subscription.free", "Gratuit")
                    : isYearlyPlan && plan.price > 0
                    ? `${Math.round(plan.price * 12 * 0.8)}`
                    : `${plan.price}`}
                </Text>
                {plan.price > 0 && (
                  <Text
                    style={[
                      tw`text-lg font-medium ml-1`,
                      { color: currentTheme.colors.textSecondary },
                    ]}
                  >
                    €
                  </Text>
                )}
              </View>
              {plan.price > 0 && (
                <Text
                  style={[
                    tw`text-sm`,
                    { color: currentTheme.colors.textSecondary },
                  ]}
                >
                  /{t(`subscription.period.${isYearlyPlan ? "yearly" : plan.period}`, isYearlyPlan ? "an" : "mois")}
                </Text>
              )}
              {isYearlyPlan && plan.price > 0 && (
                <View style={tw`flex-row items-center mt-2`}>
                  <MaterialCommunityIcons
                    name="gift"
                    size={16}
                    color={currentTheme.colors.success}
                  />
                  <Text
                    style={[
                      tw`text-sm font-medium ml-2`,
                      { color: currentTheme.colors.success },
                    ]}
                  >
                    {t("subscription.save", "Économisez 20%")}
                  </Text>
                </View>
              )}
            </View>

            {/* Limites et fonctionnalités */}
            <View style={tw`flex-1`}>
              {/* Limites de génération */}
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
                        tw`ml-3 text-sm`,
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
                        tw`ml-3 text-sm`,
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
                          tw`ml-3 text-sm font-medium`,
                          { color: plan.color },
                        ]}
                      >
                        {t("subscription.unlimited", "Générations illimitées")}
                      </Text>
                    </View>
                  )}
              </View>

              {/* Fonctionnalités */}
              <View style={tw`flex-1`}>
                {plan.limits.features.slice(0, 3).map((feature, index) => (
                  <View key={index} style={tw`flex-row items-start mb-3`}>
                    <View
                      style={[
                        tw`w-5 h-5 rounded-full items-center justify-center mt-0.5`,
                        { backgroundColor: `${plan.color}20` },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="check"
                        size={12}
                        color={plan.color}
                      />
                    </View>
                    <Text
                      style={[
                        tw`ml-3 text-sm flex-1 leading-5`,
                        { color: currentTheme.colors.text },
                      ]}
                    >
                      {feature}
                    </Text>
                  </View>
                ))}
                {plan.limits.features.length > 3 && (
                  <Text
                    style={[
                      tw`text-xs mt-2`,
                      { color: currentTheme.colors.textSecondary },
                    ]}
                  >
                    +{plan.limits.features.length - 3} {t("subscription.moreFeatures", "autres fonctionnalités")}
                  </Text>
                )}
              </View>
            </View>

            {/* Bouton d'action */}
            {!isCurrentPlan && (
              <TouchableOpacity
                onPress={() => handleSelectPlan(plan.id)}
                disabled={isProcessing}
                style={tw`mt-6`}
              >
                <LinearGradient
                  colors={isSelected ? [plan.color, `${plan.color}DD`] : [`${plan.color}20`, `${plan.color}10`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={tw`py-4 rounded-2xl items-center border-2`}
                >
                  {isProcessing && isSelected ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text
                      style={[
                        tw`font-bold text-base`,
                        {
                          color: isSelected ? "#fff" : plan.color,
                        },
                      ]}
                    >
                      {isSelected
                        ? t("subscription.selected", "Sélectionné")
                        : t("subscription.selectPlan", "Choisir ce plan")}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderPaginationDots = () => {
    const plans = Object.values(SUBSCRIPTION_PLANS);
    const currentPlanData = plans[currentIndex];

    return (
      <View style={tw`mt-6 mb-4`}>
        {/* Indicateurs de progression */}
        <View style={tw`flex-row justify-center mb-3`}>
          {plans.map((plan, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                setCurrentIndex(index);
                scrollRef.current?.scrollTo({
                  x: index * (cardWidth + 2 * cardMargin),
                  animated: true,
                });
              }}
              style={tw`mx-2`}
            >
              <LinearGradient
                colors={
                  currentIndex === index
                    ? [plan.color, `${plan.color}DD`]
                    : [`${currentTheme.colors.border}40`, `${currentTheme.colors.border}20`]
                }
                style={[
                  tw`rounded-full`,
                  {
                    width: currentIndex === index ? 32 : 12,
                    height: 12,
                  },
                ]}
              >
                {currentIndex === index && (
                  <View style={tw`w-full h-full rounded-full items-center justify-center`}>
                    <MaterialCommunityIcons
                      name="check"
                      size={16}
                      color="#fff"
                    />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nom du plan actuel */}
        <View style={tw`items-center`}>
          <Text
            style={[
              tw`text-sm font-medium`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {currentPlanData?.displayName}
          </Text>
          <Text
            style={[
              tw`text-xs mt-1`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {t("subscription.swipeToExplore", "Glissez pour explorer les autres plans")}
          </Text>
        </View>
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
        <Animated.View
          style={[
            tw`p-6`,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {/* Header avec titre et description */}
          <View style={tw`mb-8`}>
            <Text
              style={[
                tw`text-3xl font-bold mb-3 text-center`,
                { color: currentTheme.colors.text },
              ]}
            >
              {t("subscription.chooseYourPlan", "Choisissez votre plan")}
            </Text>
            <Text
              style={[
                tw`text-lg text-center leading-6`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {t("subscription.subtitle", "Débloquez tout le potentiel de l'IA avec des plans adaptés à vos besoins")}
            </Text>
          </View>

          {/* Switch pour plan annuel avec design amélioré */}
          <View style={[
            tw`flex-row items-center justify-between p-5 rounded-2xl mb-6 shadow-md`,
            {
              backgroundColor: currentTheme.colors.surface,
              shadowColor: currentTheme.colors.text,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }
          ]}>
            <View style={tw`flex-1 mr-4`}>
              <View style={tw`flex-row items-center mb-1`}>
                <MaterialCommunityIcons
                  name="calendar-star"
                  size={20}
                  color={currentTheme.colors.primary}
                />
                <Text
                  style={[
                    tw`font-bold text-base ml-2`,
                    { color: currentTheme.colors.text }
                  ]}
                >
                  {t("subscription.yearlyPlan", "Plan annuel")}
                </Text>
              </View>
              <Text
                style={[
                  tw`text-sm`,
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
              thumbColor={isYearlyPlan ? "#fff" : "#f4f3f4"}
              ios_backgroundColor={currentTheme.colors.border}
              style={{ transform: [{ scale: 1.1 }] }}
            />
          </View>
        </Animated.View>

        {/* Slider horizontal des plans avec animations */}
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
          style={tw`flex-1`}
        >
          {Object.values(SUBSCRIPTION_PLANS).map((plan, index) => renderPlanCard(plan, index))}
        </ScrollView>

        {/* Indicateurs de pagination améliorés */}
        {renderPaginationDots()}

        {/* Section disclaimer avec design amélioré */}
        <View
          style={[
            tw`mx-6 mt-6 mb-8 p-5 rounded-2xl`,
            {
              backgroundColor: currentTheme.colors.surface,
              shadowColor: currentTheme.colors.text,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            },
          ]}
        >
          <View style={tw`flex-row items-start mb-3`}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={currentTheme.colors.textSecondary}
              style={tw`mt-0.5`}
            />
            <Text
              style={[
                tw`text-sm ml-3 leading-5`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {t(
                "subscription.disclaimer",
                "Vous pouvez annuler votre abonnement à tout moment. Les utilisateurs avec leurs propres clés API peuvent continuer à les utiliser gratuitement."
              )}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              tw`mt-3 py-3 px-4 rounded-xl border`,
              {
                borderColor: currentTheme.colors.border,
                backgroundColor: `${currentTheme.colors.primary}10`,
              },
            ]}
          >
            <Text
              style={[
                tw`text-sm font-medium text-center`,
                { color: currentTheme.colors.primary },
              ]}
            >
              {t("subscription.needHelp", "Besoin d'aide pour choisir ?")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default PricingScreen;
