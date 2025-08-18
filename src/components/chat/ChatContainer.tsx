import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  StatusBar,
  View,
} from "react-native";
import tw from "twrnc";

import { useTheme } from "../../contexts/ThemeContext";
import { useChatPreferences } from "../../hooks/useChatPreferences";
import { useChatScroll } from "../../hooks/useChatScroll";
import { RootStackParamList } from "../../types/navigation";
import { useAnimatedMessages } from "./AnimatedMessagesContext";
import ChatHeader from "./ChatHeader";
import { ChatInput } from "./chat-input";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('ChatContainer');

// Imports des nouveaux modules
import { useAuth } from "../../contexts/AuthContext";
import { useInputStyle } from "../../contexts/InputStyleContext";
import { ChatMessages, ScrollToBottomButton } from "./components";
import { useChatKeyboard, useChatMessageEdit } from "./hooks";
import { testAutoSave } from "./message-handler/aiMemory";
import { ChatContainerProps } from "./types/ChatContainer.types";
import { enableAndroidLayoutAnimations } from "./utils/animations";

// Activer les animations de layout sur Android
enableAndroidLayoutAnimations();

type NavigationProp = StackNavigationProp<RootStackParamList, "AIChat">;

const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isTyping,
  isLoading,
  showHuggingFaceButton,
  newMessageIds,
  hideHeader = false,
  inputText,
  setInputText,
  handleSendMessage,
  activateHuggingFace,
  setIsMenuVisible,
  openFontSettings,
  saveMessageAsScript,
  setMessages,
  interruptAIGeneration,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { currentTheme } = useTheme();
  const { markMessageAsAnimated } = useAnimatedMessages();
  const chatContainerRef = useRef<View>(null);
  const { preferences } = useChatPreferences();
  const { selectedInputStyle } = useInputStyle();
  const { user } = useAuth();

  // États pour le scroll
  const [scrollPosition, setScrollPosition] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const { height: screenHeight } = Dimensions.get("window");

  // Hooks personnalisés
  const { keyboardHeight, viewAdjustment, inputPosition } = useChatKeyboard();

  const {
    editingMessageId,
    handleEditMessage,
    handleUpdateMessage,
    cancelEdit,
    isEditing,
  } = useChatMessageEdit();

  // Hook de scroll optimisé
  const {
    scrollViewRef,
    scrollToBottom,
    handleContentSizeChange: onContentSizeChange,
    handleScroll: onScroll,
    showScrollToBottomButton,
    userIsScrolling,
  } = useChatScroll({
    messages,
    isTyping, // ✅ Permettre le scroll pendant que l'IA tape
    keyboardVisible: keyboardHeight > 0, // ✅ Détecter le clavier correctement
    autoScrollEnabled: preferences.autoScrollEnabled, // Utiliser la préférence utilisateur
  });

  // Gérer les changements de layout
  const handleLayout = useCallback((event: any) => {
    const { height } = event.nativeEvent.layout;
    setContainerHeight(height);
  }, []);

  // Wrapper pour handleContentSizeChange
  const handleContentSizeChange = useCallback(
    (width: number, height: number) => {
      setContentHeight(height);
      onContentSizeChange(width, height);
    },
    [onContentSizeChange]
  );

  // Wrapper pour handleScroll
  const handleScroll = useCallback(
    (event: any) => {
      setScrollPosition(event.nativeEvent.contentOffset.y);
      onScroll(event);
    },
    [onScroll]
  );

  // Function to handle the back button
  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return true;
    }
    return false;
  };

  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );

    return () => {
      backHandler.remove();
    };
  }, []);

  // Marquer automatiquement les anciens messages comme déjà animés lors du chargement initial
  const hasInitializedMessages = useRef(false);
  const initializedMessageIds = useRef(new Set<string>());

  useEffect(() => {
    // Seulement lors du premier chargement
    if (messages.length > 0 && !hasInitializedMessages.current) {
      hasInitializedMessages.current = true;

      // Délai pour éviter les conflits avec les nouveaux messages
      const timer = setTimeout(() => {
        const messagesToMark = messages.filter(
          (message) =>
            !message.isUser &&
            !newMessageIds.has(message.id) &&
            !initializedMessageIds.current.has(message.id)
        );

        if (messagesToMark.length > 0) {
          logger.debug(
            "🎯 Marquage initial de",
            messagesToMark.length,
            "messages existants comme animés"
          );
          messagesToMark.forEach((message) => {
            markMessageAsAnimated(message.id);
            initializedMessageIds.current.add(message.id);
          });
        }
      }, 100);

      return () => clearTimeout(timer);
    }

    // Retourner une fonction de nettoyage vide si les conditions ne sont pas remplies
    return () => {};
  }, []); // Pas de dépendances pour éviter les re-exécutions



  return (
    <View
      ref={chatContainerRef}
      style={[
        tw`flex-1 rounded-t-lg overflow-hidden`,
        {
          backgroundColor: currentTheme.colors.background,
          shadowColor: currentTheme.isDark ? "#000" : "#555",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          elevation: 3,
        },
      ]}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={currentTheme.isDark ? "light-content" : "dark-content"}
      />

      {/* Header avec indicateur de statut et bouton de configuration */}
      {!hideHeader && (
        <ChatHeader
          showHuggingFaceButton={showHuggingFaceButton}
          onActivateHuggingFace={activateHuggingFace}
          onMenuPress={() => setIsMenuVisible(true)}
          onFontSettingsPress={openFontSettings}
        />
      )}

      {/* Container principal */}
      <View style={tw`flex-1`}>
        <View style={tw`flex-1 flex-col`}>
          {/* Zone de messages avec espacement approprié */}
          <View style={tw`flex-1`}>
            {/* Zone des messages */}
            <ChatMessages
              messages={messages}
              isTyping={isTyping}
              isLoading={isLoading}
              newMessageIds={newMessageIds}
              scrollViewRef={scrollViewRef}
              saveMessageAsScript={saveMessageAsScript}
              handleEditMessage={handleEditMessage}
              onContentSizeChange={handleContentSizeChange}
              onLayout={handleLayout}
              onScroll={handleScroll}
            />
          </View>
        </View>

        {/* Bouton de retour en bas */}
        <ScrollToBottomButton
          visible={showScrollToBottomButton}
          onPress={() => scrollToBottom(true, true)}
        />

        {/* Input flottant futuriste */}
        <Animated.View
          style={[
            tw`absolute left-0 right-0`,
            {
              bottom: inputPosition, // Input collé au clavier
              paddingHorizontal: selectedInputStyle === "sheet" ? 0 : 16,
              paddingTop: selectedInputStyle === "sheet" ? 0 : 10,
              paddingBottom: selectedInputStyle === "sheet" ? 0 : 10,
              zIndex: 10, // Au-dessus de l'overlay d'assombrissement
            },
          ]}
        >
          <ChatInput
            inputText={inputText}
            setInputText={setInputText}
            handleSendMessage={async () => {
              if (isEditing) {
                // Mode édition : mettre à jour le message existant
                await handleUpdateMessage(
                  inputText,
                  setMessages,
                  interruptAIGeneration,
                  setInputText
                );
              } else {
                // Mode normal : envoyer un nouveau message
                await handleSendMessage();
              }
              // Le scroll sera géré automatiquement par le hook
            }}
            isLoading={isLoading}
            isEditing={isEditing}
            onCancelEdit={() => cancelEdit(setInputText)}
          />
        </Animated.View>
      </View>
    </View>
  );
};

export default ChatContainer;
