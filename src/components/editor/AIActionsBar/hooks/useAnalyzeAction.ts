import { useCallback, useState } from "react";
import { Alert, Clipboard } from "react-native";
import { useTranslation } from "../../../../hooks/useTranslation";
import { AIService } from "../../../../services/AIService";
import { AIPrompt } from "../../../../types/ai";
import { detectLanguage } from "../../../../utils/languageDetector";
import { useAPIValidation } from "./useAPIValidation";

interface UseAnalyzeActionProps {
  content: string;
}

interface AnalysisResult {
  tone: string;
  strengths: string[];
  suggestions: string[];
  targetAudience: string;
  readingTime: string;
  wordCount: number;
  complexity: string;
}

export const useAnalyzeAction = ({ content }: UseAnalyzeActionProps) => {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const { checkAndEnableAPIs } = useAPIValidation();

  const buildDetailedAnalysisPrompt = (
    text: string,
    detectedLanguage: string
  ): string => {
    const prompts: Record<string, string> = {
      fr: `Analyse ce texte français et réponds UNIQUEMENT avec le format structuré ci-dessous. NE RÉPÈTE PAS le texte original dans ta réponse.

📊 TON UTILISÉ :
[Décris le ton principal du texte en une phrase]

🔍 ERREURS DÉTECTÉES :
- Orthographe : [nombre exact] erreur(s)
- Grammaire : [nombre exact] erreur(s)
- Ponctuation : [nombre exact] erreur(s)
- Exemples d'erreurs : [liste 2-3 erreurs spécifiques si trouvées]

💪 POINTS FORTS :
- [Point fort 1]
- [Point fort 2]
- [Point fort 3]

💡 SUGGESTIONS D'AMÉLIORATION :
- [Suggestion 1]
- [Suggestion 2]
- [Suggestion 3]

🎯 PUBLIC CIBLE :
[Identifie l'audience visée]

📈 STATISTIQUES :
- Nombre de mots : [compte exact]
- Temps de lecture : [X] minutes
- Niveau de complexité : [Simple/Moyen/Complexe]

RÈGLES IMPORTANTES :
- Réponds SEULEMENT avec l'analyse formatée
- NE répète PAS le texte original
- NE répète PAS ces instructions
- Sois précis dans le comptage des erreurs

Texte à analyser :
${text}`,

      en: `Analyze this English text and respond ONLY with the structured format below. DO NOT repeat the original text in your response.

📊 TONE USED:
[Describe the main tone in one sentence]

🔍 ERRORS DETECTED:
- Spelling: [exact count] error(s)
- Grammar: [exact count] error(s)
- Punctuation: [exact count] error(s)
- Error examples: [list 2-3 specific errors if found]

💪 STRONG POINTS:
- [Strong point 1]
- [Strong point 2]
- [Strong point 3]

💡 IMPROVEMENT SUGGESTIONS:
- [Suggestion 1]
- [Suggestion 2]
- [Suggestion 3]

🎯 TARGET AUDIENCE:
[Identify the intended audience]

📈 STATISTICS:
- Word count: [exact count]
- Reading time: [X] minutes
- Complexity level: [Simple/Medium/Complex]

IMPORTANT RULES:
- Respond ONLY with the formatted analysis
- DO NOT repeat the original text
- DO NOT repeat these instructions
- Be precise in error counting

Text to analyze:
${text}`,
    };

    return prompts[detectedLanguage] || prompts.en;
  };

  const parseAnalysisResponse = (response: string): string => {
    // Étapes :
    // 1. Supprimer toute partie contenant les instructions ou le texte original.
    // 2. Conserver uniquement les sections d'analyse et leurs contenus.

    // --- 1. Nettoyage initial ---
    let cleanResponse = response.trim();

    // Retirer les blocs après des indicateurs connus (instructions, texte original)
    const cutIndicators = [
      "Texte à analyser",
      "Text to analyze",
      "RÈGLES IMPORTANTES",
      "IMPORTANT RULES",
    ];

    cutIndicators.forEach((indicator) => {
      const idx = cleanResponse.indexOf(indicator);
      if (idx !== -1) {
        cleanResponse = cleanResponse.substring(0, idx).trim();
      }
    });

    // Découper en lignes et itérer
    const rawLines = cleanResponse.split(/\r?\n/).map((l) => l.trim());
    const keptLines: string[] = [];
    let insideSection = false; // indique si nous sommes après un en-tête

    const headerRegex = /^[📊🔍💪💡🎯📈]/;

    const isInstructionLine = (line: string): boolean => {
      const lower = line.toLowerCase();
      return (
        lower.includes("voici le script") ||
        lower.includes("script :") ||
        lower.includes("(intro") ||
        lower.includes("(transition") ||
        lower.includes("(conclusion") ||
        lower.includes("image :") ||
        lower.startsWith("**")
      );
    };

    // Fonction utilitaire pour détecter si une ligne contient du texte original
    const containsOriginalText = (
      line: string,
      originalText: string
    ): boolean => {
      if (!originalText || originalText.length < 10) return false;
      const originalSnippet = originalText
        .split(" ")
        .slice(0, 8)
        .join(" ")
        .toLowerCase();
      if (originalSnippet.length < 20) return false;
      return line.toLowerCase().includes(originalSnippet);
    };

    for (const line of rawLines) {
      const trimmed = line.trim();
      if (!trimmed) continue; // sauter lignes vides

      // Supprimer si c'est du texte original ou trop long
      if (trimmed.length > 200) continue;
      if (trimmed.startsWith("#") || isInstructionLine(trimmed)) continue;
      if (containsOriginalText(trimmed, content)) continue;

      // Détection des en-têtes de section
      if (headerRegex.test(trimmed)) {
        keptLines.push(trimmed);
        insideSection = true;
        continue;
      }

      // Garder les points de liste
      if (trimmed.startsWith("-") || trimmed.startsWith("•")) {
        keptLines.push(trimmed);
        continue;
      }

      // Garder les lignes de contenu situées dans une section
      if (insideSection && trimmed.length <= 150) {
        keptLines.push(trimmed);
        continue;
      }
    }

    // Consolidation finale
    return keptLines
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const handleAnalyze = useCallback(async () => {
    if (!content.trim()) {
      Alert.alert(t("common.error"), t("ai.error.noTextToCorrect"));
      return;
    }

    const apisReady = await checkAndEnableAPIs();
    if (!apisReady) {
      return;
    }

    setIsProcessing(true);

    try {
      const detectedLanguage = detectLanguage(content);

      const promptText = buildDetailedAnalysisPrompt(content, detectedLanguage);

      const aiPrompt: AIPrompt = {
        topic: promptText,
        tone: "professional",
        platform: "presentation",
        duration: "medium",
        language: detectedLanguage,
        creativity: 0.3, // Faible créativité pour une analyse factuelle
      };

      const result = await AIService.generateScript(aiPrompt);

      if (result && result.content) {
        const formattedAnalysis = parseAnalysisResponse(result.content);

        // Afficher dans un Alert avec un titre approprié
        Alert.alert(
          `📊 ${t("ai.analysis.title")}`,
          formattedAnalysis,
          [
            {
              text: t("common.ok"),
              style: "default",
            },
            {
              text: t("common.copy"),
              onPress: () => {
                Clipboard.setString(formattedAnalysis);
              },
            },
          ],
          { cancelable: true }
        );
      } else {
        throw new Error(t("ai.error.analysisError"));
      }
    } catch (error: any) {
      Alert.alert(
        t("common.error"),
        error.message || t("ai.error.analysisError")
      );
    } finally {
      setIsProcessing(false);
    }
  }, [content, checkAndEnableAPIs, t]);

  return {
    isProcessing,
    handleAnalyze,
  };
};
