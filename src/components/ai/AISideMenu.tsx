import * as React from "react";
import { useState } from "react";
import { Alert, Animated, View } from "react-native";
import { ConversationViewProvider } from "../../contexts/ConversationViewContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { SavedConversation } from "../../types/chat";
import {
  ContextMenu,
  MenuContainer,
  PageContent,
  SideMenuProvider,
  SwipeableContent,
  TabNavigation,
  UserProfileSection,
  useSideMenu,
} from "./menu";
import {
  copyConversationContent,
  shareConversation,
} from "./menu/ConversationActions";

interface AISideMenuProps {
  isVisible: boolean;
  onClose: () => void;
  currentConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
}

const AISideMenuContent: React.FC<AISideMenuProps> = ({
  isVisible,
  onClose,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const {
    conversations,
    filteredConversations,
    isLoading,
    searchText,
    selectedConversation,
    contextMenuVisible,
    loadConversations,
    filterConversations,
    setSelectedConversation,
    setContextMenuVisible,
    deleteConversation,
  } = useSideMenu();

  const [currentPage, setCurrentPage] = useState(1);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  // Les conversations sont déjà chargées dans le provider au montage initial

  // Gestion du menu contextuel
  const handleLongPress = (conversation: SavedConversation) => {
    setSelectedConversation(conversation);
    setContextMenuVisible(true);
  };

  const handleCopy = () => {
    if (selectedConversation) {
      copyConversationContent(selectedConversation, t);
      setContextMenuVisible(false);
    }
  };

  const handleShare = async () => {
    if (selectedConversation) {
      await shareConversation(selectedConversation, t);
      setContextMenuVisible(false);
    }
  };

  const handleDelete = () => {
    if (selectedConversation) {
      Alert.alert(
        t("menu.deleteTitle"),
        t("menu.deleteMessage"),
        [
          {
            text: t("common.cancel"),
            style: "cancel",
          },
          {
            text: t("menu.delete"),
            style: "destructive",
            onPress: async () => {
              try {
                await deleteConversation(
                  selectedConversation.id,
                  currentConversationId,
                  onNewConversation
                );
                setContextMenuVisible(false);
                setSelectedConversation(null);
                Alert.alert(t("common.success"), t("menu.deleteSuccess"));
              } catch (error) {
                Alert.alert(t("common.error"), t("menu.deleteError"));
              }
            },
          },
        ],
        { cancelable: true }
      );
    }
  };

  // Navigation entre les onglets avec animation douce
  const handlePageChange = (pageIndex: number) => {
    if (pageIndex === currentPage) return;

    // Animation plus douce qui ne fait pas complètement disparaître le contenu
    Animated.timing(fadeAnim, {
      toValue: 0.3,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setCurrentPage(pageIndex);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <>
      <MenuContainer isVisible={isVisible} onClose={onClose}>
        <View style={{ flex: 1 }}>
          {/* Section profil utilisateur */}
          <UserProfileSection
            onNewConversation={onNewConversation}
            onClose={onClose}
          />

          {/* Navigation par onglets */}
          <TabNavigation
            currentPage={currentPage}
            onPageChange={handlePageChange}
            searchText={searchText}
            onSearchChange={filterConversations}
          />

          {/* Contenu avec gestion du swipe */}
          <SwipeableContent
            currentPage={currentPage}
            onPageChange={handlePageChange}
          >
            <PageContent
              currentPage={currentPage}
              fadeAnim={fadeAnim}
              onClose={onClose}
              filteredConversations={filteredConversations}
              isLoading={isLoading}
              searchText={searchText}
              currentConversationId={currentConversationId}
              onSelectConversation={onSelectConversation}
              onLongPress={handleLongPress}
            />
          </SwipeableContent>
        </View>
      </MenuContainer>

      <ContextMenu
        visible={contextMenuVisible}
        conversation={selectedConversation}
        onCopy={handleCopy}
        onShare={handleShare}
        onDelete={handleDelete}
        onClose={() => setContextMenuVisible(false)}
      />
    </>
  );
};

// Composant principal avec le provider
const AISideMenu: React.FC<AISideMenuProps> = (props) => {
  return (
    <ConversationViewProvider>
      <SideMenuProvider>
        <AISideMenuContent {...props} />
      </SideMenuProvider>
    </ConversationViewProvider>
  );
};

export default AISideMenu;
