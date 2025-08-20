import { getWelcomeTemplate } from "../templates/welcomeTemplates";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import RNLocalize from "react-native-localize";
import { useStorage } from "../hooks/useStorage";
import { useTranslation } from "../hooks/useTranslation";
import analyticsService from "../services/firebase/analyticsService";
import { Script } from "../types";
import { useAuth } from "./AuthContext";

import { createOptimizedLogger } from '../utils/optimizedLogger';
const logger = createOptimizedLogger('ScriptsContext');

// Interface du contexte
interface ScriptsContextInterface {
  scripts: Script[];
  loading: boolean;
  error: string | null;
  addScript: (
    script: Omit<Script, "id" | "createdAt" | "updatedAt">
  ) => Promise<string | null>;
  updateScript: (script: Script) => Promise<void>;
  deleteScript: (scriptId: string) => Promise<void>;
  getScriptById: (scriptId: string) => Script | null;
  clearAllScripts: () => Promise<void>;
  toggleFavorite: (scriptId: string) => Promise<void>;
  getFavoriteScripts: () => Script[];
  refreshScripts: () => Promise<void>;
}

// Création du contexte
const ScriptsContext = createContext<ScriptsContextInterface | null>(null);

// Hook personnalisé pour utiliser le contexte
export const useScripts = () => {
  const context = useContext(ScriptsContext);
  if (!context) {
    throw new Error("useScripts must be used within a ScriptsProvider");
  }
  return context;
};

