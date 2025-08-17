/**
 * Constructeur de contexte des vidéos
 */

import { getCached } from "@/components/chat/message-handler/context/cache";

/**
 * Construit le contexte des vidéos
 */
export const buildVideosContext = async (
  user: any,
  language: string
): Promise<string> => {
  try {
    if (!user) {
      return "";
    }

    // Clé de cache basée sur l'identifiant utilisateur (ou générique)
    const userKey = user?.uid || "anonymous";
    const cacheKey = `videosContext_${userKey}`;

    // Fonction de récupération (appel Firestore)
    const fetchContext = async () => {
      const { getVideosContextForAI } = await import(
        "@/services/firebase/planning/contextService"
      );

      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 5000)
      );

      const contextPromise = getVideosContextForAI(user);
      return await Promise.race([contextPromise, timeoutPromise]);
    };

    // Obtenir via cache (TTL 5 min)
    const videosContext = await getCached(
      cacheKey,
      fetchContext,
      5 * 60 * 1000
    );

    return videosContext;
  } catch (error) {
    // Contexte de fallback selon la langue
    if (language === "fr") {
      return `📹 CONTEXTE VIDÉOS:
L'utilisateur utilise l'application Naya pour créer des scripts et enregistrer des vidéos.
Tu peux l'aider avec la création de contenu, l'organisation de ses scripts et la gestion de ses vidéos.`;
    } else {
      return `📹 VIDEOS CONTEXT:
The user uses the Naya app to create scripts and record videos.
You can help with content creation, script organization, and video management.`;
    }
  }
};
