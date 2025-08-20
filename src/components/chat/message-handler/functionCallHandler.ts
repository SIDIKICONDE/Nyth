/**
 * @fileoverview Gestionnaire des appels de fonction
 * Traite les appels de fonction générés par l'IA
 */

import {
  processCreateEvent,
  processCreateGoal,
  processDeleteEvent,
  processUpdateEvent,
} from "@/services/ai/tools/planningToolsProcessor";
import { createLogger } from "@/utils/optimizedLogger";
import { PlanningCommandResult } from "./types";
import { ThemeGenerationService } from "@/services/ai/theme/ThemeGenerationService";
import { themeStorage } from "@/utils/themeStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const logger = createLogger("FunctionCallHandler");

/**
 * Traite les appels de fonction de l'IA
 */
export async function processFunctionCall(
  functionName: string,
  functionArgs: any,
  userId: string,
  userLanguage: string = "fr"
): Promise<PlanningCommandResult> {
  logger.info(`Traitement de la fonction: ${functionName}`, {
    args: functionArgs,
  });

  try {
    // Confirmation simple pour les actions thèmes également
    if (functionName === "createTheme") {
      if (functionArgs && functionArgs.__confirm !== true) {
        const msg =
          userLanguage === "fr"
            ? `Voulez-vous créer et appliquer ce thème maintenant ? Répondez: oui`
            : `Do you want to create and apply this theme now? Reply: yes`;
        return { success: false, message: msg } as PlanningCommandResult;
      }
    }

    // Demander confirmation simple pour les actions impactantes
    const needsConfirmation = [
      "createEvent",
      "updateEvent",
      "deleteEvent",
      "createGoal",
    ].includes(functionName);

    if (needsConfirmation && functionArgs && functionArgs.__confirm !== true) {
      const msg =
        userLanguage === "fr"
          ? `Confirmez-vous l'action "${functionName}" ? Répondez: oui pour exécuter.`
          : `Do you confirm the action "${functionName}"? Reply: yes to proceed.`;
      return { success: false, message: msg } as PlanningCommandResult;
    }
    const resumePrompt = (lang: string) =>
      lang === "fr"
        ? "🔄 Souhaitez-vous reprendre notre discussion initiale ?"
        : "🔄 Would you like to resume our previous discussion?";

    switch (functionName) {
      case "createEvent": {
        const r = await processCreateEvent(functionArgs, userId, userLanguage);
        if (r.success) {
          r.message = `${r.message}\n\n${resumePrompt(userLanguage)}`;
        }
        return r;
      }

      case "updateEvent":
        return await processUpdateEvent(functionArgs, userId, userLanguage);

      case "deleteEvent":
        return await processDeleteEvent(functionArgs, userId, userLanguage);

      case "createGoal": {
        const r = await processCreateGoal(functionArgs, userId, userLanguage);
        if (r.success) {
          r.message = `${r.message}\n\n${resumePrompt(userLanguage)}`;
        }
        return r;
      }

      case "createTheme": {
        const desc = String(functionArgs?.description || "").trim();
        const preferDark =
          typeof functionArgs?.preferDark === "boolean"
            ? Boolean(functionArgs.preferDark)
            : undefined;
        const nameOverride = functionArgs?.name
          ? String(functionArgs.name)
          : undefined;

        if (desc.length === 0) {
          return {
            success: false,
            message:
              userLanguage === "fr"
                ? "❌ Veuillez décrire le style du thème (ex: néon sombre violet/bleu)."
                : "❌ Please describe the theme style (e.g., dark neon purple/blue).",
          };
        }

        try {
          const theme =
            await ThemeGenerationService.generateThemeFromDescription(
              nameOverride ? `${nameOverride} — ${desc}` : desc,
              preferDark,
              userLanguage
            );

          // Persistance minimale pour sélection future (ThemeContext fera la synchro complète)
          const existing = await themeStorage.getCustomThemes();
          const updated = [...existing, theme];
          await themeStorage.saveCustomThemes(updated);
          await themeStorage.saveSelectedTheme(theme.id);
          await AsyncStorage.setItem("@system_theme_overridden", "true");

          let okMsg =
            userLanguage === "fr"
              ? `✅ Thème créé et sélectionné: ${theme.name}`
              : `✅ Theme created and selected: ${theme.name}`;
          okMsg = `${okMsg}\n\n${resumePrompt(userLanguage)}`;
          return { success: true, message: okMsg };
        } catch (e) {
          const errMsg =
            userLanguage === "fr"
              ? "❌ Erreur lors de la création du thème via IA."
              : "❌ Error while creating theme via AI.";
          return { success: false, message: errMsg };
        }
      }

      default:
        logger.error(`Fonction inconnue: ${functionName}`);
        return {
          success: false,
          message: `❌ Fonction "${functionName}" non reconnue.`,
        };
    }
  } catch (error) {
    logger.error(`Erreur lors du traitement de ${functionName}:`, error);
    return {
      success: false,
      message:
        "❌ Une erreur est survenue lors du traitement de votre demande.",
    };
  }
}

/**
 * Traite une liste d'appels de fonction et combine les résultats
 */
export async function processFunctionCalls(
  toolCalls: Array<{
    function: {
      name: string;
      arguments: string;
    };
  }>,
  userId: string,
  userLanguage: string = "fr"
): Promise<string[]> {
  logger.debug("Traitement des tool_calls...", { count: toolCalls.length });

  const functionResults: string[] = [];

  for (const toolCall of toolCalls) {
    logger.debug("Traitement tool_call:", {
      functionName: toolCall.function.name,
      arguments: toolCall.function.arguments,
    });

    const functionResult = await processFunctionCall(
      toolCall.function.name,
      JSON.parse(toolCall.function.arguments),
      userId,
      userLanguage
    );

    logger.debug("Résultat function:", functionResult);
    functionResults.push(functionResult.message);
  }

  return functionResults;
}
