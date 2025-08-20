import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback } from "react";
import { Alert } from "react-native";
import { useScripts } from "../../../contexts/ScriptsContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { RecordingSettings, Script } from "../../../types";
import {
  cleanHtmlContent,
  generateAutoTitle,
  getDefaultRecordingSettings,
} from "../utils/editorUtils";

interface UseScriptOperationsProps {
  title: string;
  content: string;
  currentScript: Script | null;
  scriptIdentifier: string;
  wordCount: number;
  setTitle: (title: string) => void;
  setCurrentScript: (script: Script | null) => void;
  setScriptIdentifier: (id: string) => void;
  hasContentChanged: React.MutableRefObject<boolean>;
}

export const useScriptOperations = ({
  title,
  content,
  currentScript,
  scriptIdentifier,
  wordCount,
  setTitle,
  setCurrentScript,
  setScriptIdentifier,
  hasContentChanged,
}: UseScriptOperationsProps) => {
  const { scripts, addScript, updateScript, getScriptById } = useScripts();
  const { t } = useTranslation();

  // Fonction pour sauvegarder le script
  const saveScriptToStorage = useCallback(
    async (
      navigateAfterSave = false
    ): Promise<{ success: boolean; scriptId?: string }> => {
      try {
        // Vérifier si le contenu existe
        if (!content.trim()) {
          Alert.alert(
            t("editor.alerts.attention"),
            t("editor.alerts.emptyContent")
          );
          return { success: false };
        }

        // Nettoyer le contenu
        const cleanContent = cleanHtmlContent(content);

        // Générer un titre automatique si non fourni
        let scriptTitle = title.trim();
        if (!scriptTitle) {
          scriptTitle = generateAutoTitle(cleanContent, t);
          setTitle(scriptTitle);
        }

        const estimatedDuration = Math.ceil(wordCount / 150);
        const now = new Date().toISOString();

        if (currentScript) {
          // Mise à jour du script existant
          const updatedScript: Script = {
            ...currentScript,
            title: scriptTitle,
            content: cleanContent,
            updatedAt: now,
            estimatedDuration,
          };
          await updateScript(updatedScript);
          setCurrentScript(updatedScript);

          hasContentChanged.current = false;
          return { success: true, scriptId: currentScript.id };
        } else {
          // Vérifier si on a déjà un scriptIdentifier (script auto-sauvegardé)
          const existingScript = scriptIdentifier
            ? getScriptById(scriptIdentifier)
            : null;

          if (existingScript) {
            // Mettre à jour le script existant au lieu de créer un doublon
            const updatedScript: Script = {
              ...existingScript,
              title: scriptTitle,
              content: cleanContent,
              updatedAt: now,
              estimatedDuration,
            };
            await updateScript(updatedScript);
            setCurrentScript(updatedScript);

            hasContentChanged.current = false;
            return { success: true, scriptId: existingScript.id };
          }

          // Vérifier les doublons de titre
          const scriptWithSameTitle = scripts.find(
            (s) =>
              s.title.toLowerCase() === scriptTitle.toLowerCase() &&
              s.id !== scriptIdentifier
          );

          if (scriptWithSameTitle) {
            let newTitle = scriptTitle;
            let counter = 1;

            while (
              scripts.some(
                (s) => s.title.toLowerCase() === newTitle.toLowerCase()
              )
            ) {
              newTitle = `${scriptTitle} (${counter})`;
              counter++;
            }

            scriptTitle = newTitle;
            setTitle(newTitle);
          }

          // Vérifier une dernière fois qu'un script avec ce contenu n'existe pas déjà
          const duplicateScript = scripts.find(
            (s) => s.content === cleanContent && s.title === scriptTitle
          );

          if (duplicateScript) {
            setCurrentScript(duplicateScript);
            setScriptIdentifier(duplicateScript.id);
            hasContentChanged.current = false;
            return { success: true, scriptId: duplicateScript.id };
          }

          // Création d'un nouveau script
          const newScriptData = {
            title: scriptTitle,
            content: cleanContent,
            estimatedDuration,
          };
          const newScriptId = await addScript(newScriptData);

          if (newScriptId) {
            // Le script a été créé avec succès
            const newScript: Script = {
              id: newScriptId,
              ...newScriptData,
              createdAt: now,
              updatedAt: now,
            };

            setCurrentScript(newScript);
            setScriptIdentifier(newScriptId);

            hasContentChanged.current = false;
            return { success: true, scriptId: newScriptId };
          }
        }

        return { success: false };
      } catch (error) {
        Alert.alert(t("editor.alerts.error"), t("editor.alerts.saveError"));
        return { success: false };
      }
    },
    [
      title,
      content,
      currentScript,
      scriptIdentifier,
      wordCount,
      scripts,
      updateScript,
      addScript,
      getScriptById,
      setTitle,
      setCurrentScript,
      setScriptIdentifier,
      hasContentChanged,
      t,
    ]
  );

  // Fonction pour charger les paramètres par défaut
  const loadDefaultSettingsAndNavigate =
    async (): Promise<RecordingSettings> => {
      try {
        const savedSettings = await AsyncStorage.getItem("recordingSettings");
        let settings: RecordingSettings;

        if (savedSettings) {
          settings = JSON.parse(savedSettings);
          // Forcer l'activation du micro et de la caméra
          settings.isMicEnabled = true;
          settings.isVideoEnabled = true;
          settings.audioEnabled = true;
          settings.videoEnabled = true;
        } else {
          settings = getDefaultRecordingSettings();
        }

        return settings;
      } catch (error) {
        return getDefaultRecordingSettings();
      }
    };

  // Fonction pour charger un script
  const loadScript = useCallback(
    async (scriptId: string) => {
      try {
        const script = getScriptById(scriptId);
        if (script) {
          setCurrentScript(script);
          setTitle(script.title);

          const cleanContent = cleanHtmlContent(script.content);
          hasContentChanged.current = false;

          return cleanContent;
        }
        return null;
      } catch (error) {
        return null;
      }
    },
    [getScriptById, setCurrentScript, setTitle, hasContentChanged, t]
  );

  return {
    saveScriptToStorage,
    loadDefaultSettingsAndNavigate,
    loadScript,
  };
};
