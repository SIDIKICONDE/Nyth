import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Alert } from "react-native";
import {
  DEFAULT_GENERATION_OPTIONS,
  secondsToDurationType,
} from "../../../config/aiConfig";
import { useScripts } from "../../../contexts/ScriptsContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { AIService } from "../../../services/ai/AIService";
import { RootStackParamList } from "../../../types";
import { getSystemLanguage } from "../../../utils/languageDetector";
import { PlatformType, ToneType } from "../types";

type AIGeneratorScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AIGenerator"
>;

export const useScriptGeneration = () => {
  const navigation = useNavigation<AIGeneratorScreenNavigationProp>();
  const { t } = useTranslation();
  const { addScript } = useScripts();

  const handleGenerate = async (
    topic: string,
    selectedPlatform: string,
    tone: string,
    duration: number,
    creativity: number,
    maxCharacters: number,
    setIsLoading: (loading: boolean) => void
  ) => {
    if (topic.trim().length === 0) {
      Alert.alert(t("common.error"), t("aiGenerator.error.noTopic"));
      return;
    }

    setIsLoading(true);

    try {
      // Convertir la durée en secondes en type de durée (short/medium/long)
      const durationType = secondsToDurationType(duration);

      // Utiliser la langue du système au lieu de détecter la langue du topic
      const systemLanguage = await getSystemLanguage();

      const result = await AIService.generateScript(
        {
          topic: topic.trim(),
          platform: selectedPlatform as PlatformType,
          tone: tone as ToneType,
          duration: durationType,
          language: systemLanguage,
          creativity: creativity,
          characterCount: maxCharacters,
        },
        DEFAULT_GENERATION_OPTIONS
      );

      // Créer et sauvegarder le script généré avec le contexte
      try {
        const newScriptData = {
          title: result.title,
          content: result.content,
          isAIGenerated: true,
          aiPrompt: {
            topic: topic.trim(),
            platform: selectedPlatform as PlatformType,
            tone: tone as ToneType,
            duration: durationType,
            language: systemLanguage,
            creativity: creativity,
            characterCount: maxCharacters,
          },
          estimatedDuration: duration,
        };

        // Utiliser addScript du contexte qui retourne l'ID du script créé
        const scriptId = await addScript(newScriptData);

        if (scriptId) {
          // Naviguer vers l'éditeur avec le script créé
          navigation.navigate("Editor", { scriptId });
        } else {
          throw new Error(t("aiGenerator.error.saveError"));
        }
      } catch (saveError) {
        Alert.alert(t("common.error"), t("aiGenerator.error.saveError"));
      }
    } catch (error) {
      // Afficher le message d'erreur détaillé si disponible
      let errorMessage = t("aiGenerator.error.generationError");
      if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }

      Alert.alert(t("common.error"), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { handleGenerate };
};
