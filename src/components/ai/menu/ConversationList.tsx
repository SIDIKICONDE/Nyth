import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import * as React from "react";
import { ActivityIndicator, Animated, SectionList, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { SavedConversation } from "../../../types/chat";
import { UIText } from "../../ui/Typography";
import ConversationItem from "./ConversationItem";

interface ConversationListProps {
  conversations: SavedConversation[];
  isLoading: boolean;
  searchText: string;
  currentConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onLongPress: (conversation: SavedConversation) => void;
  onClose: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  isLoading,
  searchText,
  currentConversationId,
  onSelectConversation,
  onLongPress,
  onClose,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Organiser les conversations par sections
  const organizeSections = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const sections = [
      {
        title: t("menu.today", "Aujourd'hui"),
        data: [] as SavedConversation[],
      },
      { title: t("menu.yesterday", "Hier"), data: [] as SavedConversation[] },
      {
        title: t("menu.thisWeek", "Cette semaine"),
        data: [] as SavedConversation[],
      },
      {
        title: t("menu.older", "Plus ancien"),
        data: [] as SavedConversation[],
      },
    ];

    conversations.forEach((conv) => {
      const convDate = new Date(conv.lastUpdated);

      if (convDate.toDateString() === today.toDateString()) {
        sections[0].data.push(conv);
      } else if (convDate.toDateString() === yesterday.toDateString()) {
        sections[1].data.push(conv);
      } else if (convDate > weekAgo) {
        sections[2].data.push(conv);
      } else {
        sections[3].data.push(conv);
      }
    });

    // Filtrer les sections vides
    return sections.filter((section) => section.data.length > 0);
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={tw`px-5 pt-4 pb-2`}>
      <UIText
        size="xs"
        weight="semibold"
        style={[
          tw`uppercase`,
          {
            color: currentTheme.colors.textSecondary,
            letterSpacing: 1.2,
            opacity: 0.7,
          },
        ]}
      >
        {section.title}
      </UIText>
    </View>
  );

  const renderConversationItem = ({ item }: { item: SavedConversation }) => (
    <ConversationItem
      conversation={item}
      isSelected={item.id === currentConversationId}
      onPress={() => {
        onSelectConversation(item.id);
        onClose();
      }}
      onLongPress={onLongPress}
    />
  );

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color={currentTheme.colors.accent} />
        <UIText
          size="sm"
          style={[tw`mt-3`, { color: currentTheme.colors.textSecondary }]}
        >
          {t("menu.loading", "Chargement...")}
        </UIText>
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <Animated.View
        style={[
          tw`flex-1 justify-center items-center px-8`,
          { opacity: fadeAnim },
        ]}
      >
        {/* Illustration vide style Apple */}
        <View
          style={[
            tw`w-24 h-24 rounded-full items-center justify-center mb-4`,
            {
              backgroundColor: currentTheme.isDark
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.03)",
            },
          ]}
        >
          <MaterialCommunityIcons
            name="chat-outline"
            size={48}
            color={currentTheme.colors.textSecondary}
            style={{ opacity: 0.3 }}
          />
        </View>

        {searchText.length > 0 ? (
          <>
            <UIText
              size="lg"
              weight="semibold"
              style={[
                tw`text-center mb-2`,
                { color: currentTheme.colors.text },
              ]}
            >
              {t("menu.noResults")}
            </UIText>
            <UIText
              size="sm"
              style={[
                tw`text-center`,
                {
                  color: currentTheme.colors.textSecondary,
                  opacity: 0.7,
                },
              ]}
            >
              {t("menu.noResultsSubtitle")}
            </UIText>
          </>
        ) : (
          <>
            <UIText
              size="lg"
              weight="semibold"
              style={[
                tw`text-center mb-2`,
                { color: currentTheme.colors.text },
              ]}
            >
              {t("menu.noConversations")}
            </UIText>
            <UIText
              size="sm"
              style={[
                tw`text-center`,
                {
                  color: currentTheme.colors.textSecondary,
                  opacity: 0.7,
                },
              ]}
            >
              {t("menu.noConversationsSubtitle")}
            </UIText>
          </>
        )}
      </Animated.View>
    );
  }

  const sections = organizeSections();

  return (
    <Animated.View style={[tw`flex-1`, { opacity: fadeAnim }]}>
      <SectionList
        sections={sections}
        renderItem={renderConversationItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        contentContainerStyle={tw`pt-0 pb-24`}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => <View style={tw`h-1`} />}
        SectionSeparatorComponent={() => <View style={tw`h-2`} />}
      />
    </Animated.View>
  );
};

export default ConversationList;
