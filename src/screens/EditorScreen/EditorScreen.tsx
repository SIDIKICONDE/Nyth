import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  View,
  StatusBar,
} from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useAIAssistant } from "../../hooks/useAIAssistant";
import { useOrientation } from "../../hooks/useOrientation";
import { useTranslation } from "../../hooks/useTranslation";
import { RootStackParamList } from "../../types";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('EditorScreen');

// Composants
import { AIAssistant } from "../../components/ai-assistant";
import {
  AIActionsBar,
  LandscapeLayout,
  PortraitLayout,
} from "../../components/editor";
import EditorHeader from "../../components/editor/EditorHeader";
import { TeleprompterSelectionModal } from "../../components/editor/TeleprompterSelectionModal";

// Hooks personnalisés
import {
  useAutoSaveWithContext,
  useEditorHandlers,
  useEditorState,
  useScriptOperations,
} from "./hooks";
import { generateAutoTitle } from "./utils/editorUtils";

type EditorScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Editor"
>;
type EditorScreenRouteProp = RouteProp<RootStackParamList, "Editor">;

export default function EditorScreen() {
  const navigation = useNavigation<EditorScreenNavigationProp>();
  const route = useRoute<EditorScreenRouteProp>();
  const { currentTheme } = useTheme();
  const orientation = useOrientation();
  const { t } = useTranslation();
  const { isAIAssistantVisible, showAIAssistant, hideAIAssistant } =
    useAIAssistant();

  const scriptId = route.params?.scriptId;

  // Détection si c'est une tablette
  const { width, height } = Dimensions.get("window");
  const isTablet = Math.min(width, height) >= 600;

  // État de l'éditeur
  const {
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
    hasContentChanged,
    contentInputRef,
    contentInputLandscapeRef,
  } = useEditorState(scriptId);

  // Hook pour la sauvegarde automatique
  // Utilise maintenant le contexte Firebase au lieu d'AsyncStorage
  const { isAutoSaveActive, lastAutoSave } = useAutoSaveWithContext({
    scriptId: scriptId || null,
    title,
    content,
    currentScript,
    setCurrentScript,
    setScriptIdentifier,
    hasContentChanged,
  });

  // Opérations sur les scripts
  const { saveScriptToStorage, loadDefaultSettingsAndNavigate, loadScript } =
    useScriptOperations({
      title,
      content,
      currentScript,
      scriptIdentifier,
      wordCount,
      setTitle,
      setCurrentScript,
      setScriptIdentifier,
      hasContentChanged,
    });

  // Handlers
  const {
    handleTitleChange,
    handleContentChange,
    handleSelectionChange,
    handleContentSizeChangeLandscape,
    handleImportTxt,
    handleGoBack,
    dismissKeyboard,
    isLoading,
  } = useEditorHandlers({
    content,
    setTitle,
    setContent,
    setCursorPosition,
    hasContentChanged,
    saveScriptToStorage,
  });

  // Chargement initial du script
  useEffect(() => {
    if (scriptId) {
      loadScript(scriptId).then((loadedContent) => {
        if (loadedContent) {
          setContent(loadedContent);
        }
      });
    } else if ((route.params as any)?.initialContent) {
      // Si on reçoit directement du contenu (depuis le chat AI par exemple)
      const initialContent = (route.params as any).initialContent;
      setContent(initialContent);
      hasContentChanged.current = true;

      // Générer un titre automatique basé sur le contenu
      const autoTitle = generateAutoTitle(initialContent, t);
      setTitle(autoTitle);
    }
  }, [scriptId, route.params, setContent, setTitle, loadScript, t]);

  // Debug du modal
  useEffect(() => {
    logger.debug("🔍 État du modal:", showTeleprompterModal);
    logger.debug("🔍 currentScript:", currentScript?.id);
  }, [showTeleprompterModal, currentScript]);

  // Fonction pour sauvegarder le script
  const saveScript = async () => {
    // Si pas de contenu, afficher une alerte
    if (!content.trim()) {
      logger.debug("❌ Contenu requis pour sauvegarder le script");
      return;
    }

    logger.debug("🔍 Avant sauvegarde - currentScript:", currentScript?.id);
    logger.debug("🔍 Avant sauvegarde - scriptIdentifier:", scriptIdentifier);

    // Utiliser false pour éviter toute navigation automatique après la sauvegarde
    const result = await saveScriptToStorage(false);

    logger.debug("📝 Résultat de la sauvegarde:", result);
    logger.debug("🔍 Après sauvegarde - currentScript:", currentScript?.id);

    if (result?.success) {
      logger.debug(t("editor.logs.saveSuccess"));
      logger.debug("✅ Affichage du modal de sélection du téléprompter");
      // Afficher le modal de sélection du téléprompter
      setShowTeleprompterModal(true);
    } else {
      logger.debug("❌ La sauvegarde a échoué, pas d'affichage du modal");
    }
  };

  // Navigation vers le téléprompter standard
  const navigateToTeleprompter = async () => {
    setShowTeleprompterModal(false);
    if (currentScript) {
      const settings = await loadDefaultSettingsAndNavigate();
      navigation.navigate("Recording", {
        scriptId: currentScript.id,
        settings: settings,
      });
    }
  };

  // Fonction pour gérer la mise à jour du contenu depuis l'AI Assistant
  const handleTextUpdate = (newText: string) => {
    setContent(newText);
    hasContentChanged.current = true;
  };

  // Fonction pour gérer la génération de script depuis l'AI Assistant
  const handleScriptGenerated = (title: string, content: string) => {
    setTitle(title);
    setContent(content);
    hasContentChanged.current = true;
    hideAIAssistant();
  };

  return (
    <View
      style={[
        tw`flex-1`,
        { backgroundColor: currentTheme.colors.background },
      ]}
    >
      <StatusBar
        barStyle={currentTheme.isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" || isTablet ? "padding" : "height"}
        style={tw`flex-1`}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : isTablet ? 0 : 20}
      >
        <Pressable onPress={dismissKeyboard} style={tw`flex-1`}>
          <EditorHeader
            isLoading={isLoading}
            onGoBack={handleGoBack}
            onImportTxt={handleImportTxt}
            onDismissKeyboard={dismissKeyboard}
            wordCount={wordCount}
            content={content}
            currentScript={currentScript}
            onSaveScript={saveScript}
            isAutoSaveActive={isAutoSaveActive}
            lastAutoSave={lastAutoSave}
          />

          {/* Barre d'actions AI */}
          <AIActionsBar
            content={content}
            onContentUpdate={handleContentChange}
            cursorPosition={cursorPosition}
            onOpenAIAssistant={showAIAssistant}
          />

          {/* Layout adaptatif selon l'orientation */}
          {orientation.isLandscape && orientation.isTablet ? (
            <LandscapeLayout
              title={title}
              content={content}
              wordCount={wordCount}
              currentScript={currentScript}
              contentInputLandscapeRef={contentInputLandscapeRef}
              onTitleChange={handleTitleChange}
              onContentChange={handleContentChange}
              onContentSizeChangeLandscape={() =>
                handleContentSizeChangeLandscape(contentInputLandscapeRef)
              }
              onSaveScript={saveScript}
              onDismissKeyboard={dismissKeyboard}
            />
          ) : (
            <PortraitLayout
              title={title}
              content={content}
              wordCount={wordCount}
              currentScript={currentScript}
              contentInputRef={contentInputRef}
              onTitleChange={handleTitleChange}
              onContentChange={handleContentChange}
              onSelectionChange={handleSelectionChange}
              onSaveScript={saveScript}
              onDismissKeyboard={dismissKeyboard}
            />
          )}
        </Pressable>
      </KeyboardAvoidingView>

      {/* Modal de sélection du téléprompter */}
      <TeleprompterSelectionModal
        visible={showTeleprompterModal}
        onClose={() => setShowTeleprompterModal(false)}
        onSelectTeleprompterWithCamera={navigateToTeleprompter}
      />

      {/* AI Assistant Modal */}
      <AIAssistant
        isDarkMode={currentTheme.isDark}
        onScriptGenerated={handleScriptGenerated}
        currentText={content}
        onTextCorrected={handleTextUpdate}
        visible={isAIAssistantVisible}
        onClose={hideAIAssistant}
      />
    </View>
  );
}
