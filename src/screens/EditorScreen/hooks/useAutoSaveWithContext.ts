import { useCallback, useEffect, useRef, useState } from "react";
import { useScripts } from "../../../contexts/ScriptsContext";
import { Script } from "../../../types";

interface UseAutoSaveWithContextProps {
  scriptId: string | null;
  title: string;
  content: string;
  currentScript: Script | null;
  setCurrentScript: (script: Script | null) => void;
  setScriptIdentifier: (id: string) => void;
  hasContentChanged: React.MutableRefObject<boolean>;
}

export function useAutoSaveWithContext({
  scriptId,
  title,
  content,
  currentScript,
  setCurrentScript,
  setScriptIdentifier,
  hasContentChanged,
}: UseAutoSaveWithContextProps) {
  const { addScript, updateScript, refreshScripts } = useScripts();
  const [isAutoSaveActive, setIsAutoSaveActive] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<number | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef({ title: "", content: "" });
  const isSavingRef = useRef(false);

  // Fonction de sauvegarde automatique
  const performAutoSave = useCallback(async () => {
    // Éviter les sauvegardes multiples simultanées
    if (isSavingRef.current) return;

    // Vérifier s'il y a du contenu à sauvegarder
    if (!content.trim() && !title.trim()) return;

    // Vérifier si le contenu a changé depuis la dernière sauvegarde
    if (
      lastSavedContentRef.current.title === title &&
      lastSavedContentRef.current.content === content
    ) {
      return;
    }

    try {
      isSavingRef.current = true;
      const now = new Date().toISOString();
      const estimatedDuration = Math.ceil(
        content.split(/\s+/).filter((w) => w).length / 150
      );

      if (currentScript) {
        // Mettre à jour le script existant
        const updatedScript: Script = {
          ...currentScript,
          title: title || "Sans titre",
          content,
          updatedAt: now,
          estimatedDuration,
        };

        await updateScript(updatedScript);
        setCurrentScript(updatedScript);
      } else if (content.trim()) {
        // Créer un nouveau script seulement s'il y a du contenu
        const newScriptData = {
          title: title || `Brouillon ${new Date().toLocaleString()}`,
          content,
          estimatedDuration,
          isAutoSave: true, // Marquer comme auto-save
        };

        const newScriptId = await addScript(newScriptData);

        if (newScriptId) {
          // Rafraîchir la liste des scripts pour s'assurer qu'elle est à jour
          await refreshScripts();

          // Mettre à jour l'état local avec le nouveau script
          const newScript: Script = {
            id: newScriptId,
            ...newScriptData,
            createdAt: now,
            updatedAt: now,
          };

          setCurrentScript(newScript);
          setScriptIdentifier(newScriptId);
        }
      }

      // Mettre à jour les références
      lastSavedContentRef.current = { title, content };
      setLastAutoSave(Date.now());
      hasContentChanged.current = false;
    } catch (error) {} finally {
      isSavingRef.current = false;
    }
  }, [
    title,
    content,
    currentScript,
    addScript,
    updateScript,
    setCurrentScript,
    setScriptIdentifier,
    hasContentChanged,
    refreshScripts,
  ]);

  // Effect pour déclencher l'auto-save
  useEffect(() => {
    // Ne pas activer l'auto-save si pas de contenu
    if (!content && !title) {
      setIsAutoSaveActive(false);
      return;
    }

    setIsAutoSaveActive(true);

    // Annuler le timeout précédent
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Programmer une nouvelle sauvegarde après 3 secondes d'inactivité
    saveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, 3000);

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, performAutoSave]);

  // Sauvegarder immédiatement lors du démontage si nécessaire
  useEffect(() => {
    return () => {
      // Sauvegarder si le contenu a changé
      if (
        hasContentChanged.current &&
        content.trim() &&
        (lastSavedContentRef.current.title !== title ||
          lastSavedContentRef.current.content !== content)
      ) {
        // Note: Cette sauvegarde sera asynchrone et pourrait ne pas se terminer
        performAutoSave();
      }
    };
  }, []);

  return {
    isAutoSaveActive,
    lastAutoSave,
  };
}
