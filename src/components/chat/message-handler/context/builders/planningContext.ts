/**
 * Constructeur de contexte de planification
 */

import { getCached } from "@/components/chat/message-handler/context/cache";

/**
 * Construit le contexte de planification
 */
export const buildPlanningContext = async (
  user: any,
  language: string
): Promise<string> => {
  try {
    if (!user?.uid) {
      return "";
    }

    // Clé de cache unique par utilisateur
    const cacheKey = `planningContext_${user.uid}`;

    // Fonction de récupération (appel réseau Firestore)
    const fetchContext = async () => {
      const { getPlanningContextForAI } = await import(
        "@/services/firebase/planning/contextService"
      );

      // Timeout pour éviter de bloquer trop longtemps
      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 5000)
      );

      const contextPromise = getPlanningContextForAI(user.uid);
      return await Promise.race([contextPromise, timeoutPromise]);
    };

    // Obtenir le contexte via cache (TTL 5 min)
    const planningContext = await getCached(
      cacheKey,
      fetchContext,
      5 * 60 * 1000
    );

    return planningContext;
  } catch (error) {
    // Contexte de fallback selon la langue
    if (language === "fr") {
      return `📅 CONTEXTE PLANIFICATION:
L'utilisateur utilise le système de planification de l'application pour organiser ses événements et objectifs.
Tu peux l'aider avec la gestion du temps, la priorisation des tâches, et l'optimisation de sa productivité.`;
    } else {
      return `📅 PLANNING CONTEXT:
The user uses the app's planning system to organize events and goals.
You can help with time management, task prioritization, and productivity optimization.`;
    }
  }
};
