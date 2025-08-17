import React, { useState } from "react";
import { View, TouchableOpacity, Platform } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Layout,
  SlideInRight,
} from "react-native-reanimated";
import LinearGradient from "react-native-linear-gradient";
import tw from "twrnc";

import { UIText } from "../ui/Typography";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { AI_PROVIDERS, saveApiPriorityOrder } from "../../config/aiConfig";
import PriorityOrderModal from "./PriorityOrderModal";

import { createOptimizedLogger } from "../../utils/optimizedLogger";
const logger = createOptimizedLogger("PrioritySection");

interface PrioritySectionProps {
  visible?: boolean;
  priorityOrder: string[];
  setPriorityOrder: (order: string[]) => void;
  useOpenAI: boolean;
  useGemini: boolean;
  useMistral: boolean;
  useCohere: boolean;
  useClaude: boolean;
  usePerplexity: boolean;
  useTogether: boolean;
  useGroq: boolean;
  useFireworks: boolean;
  useAzureOpenAI?: boolean;
  useOpenRouter?: boolean;
  useDeepInfra?: boolean;
  useXAI?: boolean;
  useDeepSeek?: boolean;
}

const PrioritySection: React.FC<PrioritySectionProps> = ({
  visible = true,
  priorityOrder,
  setPriorityOrder,
  useOpenAI,
  useGemini,
  useMistral,
  useCohere,
  useClaude,
  usePerplexity,
  useTogether,
  useGroq,
  useFireworks,
  useAzureOpenAI = false,
  useOpenRouter = false,
  useDeepInfra = false,
  useXAI = false,
  useDeepSeek = false,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  // Animations Reanimated
  const scale = useSharedValue(1);
  const iconRotation = useSharedValue(0);

  React.useEffect(() => {
    iconRotation.value = withSequence(
      withTiming(10, { duration: 200 }),
      withSpring(0, { damping: 12 })
    );
  }, [priorityOrder]);

  // Déplacer les hooks animés avant le return conditionnel
  const priorityCardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const priorityIconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }],
  }));

  if (!visible) return null;

  // Créer le mapping des APIs activées
  const enabledApis = {
    [AI_PROVIDERS.OPENAI]: useOpenAI,
    [AI_PROVIDERS.GEMINI]: useGemini,
    [AI_PROVIDERS.MISTRAL]: useMistral,
    [AI_PROVIDERS.COHERE]: useCohere,
    [AI_PROVIDERS.CLAUDE]: useClaude,
    [AI_PROVIDERS.PERPLEXITY]: usePerplexity,
    [AI_PROVIDERS.TOGETHER]: useTogether,
    [AI_PROVIDERS.GROQ]: useGroq,
    [AI_PROVIDERS.FIREWORKS]: useFireworks,
    [AI_PROVIDERS.AZUREOPENAI]: useAzureOpenAI,
    [AI_PROVIDERS.OPENROUTER]: useOpenRouter,
    [AI_PROVIDERS.DEEPINFRA]: useDeepInfra,
    [AI_PROVIDERS.XAI]: useXAI,
    [AI_PROVIDERS.DEEPSEEK]: useDeepSeek,
  };

  // Fonction pour déplacer une API dans l'ordre de priorité
  const moveApiInPriorityOrder = async (
    apiName: string,
    direction: "up" | "down"
  ) => {
    const currentIndex = priorityOrder.indexOf(apiName);
    if (currentIndex === -1) return;

    const newOrder = [...priorityOrder];
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    // Vérifier les limites
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    // Échanger les positions
    [newOrder[currentIndex], newOrder[targetIndex]] = [
      newOrder[targetIndex],
      newOrder[currentIndex],
    ];

    // Mettre à jour l'état local
    setPriorityOrder(newOrder);

    // Sauvegarder dans AsyncStorage
    try {
      await saveApiPriorityOrder(newOrder);
      logger.debug(
        `✅ API ${apiName} moved ${direction}, new order:`,
        newOrder
      );
    } catch (error) {
      logger.error("❌ Error saving priority order:", error);
    }
  };

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.98, { duration: 100 }),
      withTiming(1, { duration: 150 })
    );
    setShowModal(true);
  };

  return (
    <>
      <Animated.View
        entering={FadeInDown.duration(600).delay(100)}
        layout={Layout.springify()}
        style={tw`mx-3 mb-4`}
      >
        <Animated.View style={priorityCardAnimatedStyle}>
          {/* Carte moderne avec Reanimated */}
          <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.8}
            style={[
              tw`rounded-2xl overflow-hidden`,
              {
                shadowColor: currentTheme.isDark ? "#000" : "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: currentTheme.isDark ? 0.3 : 0.1,
                shadowRadius: 8,
                elevation: 6,
              },
            ]}
          >
            {/* Gradient de fond principal */}
            <LinearGradient
              colors={
                currentTheme.isDark
                  ? ["rgba(40, 40, 50, 0.98)", "rgba(30, 30, 40, 0.98)"]
                  : ["rgba(255, 255, 255, 0.98)", "rgba(248, 248, 252, 0.98)"]
              }
              style={tw`absolute inset-0`}
            />

            {/* Gradient d'accent subtil */}
            <LinearGradient
              colors={["#8b5cf608", "#8b5cf603", "transparent"]}
              style={tw`absolute inset-0`}
            />

            {/* Barre d'accent latérale */}
            <View
              style={[
                tw`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl`,
                { backgroundColor: "#8b5cf6" },
              ]}
            />

            {/* Contenu */}
            <View
              style={tw`p-4 flex-row items-center justify-between min-h-16`}
            >
              <View style={tw`flex-row items-center flex-1`}>
                {/* Icône avec animation */}
                <Animated.View
                  style={[
                    tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                    { backgroundColor: "#8b5cf615" },
                    priorityIconAnimatedStyle,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="sort"
                    size={20}
                    color="#8b5cf6"
                  />
                </Animated.View>

                {/* Texte */}
                <View style={tw`flex-1`}>
                  <UIText
                    size="base"
                    weight="bold"
                    color={currentTheme.colors.text}
                    style={tw`mb-1`}
                    children={t("aiSettings.priorityOrder.title")}
                  />
                  <UIText
                    size="sm"
                    color={currentTheme.colors.textSecondary}
                    style={tw`leading-4`}
                    children={t("aiSettings.priorityOrder.description")}
                  />
                </View>
              </View>

              {/* Indicateur et flèche */}
              <View style={tw`flex-row items-center gap-2`}>
                {/* Badge du nombre d'APIs */}
                <Animated.View
                  entering={SlideInRight.duration(400).delay(200)}
                  style={[
                    tw`px-2 py-1 rounded-full`,
                    { backgroundColor: "#8b5cf615" },
                  ]}
                >
                  <UIText
                    size="xs"
                    weight="bold"
                    color="#8b5cf6"
                    children={priorityOrder.length}
                  />
                </Animated.View>

                {/* Icône de navigation */}
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={currentTheme.colors.textSecondary}
                />
              </View>
            </View>

            {/* Effet de pression visuel */}
            <View
              pointerEvents="none"
              style={[
                tw`absolute inset-0 rounded-2xl`,
                { backgroundColor: "rgba(139, 92, 246, 0.05)" },
              ]}
            />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      <PriorityOrderModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        priorityOrder={priorityOrder}
        moveApiInPriorityOrder={moveApiInPriorityOrder}
        enabledApis={enabledApis}
      />
    </>
  );
};

export default PrioritySection;
