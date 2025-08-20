import React, { useCallback } from "react";
import { ScrollView, View } from "react-native";
import tw from "twrnc";
import { useFont } from "../../../contexts/FontContext";
import { useMessageLayout } from "../../../contexts/MessageLayoutContext";
import { Message } from "../../../types/chat";
import ChatMessage from "../ChatMessage";
import TypingIndicator from "../TypingIndicator";

import { createOptimizedLogger } from "../../../utils/optimizedLogger";
const logger = createOptimizedLogger("ChatMessages");

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
  isLoading: boolean;
  newMessageIds: Set<string>;
  scrollViewRef: React.RefObject<ScrollView | null>;
  saveMessageAsScript: (content: string) => Promise<void>;
  handleEditMessage: (messageId: string, content: string) => void;
  onContentSizeChange: (width: number, height: number) => void;
  onLayout: (event: any) => void;
  onScroll: (event: any) => void;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isTyping,
  isLoading,
  newMessageIds,
  scrollViewRef,
  saveMessageAsScript,
  handleEditMessage,
  onContentSizeChange,
  onLayout,
  onScroll,
}) => {
  const { settings: layoutSettings } = useMessageLayout();
  const { fonts } = useFont();

  // Debug pour vérifier les mises à jour de la liste
  React.useEffect(() => {
    logger.debug(
      "📜 ChatMessages re-rendered with layoutSettings:",
      layoutSettings
    );
  }, [layoutSettings]);

  // Filtrer les messages invisibles avec dépendance sur les polices
  const visibleMessages = React.useMemo(
    () => messages.filter((message) => !(message as any).isInvisible),
    [messages, fonts.content]
  );

  const handleContentSizeChange = useCallback(
    (width: number, height: number) => {
      onContentSizeChange(width, height);
    },
    [onContentSizeChange]
  );

  const handleScroll = useCallback(
    (event: any) => {
      onScroll(event);
    },
    [onScroll]
  );

  return (
    <ScrollView
      ref={scrollViewRef}
      style={tw`flex-1 px-2`} // Réduit le padding horizontal de px-4 à px-2
      contentContainerStyle={[
        tw`pt-4`,
        {
          paddingBottom: 160, // Augmenté pour déplacer les messages plus haut
          flexGrow: 1,
        },
      ]}
      showsVerticalScrollIndicator={true}
      keyboardShouldPersistTaps="handled"
      onContentSizeChange={handleContentSizeChange}
      onLayout={onLayout}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      removeClippedSubviews={false}
      nestedScrollEnabled={true}
      scrollEnabled={true}
      bounces={true}
      alwaysBounceVertical={false}
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 10,
      }}
    >
      {visibleMessages.map((message, index) => (
        <ChatMessage
          key={`${message.id}-${fonts.content}`}
          message={message}
          index={index}
          isNewMessage={newMessageIds.has(message.id)}
          onSaveToEditor={saveMessageAsScript}
          onEditMessage={handleEditMessage}
        />
      ))}

      <TypingIndicator
        isVisible={isTyping && isLoading}
        message="L'IA génère une réponse..."
      />

      {/* Espace supplémentaire pour l'input flottant */}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
};

export default ChatMessages;
