import { RouteProp, useRoute } from "@react-navigation/native";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { RootStackParamList } from "../../types";

import AISideMenu from "../../components/ai/AISideMenu";
import {
  AIStatusManager,
  AnimatedMessagesTracker,
  ChatContainer,
  ConversationManager,
} from "../../components/chat";
import { MessageHandler } from "../../components/chat/message-handler";

import { QuickActionsMenu } from "./components";
import { useInitialContext, useQuickActions } from "./hooks";
import { AIChatScreenParams, QuickAction } from "./types";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('AIChatScreen');

type AIChatScreenRouteProp = RouteProp<RootStackParamList, "AIChat">;

// Composant interne pour gérer la logique du chat
interface ChatContentProps {
  messages: any[];
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  setNewMessageIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  isTyping: boolean;
  handleSendMessage: () => Promise<void>;
  saveMessageAsScript: (content: string) => Promise<void>;
  interruptAIGeneration: () => void;
  showHuggingFaceButton: boolean;
  newMessageIds: Set<string>;
  activateHuggingFace: () => void;
  invisibleContext?: string;
  isWelcomeMessage?: boolean;
  initialContext?: string;
  scriptContent: string;
  setScriptContent: React.Dispatch<React.SetStateAction<string>>;
  showQuickActions: boolean;
  setShowQuickActions: React.Dispatch<React.SetStateAction<boolean>>;
  isMenuVisible: boolean;
  setIsMenuVisible: React.Dispatch<React.SetStateAction<boolean>>;
  loadConversation: (id: string) => void;
  startNewConversation: () => void;
  conversationId: string | null | undefined;
  openFontSettings: () => void;
  welcomeMessageProcessed: boolean;
  setWelcomeMessageProcessed: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatContent: React.FC<ChatContentProps> = ({
  messages,
  setMessages,
  setNewMessageIds,
  inputText,
  setInputText,
  isLoading,
  isTyping,
  handleSendMessage,
  saveMessageAsScript,
  interruptAIGeneration,
  showHuggingFaceButton,
  newMessageIds,
  activateHuggingFace,
  invisibleContext,
  isWelcomeMessage,
  initialContext,
  scriptContent,
  setScriptContent,
  showQuickActions,
  setShowQuickActions,
  isMenuVisible,
  setIsMenuVisible,
  loadConversation,
  startNewConversation,
  conversationId,
  openFontSettings,
  welcomeMessageProcessed,
  setWelcomeMessageProcessed,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  // Ref pour suivre si le contexte invisible a été envoyé
  const invisibleContextSentRef = useRef(false);

  // Hook pour les actions rapides
  const quickActions = useQuickActions();

  // Déterminer si on doit encore traiter le message de bienvenue
  const shouldProcessWelcome = isWelcomeMessage && !welcomeMessageProcessed;

  // Effet pour gérer le contexte invisible
  useEffect(() => {
    if (
      invisibleContext &&
      !invisibleContextSentRef.current &&
      !isLoading &&
      shouldProcessWelcome
    ) {
      logger.debug(
        "🔄 Préparation traitement contexte invisible:",
        invisibleContext.substring(0, 100) + "..."
      );
      invisibleContextSentRef.current = true;

      // Traiter le contexte invisible directement sans passer par le champ de saisie
      const processInvisibleContext = async () => {
        if (shouldProcessWelcome) {
          logger.debug(
            "🎉 Traitement direct du contexte invisible pour message de bienvenue"
          );

          // Ne rien mettre dans le champ de saisie, appeler directement handleSendMessage
          // Le contexte invisible sera traité par MessageHandler et messageProcessor
          setTimeout(() => {
            handleSendMessage();
            // Marquer le message de bienvenue comme traité
            setWelcomeMessageProcessed(true);
          }, 100);
        } else {
          logger.debug("📤 Envoi du message avec contexte de planification...");
          setInputText(initialContext || "Aide-moi avec ma planification");
          setTimeout(() => {
            handleSendMessage();
          }, 100);
        }
      };

      processInvisibleContext();
    }
  }, [
    invisibleContext,
    initialContext,
    shouldProcessWelcome,
    isLoading,
    handleSendMessage,
    setWelcomeMessageProcessed,
  ]);

  // Effet pour pré-remplir le champ avec le message de bienvenue
  useEffect(() => {
    if (shouldProcessWelcome && initialContext && !isLoading) {
      // Simplement définir le texte d'entrée sans l'envoyer
      setInputText(initialContext);
    }
  }, [shouldProcessWelcome, initialContext, isLoading, setInputText]);

  // Fonction pour gérer le clic sur une action rapide
  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      const prompt = action.prompt(scriptContent);
      setInputText(prompt);
      setShowQuickActions(false);

      // Pour l'action personnalisée, ne pas envoyer automatiquement
      if (action.id !== "custom") {
        setTimeout(() => {
          handleSendMessage();
        }, 100);
      }
    },
    [scriptContent, setInputText, setShowQuickActions, handleSendMessage]
  );

