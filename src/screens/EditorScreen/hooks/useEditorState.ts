import { useState, useRef, useEffect } from "react";
import { Script } from "../../../types";

export const useEditorState = (initialScriptId?: string) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [currentScript, setCurrentScript] = useState<Script | null>(null);
  const [scriptIdentifier, setScriptIdentifier] = useState<string>(
    Date.now().toString()
  );
  const [showTeleprompterModal, setShowTeleprompterModal] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  const hasContentChanged = useRef(false);
  const contentInputRef = useRef<import("react-native").TextInput | null>(null);
  const contentInputLandscapeRef = useRef<
    import("react-native").TextInput | null
  >(null);

  // Utiliser un ID cohérent pour l'auto-sauvegarde
  useEffect(() => {
    if (initialScriptId) {
      setScriptIdentifier(initialScriptId);
    }
  }, [initialScriptId]);

  // Calculer le nombre de mots
  useEffect(() => {
    const words =
      content
        ?.trim()
        .split(/\s+/)
        .filter((word) => word.length > 0) || [];
    setWordCount(words.length);
  }, [content]);

  return {
    // États
    title,
    setTitle,
    content,
    setContent,
    wordCount,
    currentScript,
    setCurrentScript,
    scriptIdentifier,
    setScriptIdentifier,
    showTeleprompterModal,
    setShowTeleprompterModal,
    cursorPosition,
    setCursorPosition,

    // Refs
    hasContentChanged,
    contentInputRef,
    contentInputLandscapeRef,
  };
};
