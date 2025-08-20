import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as React from "react";
import { useState } from "react";

import { useAuth } from "../../../contexts/AuthContext";
import { useScripts } from "../../../contexts/ScriptsContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { Message } from "../../../types/chat";
import { RootStackParamList } from "../../../types/navigation";
import { getUserLanguage } from "./context/language";
import { formatErrorMessage } from "./errorHandler";
import { processMessage } from "./messageProcessor";
import { MessageHandlerProps } from "./types";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';
const logger = createOptimizedLogger('MessageHandler');

type NavigationProp = StackNavigationProp<RootStackParamList, "AIChat">;

const MessageHandler: React.FC<MessageHandlerProps> = ({
  messages,
  setMessages,
  setNewMessageIds,
  scrollToBottom,
  invisibleContext,
  isWelcomeMessage,
  children,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { scripts } = useScripts();
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userLanguage, setUserLanguage] = useState<string>("fr");

  // Charger la langue utilisateur au montage
  React.useEffect(() => {
    (async () => {
      try {
        const lang = await getUserLanguage();
        setUserLanguage(lang || "fr");
      } catch {
        setUserLanguage("fr");
      }
    })();
  }, []);

  // AbortController pour interrompre les requêtes AI
  const abortControllerRef = React.useRef<AbortController | null>(null);

  /**
   * Fonction pour interrompre la génération AI en cours
   */
  const interruptAIGeneration = () => {
    if (abortControllerRef.current) {
      logger.debug(t("conversation.messageHandler.interrupting"));
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  /**
   * Gère l'envoi d'un message
   */
  const handleSendMessage = async () => {
    // Permettre l'envoi si on a un contexte invisible même sans texte d'entrée
    if (!inputText.trim() && !invisibleContext) return;

    // Interrompre toute génération AI en cours
    interruptAIGeneration();

    // Disable user input to prevent multiple sends
    setIsLoading(true);

    // Créer un nouveau AbortController pour cette requête
    abortControllerRef.current = new AbortController();
    const currentAbortController = abortControllerRef.current;

    // Store the current text and clean the input immediately
    const currentInputText = inputText.trim();
    setInputText("");

    // Pour les messages de bienvenue avec contexte invisible, on utilise le contexte comme message
    const messageToProcess =
      isWelcomeMessage && invisibleContext
        ? invisibleContext
        : currentInputText;

    // Pour les messages de bienvenue avec contexte invisible, ne pas créer de message utilisateur visible
    if (!(isWelcomeMessage && invisibleContext)) {
      // Generate a unique ID for the message
      const newMessageId = Date.now().toString();

      // Add the user message
      const userMessage: Message = {
        id: newMessageId,
        content: currentInputText,
        isUser: true,
        timestamp: new Date(),
      };

      // Update the state with the new user message
      setMessages((prevMessages) => [...prevMessages, userMessage]);

      // Mark the message as new
      setNewMessageIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(newMessageId);
        return newSet;
      });

      // Scroll down after adding the message
      scrollToBottom();
    }

    // Traiter le message avec le module dédié
    try {
      setIsTyping(true);

      // Construire les options de traitement avec le contexte invisible si disponible
      const processOptions = {
        message: messageToProcess,
        userId: user?.uid || "",
        conversationHistory: messages.map((msg) => ({
          role: msg.isUser ? ("user" as const) : ("assistant" as const),
          content: msg.content,
        })),
        signal: currentAbortController.signal,
        userLanguage: userLanguage,
        user: user,
        scripts: scripts || [],
        invisibleContext: isWelcomeMessage ? invisibleContext : undefined,
        isWelcomeMessage: isWelcomeMessage,
      };

      logger.debug("🔄 MessageHandler - Options de traitement:", {
        isWelcomeMessage,
        hasInvisibleContext: !!invisibleContext,
        invisibleContextPreview: invisibleContext?.substring(0, 100) + "...",
        messagePreview: processOptions.message.substring(0, 100) + "...",
      });

      const response = await processMessage({
        ...processOptions,
        onProgress: (chunk: string) => {
          const aiUpdateId = (
            Date.now() + Math.floor(Math.random() * 1000)
          ).toString();
          const updateMessage: Message = {
            id: aiUpdateId,
            content: chunk,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, updateMessage]);
          setNewMessageIds((prev) => {
            const ns = new Set(prev);
            ns.add(aiUpdateId);
            return ns;
          });
          scrollToBottom();
        },
      });

      setIsTyping(false);

      // Generate an ID for the response
      const aiResponseId = (Date.now() + 1).toString();

      // Add the AI response
      const aiResponse: Message = {
        id: aiResponseId,
        content: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, aiResponse]);

      // Mark the AI message as new
      setNewMessageIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(aiResponseId);
        return newSet;
      });

      // Scroll down after adding the response
      scrollToBottom();
    } catch (error) {
      setIsTyping(false);
      logger.error("❌ Erreur lors du traitement du message:", error);

      // Afficher un message d'erreur à l'utilisateur
      const errorMessage = formatErrorMessage(
        error instanceof Error ? error : String(error),
        userLanguage
      );
      const errorResponseId = (Date.now() + 1).toString();

      const errorResponse: Message = {
        id: errorResponseId,
        content: `❌ ${errorMessage}`,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, errorResponse]);
      setNewMessageIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(errorResponseId);
        return newSet;
      });
      scrollToBottom();
    }

    // End loading
    setIsLoading(false);

    // Nettoyer l'AbortController
    if (abortControllerRef.current === currentAbortController) {
      abortControllerRef.current = null;
    }
  };

  /**
   * Sauvegarde un message comme script
   */
  const saveMessageAsScript = async (content: string) => {
    // Naviguer directement vers l'éditeur avec le contenu
    navigation.navigate("Editor", { initialContent: content });
  };

  return (
    <>
      {children({
        inputText,
        setInputText,
        isLoading,
        isTyping,
        handleSendMessage,
        saveMessageAsScript,
        interruptAIGeneration,
      })}
    </>
  );
};

export default MessageHandler;
