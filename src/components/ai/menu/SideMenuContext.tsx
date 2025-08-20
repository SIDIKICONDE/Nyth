import AsyncStorage from "@react-native-async-storage/async-storage";
import * as React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { SavedConversation } from "../../../types/chat";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';
const logger = createOptimizedLogger('SideMenuContext');

interface SideMenuContextType {
  conversations: SavedConversation[];
  filteredConversations: SavedConversation[];
  isLoading: boolean;
  searchText: string;
  activeTab: "recent" | "all";
  selectedConversation: SavedConversation | null;
  contextMenuVisible: boolean;
  loadConversations: () => Promise<void>;
  filterConversations: (text: string) => void;
  switchTab: (tab: "recent" | "all") => void;
  setSelectedConversation: (conversation: SavedConversation | null) => void;
  setContextMenuVisible: (visible: boolean) => void;
  deleteConversation: (
    conversationId: string,
    currentConversationId?: string,
    onNewConversation?: () => void
  ) => Promise<void>;
}

const SideMenuContext = createContext<SideMenuContextType | undefined>(
  undefined
);

export const useSideMenu = () => {
  const context = useContext(SideMenuContext);
  if (!context) {
    throw new Error("useSideMenu must be used within a SideMenuProvider");
  }
  return context;
};

interface SideMenuProviderProps {
  children: React.ReactNode;
}

export const SideMenuProvider: React.FC<SideMenuProviderProps> = ({
  children,
}) => {
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<
    SavedConversation[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState<"recent" | "all">("recent");
  const [selectedConversation, setSelectedConversation] =
    useState<SavedConversation | null>(null);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Charger les conversations au montage initial
  useEffect(() => {
    loadConversations();
  }, []);

  // Load conversations
  const loadConversations = useCallback(
    async (forceReload = false) => {
      try {
        // Si déjà chargé une fois et pas de forceReload, ne pas recharger
        if (!forceReload && hasLoadedOnce && conversations.length > 0) {
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        const savedConversationsJson = await AsyncStorage.getItem(
          "ai_conversations"
        );

        if (savedConversationsJson) {
          const savedConversations: SavedConversation[] = JSON.parse(
            savedConversationsJson
          );

          // Sort by date (most recent first)
          savedConversations.sort(
            (a, b) =>
              new Date(b.lastUpdated).getTime() -
              new Date(a.lastUpdated).getTime()
          );

          setConversations(savedConversations);

          // Show the most recent conversations by default
          setFilteredConversations(savedConversations.slice(0, 10));
        } else {
          setConversations([]);
          setFilteredConversations([]);
        }

        setHasLoadedOnce(true);
      } catch (error) {
        logger.error("Error loading conversations:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [hasLoadedOnce, conversations.length]
  );

  // Filter conversations based on search
  const filterConversations = (text: string) => {
    setSearchText(text);

    if (!text.trim()) {
      // If search field is empty, show all conversations or recent ones
      setFilteredConversations(
        activeTab === "recent" ? conversations.slice(0, 10) : conversations
      );
      return;
    }

    // Filter by title or content
    const filtered = conversations.filter((conversation) => {
      // Check title
      const titleMatch = conversation.title
        .toLowerCase()
        .includes(text.toLowerCase());

      // Check message content
      const contentMatch = conversation.messages.some((msg) =>
        msg.content.toLowerCase().includes(text.toLowerCase())
      );

      return titleMatch || contentMatch;
    });

    setFilteredConversations(filtered);
  };

  // Switch tab
  const switchTab = (tab: "recent" | "all") => {
    setActiveTab(tab);

    // Filter conversations
    if (tab === "recent") {
      // Show the 10 most recent conversations
      setFilteredConversations(conversations.slice(0, 10));
    } else {
      // Filter based on search or show all conversations
      filterConversations(searchText);
    }
  };

  // Delete a conversation
  const deleteConversation = async (
    conversationId: string,
    currentConversationId?: string,
    onNewConversation?: () => void
  ) => {
    try {
      const savedConversationsJson = await AsyncStorage.getItem(
        "ai_conversations"
      );

      if (savedConversationsJson) {
        let savedConversations: SavedConversation[] = JSON.parse(
          savedConversationsJson
        );

        // Filter to remove the conversation to delete
        savedConversations = savedConversations.filter(
          (conv) => conv.id !== conversationId
        );

        // Save updated conversations
        await AsyncStorage.setItem(
          "ai_conversations",
          JSON.stringify(savedConversations)
        );

        // Update state
        setConversations(savedConversations);
        filterConversations(searchText);

        // If current conversation is deleted, create a new conversation
        if (conversationId === currentConversationId && onNewConversation) {
          onNewConversation();
        }
      }
    } catch (error) {
      logger.error("Error deleting conversation:", error);
      throw new Error("Unable to delete conversation.");
    }
  };

  const value = {
    conversations,
    filteredConversations,
    isLoading,
    searchText,
    activeTab,
    selectedConversation,
    contextMenuVisible,
    loadConversations,
    filterConversations,
    switchTab,
    setSelectedConversation,
    setContextMenuVisible,
    deleteConversation,
  };

  return (
    <SideMenuContext.Provider value={value}>
      {children}
    </SideMenuContext.Provider>
  );
};

export default SideMenuContext;