// Provider
export const ScriptsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storage = useStorage();

  // Charger les scripts au démarrage ou quand l'utilisateur change
  useEffect(() => {
    if (user?.uid) {
      loadScripts();
    } else {
      // Utilisateur déconnecté, vider les scripts
      setScripts([]);
    }
  }, [user?.uid]);

  const loadScripts = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);

      // S'assurer que les analytics existent pour cet utilisateur
      await analyticsService.ensureAnalyticsExist(user.uid);

      const loadedScripts = await storage.getScripts();
      setScripts(loadedScripts);
      logger.debug(`📚 ${loadedScripts.length} scripts chargés`);

      // Créer un script de bienvenue si nécessaire
      await ensureDefaultWelcomeScript(loadedScripts);
    } catch (err) {
      logger.error("❌ Erreur chargement scripts:", err);
      setError(
        t("scripts.storage.loadError", "Erreur lors du chargement des scripts")
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Crée un script de bienvenue si l'utilisateur n'en possède aucun.
   */
  const ensureDefaultWelcomeScript = async (currentScripts: Script[]) => {
    if (!user?.uid) return;

    if (currentScripts.length > 0) return;

    const flagKey = `@first_welcome_script_${user.uid}`;
    const alreadyCreated = await AsyncStorage.getItem(flagKey);
    if (alreadyCreated === "true") return;

    try {
      // Détecter la langue du système avec fallback sécurisé
      let detectedLang = "en";
      try {
        const locales = RNLocalize.getLocales();
        if (locales && locales.length > 0 && locales[0]?.languageCode) {
          detectedLang = locales[0].languageCode;
        }
      } catch (localeError) {
        logger.warn(
          "⚠️ Erreur détection locale, utilisation de 'en' par défaut:",
          localeError
        );
        detectedLang = "en";
      }

      // Créer le guide principal dans la langue détectée en premier
      const languages = [detectedLang];

      // Ajouter les autres langues (éviter les doublons)
      const allLanguages = ["en", "fr", "es"];
      allLanguages.forEach((lang) => {
        if (lang !== detectedLang) {
          languages.push(lang);
        }
      });

      const newScripts: Script[] = [];

      for (const lang of languages) {
        const template = getWelcomeTemplate(lang);
        const wordCount =
          template.content?.split(/\s+/).filter(Boolean).length || 0;

        const scriptId = await storage.saveScript({
          title: template.title,
          content: template.content,
          isFavorite: false,
          estimatedDuration: Math.ceil(wordCount / 150),
        });

        if (scriptId) {
          const newScript: Script = {
            id: scriptId,
            title: template.title,
            content: template.content,
            isFavorite: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            estimatedDuration: Math.ceil(wordCount / 150),
          };

          newScripts.push(newScript);
          logger.debug(
            `✨ Guide ${lang.toUpperCase()} créé pour l'utilisateur`,
            user.uid
          );
        }
      }

      setScripts(newScripts);
      await AsyncStorage.setItem(flagKey, "true");
      logger.debug(
        `🎉 ${
          newScripts.length
        } guides créés - Principal: ${detectedLang.toUpperCase()}`
      );
    } catch (error) {
      logger.error("❌ Erreur création scripts de bienvenue:", error);
    }
  };

  // Fonction pour ajouter un script
  const addScript = async (
    scriptData: Omit<Script, "id" | "createdAt" | "updatedAt">
  ): Promise<string | null> => {
    if (!user?.uid) {
      setError("Utilisateur non connecté");
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const scriptId = await storage.saveScript(scriptData);

      if (scriptId) {
        // Créer le script complet pour l'état local
        const newScript: Script = {
          ...scriptData,
          id: scriptId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setScripts((prev) => [...prev, newScript]);
        logger.debug("✅ Script ajouté:", scriptId);

        // Mettre à jour les analytics
        await analyticsService.onScriptCreated(user.uid, newScript);

        return scriptId;
      }

      return null;
    } catch (err) {
      logger.error("❌ Erreur ajout script:", err);
      setError(
        t("scripts.storage.saveError", "Erreur lors de la sauvegarde du script")
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour mettre à jour un script
  const updateScript = async (script: Script) => {
    try {
      setLoading(true);
      setError(null);

      await storage.updateScript(script.id, {
        ...script,
        updatedAt: new Date().toISOString(),
      });

      setScripts((prevScripts) =>
        prevScripts.map((s) => (s.id === script.id ? script : s))
      );
      logger.debug("✅ Script mis à jour:", script.id);
    } catch (err) {
      logger.error("❌ Erreur mise à jour script:", err);
      setError(
        t(
          "scripts.storage.updateError",
          "Erreur lors de la mise à jour du script"
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour supprimer un script
  const deleteScript = async (scriptId: string) => {
    if (!user?.uid) {
      logger.error("❌ Tentative de suppression sans utilisateur connecté");
      setError("Utilisateur non connecté");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      logger.debug(
        "🗑️ Suppression du script:",
        scriptId,
        "pour l'utilisateur:",
        user.uid
      );
      logger.debug("👤 Utilisateur actuel:", {
        uid: user.uid,
        email: user.email,
        isGuest: user.isGuest,
      });

      await storage.deleteScript(scriptId, user.uid);

      setScripts((prevScripts) => prevScripts.filter((s) => s.id !== scriptId));
      logger.debug("✅ Script supprimé du contexte:", scriptId);

      // Mettre à jour les analytics
      await analyticsService.onScriptDeleted(user.uid, scriptId);
    } catch (err) {
      logger.error("❌ Erreur suppression script dans le contexte:", err);
      setError(
        t(
          "scripts.storage.deleteError",
          "Erreur lors de la suppression du script"
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer un script par son ID
  const getScriptById = (scriptId: string): Script | null => {
    const script = scripts.find((s) => s.id === scriptId);
    return script || null;
  };

  // Fonction pour vider tous les scripts
  const clearAllScripts = async () => {
    if (!user?.uid) {
      logger.error("❌ Tentative de vidage sans utilisateur connecté");
      setError("Utilisateur non connecté");
      return;
    }
    try {
      setLoading(true);
      setError(null);

      // Supprimer tous les scripts un par un
      for (const script of scripts) {
        await storage.deleteScript(script.id, user.uid);
      }

      setScripts([]);
      logger.debug("🗑️ Tous les scripts supprimés");
    } catch (err) {
      logger.error("❌ Erreur suppression scripts:", err);
      setError(
        t(
          "scripts.storage.clearError",
          "Erreur lors de la suppression des scripts"
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour basculer le statut favori d'un script
  const toggleFavorite = async (scriptId: string) => {
    const script = scripts.find((s) => s.id === scriptId);
    if (!script) return;

    const updatedScript = {
      ...script,
      isFavorite: !script.isFavorite,
      updatedAt: new Date().toISOString(),
    };

    await updateScript(updatedScript);
    logger.debug(`⭐ Script ${scriptId} favori: ${updatedScript.isFavorite}`);
  };

  // Fonction pour récupérer uniquement les scripts favoris
  const getFavoriteScripts = (): Script[] => {
    return scripts.filter((s) => s.isFavorite === true);
  };

  // Fonction pour rafraîchir les scripts
  const refreshScripts = useCallback(async () => {
    await loadScripts();
  }, [user?.uid]);

  return (
    <ScriptsContext.Provider
      value={{
        scripts,
        loading,
        error,
        addScript,
        updateScript,
        deleteScript,
        getScriptById,
        clearAllScripts,
        toggleFavorite,
        getFavoriteScripts,
        refreshScripts,
      }}
    >
      {children}
    </ScriptsContext.Provider>
  );
};
