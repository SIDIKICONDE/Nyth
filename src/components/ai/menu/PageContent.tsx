import React, { useMemo } from "react";
import { Animated, View } from "react-native";
import tw from "twrnc";
import { useConversationView } from "../../../contexts/ConversationViewContext";
import { SavedConversation } from "../../../types/chat";
import ChatSettingsSection from "./ChatSettingsSection";
import ConversationList from "./ConversationList";
import ConversationListAlternative from "./ConversationListAlternative";
import ConversationListiOS from "./ConversationListiOS";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';
const logger = createOptimizedLogger('PageContent');

interface PageContentProps {
  currentPage: number;
  fadeAnim: Animated.Value;
  onClose: () => void;
  // Props pour la page Conversations
  filteredConversations: SavedConversation[];
  isLoading: boolean;
  searchText: string;
  currentConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onLongPress: (conversation: SavedConversation) => void;
}

const PageContent: React.FC<PageContentProps> = ({
  currentPage,
  fadeAnim,
  onClose,
  filteredConversations,
  isLoading,
  searchText,
  currentConversationId,
  onSelectConversation,
  onLongPress,
}) => {
  const { viewType, isLoading: viewLoading } = useConversationView();

  // Debug pour vérifier les changements de viewType
  React.useEffect(() => {
    logger.debug(
      "🔄 PageContent - viewType changed to:",
      viewType,
      "isLoading:",
      viewLoading
    );
  }, [viewType, viewLoading]);

  // Mémoriser les composants pour éviter les rechargements
  const settingsPage = useMemo(
    () => (
      <View style={tw`flex-1`}>
        <ChatSettingsSection
          onBack={() => {}} // Pas besoin de retour, on utilise les onglets
          onClose={onClose}
        />
      </View>
    ),
    [onClose]
  );

  // Fonction pour obtenir le composant de conversation approprié
  const getConversationComponent = React.useCallback(() => {
    logger.debug("🎯 PageContent - selecting component for viewType:", viewType);

    switch (viewType) {
      case "ios":
        logger.debug("📱 Using ConversationListiOS");
        return ConversationListiOS;
      case "cards":
        logger.debug("🃏 Using ConversationListAlternative (cards)");
        return ConversationListAlternative;
      case "sections":
      default:
        logger.debug("📋 Using ConversationList (sections)");
        return ConversationList;
    }
  }, [viewType]);

  const conversationsPage = useMemo(() => {
    // Ne pas rendre si le viewType est encore en cours de chargement
    if (viewLoading) {
      logger.debug(
        "⏳ PageContent - viewType still loading, showing placeholder"
      );
      return (
        <View style={tw`flex-1 items-center justify-center`}>
          {/* Placeholder pendant le chargement */}
        </View>
      );
    }

    const ConversationComponent = getConversationComponent();

    logger.debug(
      "🔄 PageContent - rendering conversations with component:",
      ConversationComponent.name
    );

    return (
      <View
        key={`conversation-${viewType}`} // Clé basée sur viewType pour forcer le re-render
        style={[tw`flex-1 px-3`, { maxWidth: "100%", overflow: "hidden" }]}
      >
        <ConversationComponent
          conversations={filteredConversations}
          isLoading={isLoading}
          searchText={searchText}
          currentConversationId={currentConversationId}
          onSelectConversation={onSelectConversation}
          onLongPress={onLongPress}
          onClose={onClose}
        />
      </View>
    );
  }, [
    viewType,
    viewLoading,
    getConversationComponent,
    filteredConversations,
    isLoading,
    searchText,
    currentConversationId,
    onSelectConversation,
    onLongPress,
    onClose,
  ]);

  // Debug pour vérifier les re-rendus
  React.useEffect(() => {
    logger.debug("🔄 PageContent re-rendered with:", {
      currentPage,
      viewType,
      viewLoading,
      conversationsCount: filteredConversations.length,
    });
  }, [currentPage, viewType, viewLoading, filteredConversations.length]);

  return (
    <Animated.View style={[tw`flex-1`, { opacity: fadeAnim }]}>
      {currentPage === 0 ? settingsPage : conversationsPage}
    </Animated.View>
  );
};

export default PageContent;
