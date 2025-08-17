import { Alert } from "react-native";
import { AIService } from "../../../services/ai/AIService";
import { AIPrompt, AIGenerationOptions } from "../../../types/ai";
import {
  AIAssistantState,
  PersonalizationState,
  GenerationOptionsState,
} from "../types";
import { detectLanguage } from "../../../utils/languageDetector";
import { useTranslation } from "../../../hooks/useTranslation";

interface UseScriptGenerationParams {
  state: AIAssistantState;
  personalization: PersonalizationState;
  options: GenerationOptionsState;
  setIsLoading: (loading: boolean) => void;
  resetPrompt: () => void;
  setIsVisible: (visible: boolean) => void;
  onScriptGenerated: (title: string, content: string) => void;
}

export function useScriptGeneration({
  state,
  personalization,
  options,
  setIsLoading,
  resetPrompt,
  setIsVisible,
  onScriptGenerated,
}: UseScriptGenerationParams) {
  const { t } = useTranslation();

  const handleGenerateScript = async () => {
    if (!state.prompt.trim()) {
      Alert.alert(
        t("aiAssistant.scriptGeneration.error.title"),
        t("aiAssistant.scriptGeneration.error.enterDescription")
      );
      return;
    }

    setIsLoading(true);
    try {
      // Automatically detect language
      const detectedLanguage = detectLanguage(state.prompt.trim());

      const request: AIPrompt = {
        topic: state.prompt.trim(),
        tone: state.tone,
        duration: state.duration,
        platform: state.platform,
        language: detectedLanguage,
        characterCount: personalization.characterCount,
        paragraphCount: personalization.paragraphCount,
        sentenceLength: personalization.sentenceLength,
        vocabulary: personalization.vocabulary,
        scriptStructure: personalization.scriptStructure,
        includePersonalAnecdotes: personalization.includePersonalAnecdotes,
        includeStatistics: personalization.includeStatistics,
        includeQuestions: personalization.includeQuestions,
        emphasisStyle: personalization.emphasisStyle,
        readingPace: personalization.readingPace,
      };

      const generationOptions: AIGenerationOptions = {
        includeHooks: options.includeHooks,
        includeCallToAction: options.includeCallToAction,
        includeHashtags: options.includeHashtags,
        targetAudience: state.audience,
        customInstructions: options.customInstructions.trim() || undefined,
        formatPreferences: {
          useNumberedPoints: options.useNumberedPoints,
          useBulletPoints: options.useBulletPoints,
          includeTransitions: options.includeTransitions,
          addTimestamps: options.addTimestamps,
        },
        contentStyle: {
          useExamples: options.useExamples,
          includeMetaphors: options.includeMetaphors,
          addEmojis: options.addEmojis,
        },
      };

      const response = await AIService.generateScript(
        request,
        generationOptions
      );

      const wordCountText = personalization.characterCount
        ? t("aiAssistant.scriptGeneration.length.chars", {
            count: personalization.characterCount,
          })
        : state.duration === "short"
        ? t("aiAssistant.scriptGeneration.length.short")
        : state.duration === "medium"
        ? t("aiAssistant.scriptGeneration.length.medium")
        : t("aiAssistant.scriptGeneration.length.long");

      Alert.alert(
        t("aiAssistant.scriptGeneration.success.title"),
        t("aiAssistant.scriptGeneration.success.details", {
          title: response.title,
          length: wordCountText,
          tone: state.tone,
        }),
        [
          {
            text: t("aiAssistant.scriptGeneration.success.cancel"),
            style: "cancel",
          },
          {
            text: t("aiAssistant.scriptGeneration.success.useScript"),
            onPress: () => {
              onScriptGenerated(response.title, response.content);
              setIsVisible(false);
              resetPrompt();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        t("aiAssistant.scriptGeneration.error.title"),
        error instanceof Error
          ? error.message
          : t("aiAssistant.scriptGeneration.error.unknown")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCorrectGrammar = async () => {
    Alert.alert(
      t("aiAssistant.scriptGeneration.info.title"),
      t("aiAssistant.scriptGeneration.info.inDevelopment")
    );
  };

  const handleToneSuggestions = () => {
    Alert.alert(
      t("aiAssistant.scriptGeneration.info.title"),
      t("aiAssistant.scriptGeneration.info.inDevelopment")
    );
  };

  return {
    handleGenerateScript,
    handleCorrectGrammar,
    handleToneSuggestions,
  };
}