  return (
    <View style={tw`flex-1`}>
      {/* Menu d'actions rapides */}
      <QuickActionsMenu
        visible={showQuickActions}
        quickActions={quickActions}
        onActionPress={handleQuickAction}
        onClose={() => setShowQuickActions(false)}
      />

      <ChatContainer
        messages={messages}
        setMessages={setMessages}
        sendMessage={async (message: string) => {
          setInputText(message);
          await handleSendMessage();
        }}
        isTyping={isTyping}
        isLoading={isLoading}
        showHuggingFaceButton={showHuggingFaceButton}
        newMessageIds={newMessageIds}
        inputText={inputText}
        setInputText={setInputText}
        handleSendMessage={handleSendMessage}
        activateHuggingFace={activateHuggingFace}
        setIsMenuVisible={setIsMenuVisible}
        openFontSettings={openFontSettings}
        saveMessageAsScript={saveMessageAsScript}
        interruptAIGeneration={interruptAIGeneration}
        aiStatus="connected"
        initialMessage=""
      />

      {/* Side menu */}
      <AISideMenu
        isVisible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        onSelectConversation={(id) => {
          loadConversation(id);
        }}
        onNewConversation={startNewConversation}
        currentConversationId={conversationId ?? undefined}
      />
    </View>
  );
};

const AIChatScreen: React.FC = () => {
  const route = useRoute<AIChatScreenRouteProp>();
  const { initialContext, invisibleContext, returnScreen, isWelcomeMessage } =
    (route.params || {}) as AIChatScreenParams;

  // State for displaying the side menu
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  // State for showing quick actions
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [scriptContent, setScriptContent] = useState<string>("");

  // State pour gérer si le message de bienvenue a été traité
  const [welcomeMessageProcessed, setWelcomeMessageProcessed] = useState(false);

  // Fonction placeholder pour openFontSettings
  const openFontSettings = useCallback(() => {
    // Cette fonction n'est plus utilisée mais est requise par ChatContainer
    // Les paramètres de police sont maintenant accessibles via le menu
  }, []);

  // Gérer la réception du contexte initial
  const handleInitialContext = useCallback(
    (content: string) => {
      // Si c'est un message de bienvenue, ne pas afficher le menu d'actions
      if (isWelcomeMessage) {
        // Le message sera envoyé automatiquement par le MessageHandler
        return;
      }

      // Comportement normal pour les autres contextes initiaux
      setScriptContent(content);
      setShowQuickActions(true);
    },
    [isWelcomeMessage]
  );

  // Hook pour gérer le contexte initial
  useInitialContext({
    initialContext,
    onContextReceived: handleInitialContext,
  });

  // Callback pour scrollToBottom (placeholder)
  const scrollToBottom = useCallback(() => {
    // The actual implementation will be handled by ChatContainer
    // This is just a placeholder to satisfy the interface
  }, []);

  // Déterminer si on doit encore traiter le message de bienvenue
  const shouldProcessWelcome = isWelcomeMessage && !welcomeMessageProcessed;
  const currentInvisibleContext = shouldProcessWelcome
    ? invisibleContext
    : undefined;

  return (
    <AnimatedMessagesTracker>
      <ConversationManager>
        {({
          messages,
          setMessages,
          conversationId,
          loadConversation,
          startNewConversation,
          checkAiConnection,
          newMessageIds,
          setNewMessageIds,
        }) => (
          <AIStatusManager checkAiConnection={checkAiConnection}>
            {({
              aiStatus,
              showHuggingFaceButton,
              activateHuggingFace,
              activeProviders,
            }) => (
              <MessageHandler
                messages={messages}
                setMessages={setMessages}
                setNewMessageIds={setNewMessageIds}
                scrollToBottom={scrollToBottom}
                invisibleContext={currentInvisibleContext}
                isWelcomeMessage={shouldProcessWelcome}
              >
                {({
                  inputText,
                  setInputText,
                  isLoading,
                  isTyping,
                  handleSendMessage,
                  saveMessageAsScript,
                  interruptAIGeneration,
                }: {
                  inputText: string;
                  setInputText: React.Dispatch<React.SetStateAction<string>>;
                  isLoading: boolean;
                  isTyping: boolean;
                  handleSendMessage: () => Promise<void>;
                  saveMessageAsScript: (content: string) => Promise<void>;
                  interruptAIGeneration: () => void;
                }) => (
                  <ChatContent
                    messages={messages}
                    setMessages={setMessages}
                    setNewMessageIds={setNewMessageIds}
                    inputText={inputText}
                    setInputText={setInputText}
                    isLoading={isLoading}
                    isTyping={isTyping}
                    handleSendMessage={handleSendMessage}
                    saveMessageAsScript={saveMessageAsScript}
                    interruptAIGeneration={interruptAIGeneration}
                    showHuggingFaceButton={showHuggingFaceButton}
                    newMessageIds={newMessageIds}
                    activateHuggingFace={activateHuggingFace}
                    invisibleContext={currentInvisibleContext}
                    isWelcomeMessage={shouldProcessWelcome}
                    initialContext={initialContext}
                    scriptContent={scriptContent}
                    setScriptContent={setScriptContent}
                    showQuickActions={showQuickActions}
                    setShowQuickActions={setShowQuickActions}
                    isMenuVisible={isMenuVisible}
                    setIsMenuVisible={setIsMenuVisible}
                    loadConversation={loadConversation}
                    startNewConversation={startNewConversation}
                    conversationId={conversationId}
                    openFontSettings={openFontSettings}
                    welcomeMessageProcessed={welcomeMessageProcessed}
                    setWelcomeMessageProcessed={setWelcomeMessageProcessed}
                  />
                )}
              </MessageHandler>
            )}
          </AIStatusManager>
        )}
      </ConversationManager>
    </AnimatedMessagesTracker>
  );
};

export default AIChatScreen;
