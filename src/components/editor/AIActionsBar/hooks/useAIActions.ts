import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useTranslation } from "../../../../hooks/useTranslation";
import { AIService } from "../../../../services/AIService";
import { RootStackParamList } from "../../../../types";
import { AIPrompt } from "../../../../types/ai";
import { buildCorrectionPrompt } from "../utils/prompts";
import { useAnalyzeAction } from "./useAnalyzeAction";
import { useAPIValidation } from "./useAPIValidation";
import { useImproveAction } from "./useImproveAction";

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface UseAIActionsProps {
  content: string;
  onContentUpdate: (newContent: string) => void;
}

export const useAIActions = ({
  content,
  onContentUpdate,
}: UseAIActionsProps) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const { checkAndEnableAPIs } = useAPIValidation();

  // Utiliser le hook dédié pour l'amélioration
  const { handleImproveSimple, isProcessing: isImproving } = useImproveAction({
    content,
    onContentUpdate,
  });

  // Utiliser le hook dédié pour l'analyse
  const { handleAnalyze: handleAnalyzeAction, isProcessing: isAnalyzing } =
    useAnalyzeAction({ content });

  // Obtenir le texte sélectionné ou tout le contenu
  const getTextToProcess = () => {
    // TODO: Implémenter la sélection de texte si nécessaire
    return content;
  };

  // Fonction pour corriger le texte
  const handleCorrect = useCallback(async () => {
    if (!content.trim()) {
      Alert.alert(t("common.error"), t("ai.error.noTextToCorrect"));
      return;
    }

    // Vérifier les APIs avant de continuer
    const apisReady = await checkAndEnableAPIs();
    if (!apisReady) {
      return;
    }

    setIsProcessing(true);
    setActiveAction("correct");

    try {
      const textToProcess = getTextToProcess();
      const promptText = buildCorrectionPrompt(textToProcess);

      const aiPrompt: AIPrompt = {
        topic: promptText,
        tone: "professional",
        platform: "presentation",
        language: "auto",
        creativity: 0.3,
      };
      const scriptResult = await AIService.generateScript(aiPrompt);

      if (scriptResult && scriptResult.content) {
        onContentUpdate(scriptResult.content);
        Alert.alert(
          t("ai.correction.success"),
          t("ai.correction.successMessage")
        );
      } else {
        throw new Error(t("ai.error.noTextToCorrect"));
      }
    } catch (error: any) {
      Alert.alert(
        t("common.error"),
        error.message || t("ai.error.correctionError")
      );
    } finally {
      setIsProcessing(false);
      setActiveAction(null);
    }
  }, [content, onContentUpdate, checkAndEnableAPIs, t]);

  // Wrapper pour l'amélioration avec gestion de l'état
  const handleImprove = useCallback(async () => {
    setActiveAction("improve");
    await handleImproveSimple();
    setActiveAction(null);
  }, [handleImproveSimple]);

  // Wrapper pour l'analyse avec gestion de l'état
  const handleAnalyze = useCallback(async () => {
    setActiveAction("analyze");
    await handleAnalyzeAction();
    setActiveAction(null);
  }, [handleAnalyzeAction]);

  // Naviguer vers le chat AI avec le contexte
  const handleAIChat = useCallback(async () => {
    navigation.navigate("AIChat", {
      conversationId: undefined,
      initialContext: content,
      returnScreen: "Editor",
    } as any);
  }, [navigation, content]);

  return {
    isProcessing: isProcessing || isImproving || isAnalyzing,
    activeAction,
    handleCorrect,
    handleImprove,
    handleAnalyze,
    handleAIChat,
  };
};
