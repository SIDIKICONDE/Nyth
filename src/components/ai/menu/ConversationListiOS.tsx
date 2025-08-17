import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import * as React from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useConversationListView } from "../../../hooks/useConversationListView";
import { useTranslation } from "../../../hooks/useTranslation";
import { SavedConversation } from "../../../types/chat";
import { UIText } from "../../ui/Typography";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';
const logger = createOptimizedLogger('ConversationListiOS');

interface ConversationListiOSProps {
  conversations: SavedConversation[];
  isLoading: boolean;
  searchText: string;
  currentConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onLongPress: (conversation: SavedConversation) => void;
  onClose: () => void;
}

// Composant pour une carte de conversation style iOS
const IOSConversationCard: React.FC<{
  conversation: SavedConversation;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
  index: number;
  animationKey: string; // Nouvelle prop pour déclencher les animations
}> = ({
  conversation,
  isSelected,
  onPress,
  onLongPress,
  index,
  animationKey,
}) => {
  const { currentTheme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  // Réinitialiser et déclencher l'animation à chaque changement d'animationKey
  React.useEffect(() => {
    // Réinitialiser les valeurs
    scaleAnim.setValue(0);
    slideAnim.setValue(30);

    // Déclencher l'animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 80, // Délai réduit pour plus de fluidité
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animationKey, index]); // Dépend maintenant d'animationKey

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Maintenant";
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  const getPreviewText = () => {
    if (conversation.messages && conversation.messages.length > 0) {
      const lastMessage =
        conversation.messages[conversation.messages.length - 1];
      return (
        lastMessage.content.slice(0, 85) +
        (lastMessage.content.length > 85 ? "..." : "")
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
          tw`mx-4 mb-3 rounded-3xl overflow-hidden`,
          {
            backgroundColor: currentTheme.isDark
              ? "rgba(28, 28, 30, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
            borderWidth: isSelected ? 2 : 0,
            borderColor: isSelected
              ? currentTheme.colors.accent
              : "transparent",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: currentTheme.isDark ? 0.3 : 0.1,
            shadowRadius: 10,
            elevation: 5,
            maxWidth: "100%",
            ...(Platform.OS === "ios" && {
              shadowColor: currentTheme.isDark ? "#000" : "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: currentTheme.isDark ? 0.4 : 0.08,
              shadowRadius: 8,
            }),
          },
        ]}
        activeOpacity={0.9}
      >
        <View style={tw`p-4`}>
          {/* En-tête avec icône et temps */}
          <View
            style={[
              tw`flex-row items-start justify-between mb-2`,
              { maxWidth: "100%" },
            ]}
          >
            <View style={[tw`flex-row items-center flex-1`, { minWidth: 0 }]}>
              {/* Icône de l'app style iOS */}
              <View
                style={[
                  tw`w-10 h-10 rounded-2xl items-center justify-center mr-3`,
                  {
                    backgroundColor: isSelected
                      ? currentTheme.colors.accent
                      : currentTheme.colors.accent + "15",
                    flexShrink: 0,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="chat"
                  size={20}
                  color={isSelected ? "#FFFFFF" : currentTheme.colors.accent}
                />
              </View>

              <View style={[tw`flex-1`, { minWidth: 0 }]}>
                <UIText
                  size="base"
                  weight="semibold"
                  style={[
                    {
                      color: currentTheme.colors.text,
                    },
                  ]}
                  numberOfLines={1}
                >
                  CamPrompt AI
                </UIText>
                <UIText
                  size="xs"
                  style={[
                    tw`mt-0.5`,
                    {
                      color: currentTheme.colors.textSecondary,
                      opacity: 0.8,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {conversation.title || "Conversation"}
                </UIText>
              </View>
            </View>

            <UIText
              size="xs"
              weight="medium"
              style={[
                {
                  color: currentTheme.colors.textSecondary,
                  opacity: 0.7,
                  flexShrink: 0,
                },
              ]}
            >
              {formatTime(conversation.lastUpdated)}
            </UIText>
          </View>

          {/* Contenu du message */}
          <UIText
            size="sm"
            style={[
              tw`leading-5 mb-3`,
              {
                color: currentTheme.colors.text,
                opacity: 0.9,
              },
            ]}
            numberOfLines={2}
          >
            {getPreviewText()}
          </UIText>

          {/* Badge de compteur style iOS */}
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center`}>
              {/* Badge du nombre de messages supprimé */}
            </View>

            {isSelected && (
              <View
                style={[
                  tw`w-6 h-6 rounded-full items-center justify-center`,
                  {
                    backgroundColor: currentTheme.colors.accent,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="check"
                  size={14}
                  color="#FFFFFF"
                />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Hook pour détecter les changements de vue iOS
const useIOSViewTrigger = () => {
  const { viewType } = useConversationListView();
  const [triggerKey, setTriggerKey] = React.useState(() =>
    Date.now().toString()
  );
  const previousViewType = React.useRef(viewType);

  React.useEffect(() => {
    // Déclencher seulement si on passe À la vue iOS (pas si on était déjà en iOS)
    if (viewType === "ios" && previousViewType.current !== "ios") {
      // Déclencher les animations quand on passe à la vue iOS
      const newKey = Date.now().toString();
      setTriggerKey(newKey);
      logger.debug("🎯 iOS view activated - new animation key:", newKey);
    }
    previousViewType.current = viewType;
    return undefined;
  }, [viewType]);

  return triggerKey;
};

const ConversationListiOS: React.FC<ConversationListiOSProps> = ({
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

  // Utiliser le hook pour détecter les changements de vue
  const viewTriggerKey = useIOSViewTrigger();

  // Clé d'animation qui change à chaque fois que le composant est visible
  const [animationKey, setAnimationKey] = React.useState(() =>
    Date.now().toString()
  );

  // Mémoriser la longueur des conversations pour éviter les re-renders inutiles
  const conversationsLength = React.useMemo(
    () => conversations.length,
    [conversations.length]
  );

  // Déclencher les animations quand le trigger de vue change
  React.useEffect(() => {
    // Réinitialiser l'animation de fade
    fadeAnim.setValue(0);

    // Utiliser la clé du trigger de vue
    setAnimationKey(viewTriggerKey);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    logger.debug("🎬 iOS animations triggered with key:", viewTriggerKey);
  }, [viewTriggerKey]); // Se déclenche quand on change vers la vue iOS

  // Déclencher les animations seulement quand le nombre de conversations change significativement
  const previousLength = React.useRef(conversationsLength);
  React.useEffect(() => {
    // Vérifier si c'est un vrai changement (pas juste un re-render)
    if (
      conversationsLength > 0 &&
      conversationsLength !== previousLength.current
    ) {
      logger.debug(
        "🔄 Conversations count changed from",
        previousLength.current,
        "to",
        conversationsLength
      );

      // Petit délai pour s'assurer que les cartes sont prêtes
      const timer = setTimeout(() => {
        setAnimationKey(Date.now().toString());
        logger.debug("🔄 iOS animations refreshed for conversations");
      }, 100);

      previousLength.current = conversationsLength;
      return () => clearTimeout(timer);
    }
    previousLength.current = conversationsLength;
    return undefined;
  }, [conversationsLength]);

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
    <IOSConversationCard
      conversation={item}
      isSelected={item.id === currentConversationId}
      onPress={() => {
        onSelectConversation(item.id);
        onClose();
      }}
      onLongPress={() => onLongPress(item)}
      index={index}
      animationKey={animationKey}
    />
  );

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <View
          style={[
            tw`w-20 h-20 rounded-3xl items-center justify-center mb-6`,
            {
              backgroundColor: currentTheme.isDark
                ? "rgba(28, 28, 30, 0.95)"
                : "rgba(255, 255, 255, 0.95)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 8,
            },
          ]}
        >
          <ActivityIndicator size="large" color={currentTheme.colors.accent} />
        </View>
        <UIText
          size="base"
          weight="semibold"
          style={[
            {
              color: currentTheme.colors.text,
            },
          ]}
        >
          Chargement...
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
        {/* Illustration style iOS */}
        <View
          style={[
            tw`w-36 h-36 rounded-3xl items-center justify-center mb-8`,
            {
              backgroundColor: currentTheme.isDark
                ? "rgba(28, 28, 30, 0.95)"
                : "rgba(255, 255, 255, 0.95)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 10,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="chat-plus-outline"
            size={72}
            color={currentTheme.colors.accent}
            style={{ opacity: 0.6 }}
          />
        </View>

        {searchText.length > 0 ? (
          <>
            <UIText
              size="2xl"
              weight="bold"
              style={[
                tw`text-center mb-4`,
                {
                  color: currentTheme.colors.text,
                },
              ]}
            >
              Aucun résultat
            </UIText>
            <UIText
              size="base"
              style={[
                tw`text-center leading-6`,
                {
                  color: currentTheme.colors.textSecondary,
                  opacity: 0.8,
                },
              ]}
            >
              Essayez d'autres mots-clés pour trouver vos conversations
            </UIText>
          </>
        ) : (
          <>
            <UIText
              size="2xl"
              weight="bold"
              style={[
                tw`text-center mb-4`,
                {
                  color: currentTheme.colors.text,
                },
              ]}
            >
              Aucune conversation
            </UIText>
            <UIText
              size="base"
              style={[
                tw`text-center leading-6`,
                {
                  color: currentTheme.colors.textSecondary,
                  opacity: 0.8,
                },
              ]}
            >
              Commencez une nouvelle conversation avec l'IA pour voir vos
              discussions ici
            </UIText>
          </>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[tw`flex-1`, { opacity: fadeAnim }]}>
      {/* En-tête style iOS */}
      <View style={tw`px-4 py-2 mb-1`}>
        <View style={tw`flex-row items-center justify-between`}>
          <UIText
            size="sm"
            weight="semibold"
            style={[
              {
                color: currentTheme.colors.textSecondary,
                opacity: 0.8,
              },
            ]}
          >
            {conversations.length} conversation
            {conversations.length > 1 ? "s" : ""}
          </UIText>
          <View style={tw`flex-row items-center`}>
            <MaterialCommunityIcons
              name="apple-ios"
              size={16}
              color={currentTheme.colors.accent}
            />
            <UIText
              size="xs"
              weight="semibold"
              style={[
                tw`ml-1`,
                {
                  color: currentTheme.colors.accent,
                },
              ]}
            >
              Style iOS
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
        maxToRenderPerBatch={8}
        windowSize={10}
        initialNumToRender={6}
        scrollEventThrottle={16}
      />
    </Animated.View>
  );
};

export default ConversationListiOS;
