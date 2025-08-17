import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useSubscription } from "../contexts/SubscriptionContext";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "./useTranslation";
import { AIService } from "../services/ai/AIService";
import { ManagedAPIService } from "../services/subscription";
import { RootStackParamList } from "../types/navigation";
import { createLogger } from "../utils/optimizedLogger";

const logger = createLogger("useAIWithSubscription");

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const useAIWithSubscription = () => {
  const navigation = useNavigation<NavigationProp>();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const {
    currentPlan,
    checkUsageLimit,
    incrementUsage,
    getRemainingGenerations,
    isManaged,
  } = useSubscription();

  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Vérifie si l'utilisateur peut générer
   */
  const canGenerate = useCallback((): boolean => {
    // Si l'utilisateur a ses propres clés, pas de limite
    if (!isManaged) {
      return true;
    }

    // Vérifier les limites du plan
    return checkUsageLimit();
  }, [isManaged, checkUsageLimit]);

  /**
   * Affiche une alerte si l'utilisateur a atteint sa limite
   */
  const showLimitAlert = useCallback(() => {
    const remaining = getRemainingGenerations();

    Alert.alert(
      t("subscription.limitReached.title", "Limite atteinte"),
      t(
        "subscription.limitReached.message",
        remaining.daily !== undefined
          ? "Vous avez atteint votre limite quotidienne de générations."
          : "Vous avez atteint votre limite mensuelle de générations."
      ),
      [
        {
          text: t("common.cancel", "Annuler"),
          style: "cancel",
        },
        {
          text: t("subscription.viewPlans", "Voir les plans"),
          onPress: () => navigation.navigate("Pricing"),
        },
        {
          text: t("subscription.tryFreeTrial", "Essai gratuit"),
          onPress: () => navigation.navigate("Pricing"),
        },
      ]
    );
  }, [getRemainingGenerations, t, navigation]);

  /**
   * Génère un script avec gestion des limites
   */
  const generateScript = useCallback(
    async (prompt: any, options?: any): Promise<any> => {
      try {
        // Vérifier si l'utilisateur peut générer
        if (!canGenerate()) {
          showLimitAlert();
          return null;
        }

        setIsGenerating(true);

        let result;

        // Si l'utilisateur utilise le système managé
        if (isManaged) {
          // Utiliser ManagedAPIService
          const apiResult = await ManagedAPIService.makeAPICall({
            provider: "gemini", // Par défaut, utiliser Gemini
            prompt: typeof prompt === "string" ? prompt : prompt.content,
            userId: currentUser?.uid || "anonymous",
            planId: currentPlan.id,
          });

          // Formater la réponse pour correspondre à AIServiceResponse
          result = {
            content:
              apiResult.data?.candidates?.[0]?.content?.parts?.[0]?.text || "",
            provider: "gemini",
            model: "gemini-pro",
            usage: {
              promptTokens: 0,
              completionTokens: 0,
              totalTokens: 0,
            },
          };

          // Incrémenter l'usage
          await incrementUsage();
        } else {
          // Utiliser AIService avec les clés de l'utilisateur
          result = await AIService.generateScript(prompt, options);
        }

        return result;
      } catch (error) {
        logger.error("Error generating script:", error);

        Alert.alert(
          t("common.error", "Erreur"),
          t(
            "ai.generationError",
            "Une erreur est survenue lors de la génération."
          )
        );

        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [
      canGenerate,
      showLimitAlert,
      isManaged,
      currentUser,
      currentPlan,
      incrementUsage,
      t,
    ]
  );

  /**
   * Chat avec l'IA avec gestion des limites
   */
  const chatWithAI = useCallback(
    async (
      prompt: string,
      previousMessages?: any[]
    ): Promise<string | null> => {
      try {
        // Vérifier si l'utilisateur peut générer
        if (!canGenerate()) {
          showLimitAlert();
          return null;
        }

        setIsGenerating(true);

        let result;

        // Si l'utilisateur utilise le système managé
        if (isManaged) {
          // Utiliser ManagedAPIService
          const apiResult = await ManagedAPIService.makeAPICall({
            provider: "gemini",
            prompt,
            userId: currentUser?.uid || "anonymous",
            planId: currentPlan.id,
          });

          result =
            apiResult.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

          // Incrémenter l'usage
          await incrementUsage();
        } else {
          // Utiliser AIService avec les clés de l'utilisateur
          result = await AIService.simpleChatWithAI(prompt, previousMessages);
        }

        return result;
      } catch (error) {
        logger.error("Error in AI chat:", error);

        Alert.alert(
          t("common.error", "Erreur"),
          t("ai.chatError", "Une erreur est survenue lors de la conversation.")
        );

        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [
      canGenerate,
      showLimitAlert,
      isManaged,
      currentUser,
      currentPlan,
      incrementUsage,
      t,
    ]
  );

  return {
    generateScript,
    chatWithAI,
    canGenerate,
    isGenerating,
    isManaged,
    currentPlan,
    getRemainingGenerations,
  };
};
