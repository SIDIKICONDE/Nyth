import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import * as React from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { SavedConversation } from "../../../types/chat";
import { UIText } from "../../ui/Typography";

interface ConversationListAlternativeProps {
  conversations: SavedConversation[];
  isLoading: boolean;
  searchText: string;
  currentConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onLongPress: (conversation: SavedConversation) => void;
  onClose: () => void;
}

// Composant pour un item de conversation en style carte
const ConversationCard: React.FC<{
  conversation: SavedConversation;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
  index: number;
}> = ({ conversation, isSelected, onPress, onLongPress, index }) => {
  const { currentTheme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, slideAnim, index]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Aujourd'hui";
    if (diffDays === 2) return "Hier";
    if (diffDays <= 7) return `Il y a ${diffDays - 1} jours`;
    return date.toLocaleDateString();
  };

  const getPreviewText = () => {
    if (conversation.messages && conversation.messages.length > 0) {
      const lastMessage =
        conversation.messages[conversation.messages.length - 1];
      return (
        lastMessage.content.slice(0, 100) +
        (lastMessage.content.length > 100 ? "..." : "")
      );
    }
    return "Nouvelle conversation";
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        style={[
          tw`mx-3 mb-3 p-4 rounded-2xl`,
          {
            backgroundColor: isSelected
              ? currentTheme.colors.accent + "15"
              : currentTheme.isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.04)",
            borderWidth: isSelected ? 1.5 : 0,
            borderColor: isSelected
              ? currentTheme.colors.accent
              : "transparent",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
            maxWidth: "100%",
            overflow: "hidden",
          },
        ]}
        activeOpacity={0.8}
      >
        {/* En-tête avec titre et date */}
        <View
          style={[
            tw`flex-row items-start justify-between mb-2`,
            { maxWidth: "100%" },
          ]}
        >
          <View style={[tw`flex-1 mr-3`, { minWidth: 0 }]}>
            <UIText
              size="base"
              weight="semibold"
              color={
                isSelected
                  ? currentTheme.colors.accent
                  : currentTheme.colors.text
              }
              numberOfLines={1}
            >
              {conversation.title || "Sans titre"}
            </UIText>
          </View>
          <View style={[tw`flex-row items-center`, { flexShrink: 0 }]}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={12}
              color={currentTheme.colors.textSecondary}
              style={{ opacity: 0.6 }}
            />
            <UIText
              size="xs"
              color={currentTheme.colors.textSecondary}
              style={[tw`ml-1`, { opacity: 0.8 }]}
            >
              {formatDate(conversation.lastUpdated)}
            </UIText>
          </View>
        </View>

        {/* Aperçu du contenu */}
        <UIText
          size="sm"
          color={currentTheme.colors.textSecondary}
          style={[tw`leading-5 mb-3`, { opacity: 0.9 }]}
          numberOfLines={2}
        >
          {getPreviewText()}
        </UIText>

        {/* Badges et statistiques */}
        <View style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center`}>
            <View
              style={[
                tw`px-2 py-1 rounded-full mr-2`,
                {
                  backgroundColor: currentTheme.colors.accent + "20",
                },
              ]}
            >
              <UIText
                size="xs"
                weight="medium"
                color={currentTheme.colors.accent}
              >
                {conversation.messages?.length || 0} messages
              </UIText>
            </View>
          </View>

          {isSelected && (
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color={currentTheme.colors.accent}
            />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ConversationListAlternative: React.FC<
  ConversationListAlternativeProps
> = ({
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
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Trier les conversations par date (plus récent en premier)
  const sortedConversations = React.useMemo(() => {
    return [...conversations].sort(
      (a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
  }, [conversations]);

  const renderConversationCard = ({
    item,
    index,
  }: {
    item: SavedConversation;
    index: number;
  }) => (
    <ConversationCard
      conversation={item}
      isSelected={item.id === currentConversationId}
      onPress={() => {
        onSelectConversation(item.id);
        onClose();
      }}
      onLongPress={() => onLongPress(item)}
      index={index}
    />
  );

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <View
          style={[
            tw`w-16 h-16 rounded-2xl items-center justify-center mb-4`,
            {
              backgroundColor: currentTheme.colors.accent + "20",
            },
          ]}
        >
          <ActivityIndicator size="large" color={currentTheme.colors.accent} />
        </View>
        <UIText size="base" weight="medium" color={currentTheme.colors.text}>
          {t("menu.loading", "Chargement des conversations...")}
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
        {/* Illustration moderne */}
        <View
          style={[
            tw`w-32 h-32 rounded-3xl items-center justify-center mb-6`,
            {
              backgroundColor: currentTheme.isDark
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.03)",
            },
          ]}
        >
          <MaterialCommunityIcons
            name="chat-plus-outline"
            size={64}
            color={currentTheme.colors.accent}
            style={{ opacity: 0.4 }}
          />
        </View>

        {searchText.length > 0 ? (
          <>
            <UIText
              size="xl"
              weight="bold"
              color={currentTheme.colors.text}
              style={tw`text-center mb-3`}
            >
              Aucun résultat trouvé
            </UIText>
            <UIText
              size="base"
              color={currentTheme.colors.textSecondary}
              style={[tw`text-center leading-6`, { opacity: 0.8 }]}
            >
              Essayez avec d'autres mots-clés ou vérifiez l'orthographe
            </UIText>
          </>
        ) : (
          <>
            <UIText
              size="xl"
              weight="bold"
              color={currentTheme.colors.text}
              style={tw`text-center mb-3`}
            >
              Commencez une nouvelle conversation
            </UIText>
            <UIText
              size="base"
              color={currentTheme.colors.textSecondary}
              style={[tw`text-center leading-6`, { opacity: 0.8 }]}
            >
              Vos conversations apparaîtront ici une fois que vous aurez
              commencé à discuter
            </UIText>
          </>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[tw`flex-1`, { opacity: fadeAnim }]}>
      {/* En-tête avec statistiques */}
      <View style={tw`px-4 py-1 mb-0`}>
        <View style={tw`flex-row items-center justify-between`}>
          <UIText
            size="sm"
            weight="medium"
            color={currentTheme.colors.textSecondary}
          >
            {conversations.length} conversation
            {conversations.length > 1 ? "s" : ""}
          </UIText>
          <View style={tw`flex-row items-center`}>
            <MaterialCommunityIcons
              name="view-grid"
              size={16}
              color={currentTheme.colors.accent}
            />
            <UIText
              size="xs"
              weight="medium"
              color={currentTheme.colors.accent}
              style={tw`ml-1`}
            >
              Vue cartes
            </UIText>
          </View>
        </View>
      </View>

      <FlatList
        data={sortedConversations}
        renderItem={renderConversationCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={tw`pt-0 pb-24`}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={8}
      />
    </Animated.View>
  );
};

export default ConversationListAlternative;
