import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback } from "react";
import { Alert, Keyboard } from "react-native";
import { useImportManager } from "../../../components/editor";
import { useTranslation } from "../../../hooks/useTranslation";
import { RootStackParamList } from "../../../types";

interface UseEditorHandlersProps {
  content: string;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  setCursorPosition: (position: number) => void;
  hasContentChanged: React.MutableRefObject<boolean>;
  saveScriptToStorage: (navigateAfterSave?: boolean) => Promise<any>;
}

type EditorScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Editor"
>;

export const useEditorHandlers = ({
  content,
  setTitle,
  setContent,
  setCursorPosition,
  hasContentChanged,
  saveScriptToStorage,
}: UseEditorHandlersProps) => {
  const navigation = useNavigation<EditorScreenNavigationProp>();
  const { t } = useTranslation();
  const { isLoading, handleImport } = useImportManager();

  // Flag pour éviter les doubles sauvegardes
  const isSavingRef = React.useRef(false);

  // Handler pour les changements de titre
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      hasContentChanged.current = true;
    },
    [setTitle, hasContentChanged]
  );

  // Handler pour les changements de contenu
  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      hasContentChanged.current = true;
    },
    [setContent, hasContentChanged]
  );

  // Handler pour la sélection de texte
  const handleSelectionChange = useCallback(
    (event: any) => {
      setCursorPosition(event.nativeEvent.selection.start);
    },
    [setCursorPosition]
  );

  // Handler pour l'auto-scroll en mode paysage
  const handleContentSizeChangeLandscape = useCallback(
    (contentInputLandscapeRef: any) => {
      setTimeout(() => {
        if (contentInputLandscapeRef.current) {
          const textLength = content.length;
          contentInputLandscapeRef.current.setNativeProps({
            selection: { start: textLength, end: textLength },
          });
        }
      }, 100);
    },
    [content]
  );

  // Handler pour fermer le clavier
  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  // Handler pour l'import de fichiers
  const handleImportTxt = useCallback(() => {
    handleImport("txt", setContent);
    hasContentChanged.current = true;
  }, [handleImport, setContent, hasContentChanged]);

  // Handler pour le retour avec sauvegarde automatique
  const handleGoBack = useCallback(async () => {
    // Éviter les doubles appels
    if (isSavingRef.current) {
      return;
    }

    dismissKeyboard();

    // Si le contenu a été modifié ET qu'il y a du contenu, on sauvegarde avant de quitter
    if (content.trim() && hasContentChanged.current) {
      try {
        isSavingRef.current = true;

        // Sauvegarder le script (nouveau ou existant)
        const result = await saveScriptToStorage(false);

        if (result?.success) {
          // Marquer que le contenu n'a plus changé pour éviter une double sauvegarde
          hasContentChanged.current = false;
        }
      } catch (error) {
        // Proposer à l'utilisateur de quitter sans sauvegarder
        Alert.alert(
          t("editor.alerts.exitWithoutSaving.title"),
          t("editor.alerts.exitWithoutSaving.message"),
          [
            {
              text: t("editor.alerts.exitWithoutSaving.cancel"),
              style: "cancel",
            },
            {
              text: t("editor.alerts.exitWithoutSaving.exit"),
              style: "destructive",
              onPress: () => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate("Home");
                }
              },
            },
          ]
        );
        isSavingRef.current = false;
        return;
      } finally {
        isSavingRef.current = false;
      }
    }

    // Navigation
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Home");
    }
  }, [
    content,
    hasContentChanged,
    saveScriptToStorage,
    navigation,
    t,
    dismissKeyboard,
  ]);

  return {
    handleTitleChange,
    handleContentChange,
    handleSelectionChange,
    handleContentSizeChangeLandscape,
    handleImportTxt,
    handleGoBack,
    dismissKeyboard,
    isLoading,
  };
};
