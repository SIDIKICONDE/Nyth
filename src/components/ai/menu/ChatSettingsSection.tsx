import FontOptionsMenu from "@/components/ai/FontOptionsMenu";
import ChatStyleSelector from "@/components/chat/ChatStyleSelector";
import InputStyleSelector from "@/components/chat/InputStyleSelector";
import { MessageLayoutSettings } from "@/components/settings/message-layout";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as React from "react";
import {
  Animated,
  ScrollView,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";
import { useChat } from "../../../contexts/ChatContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useChatPreferences } from "../../../hooks/useChatPreferences";
import { useTranslation } from "../../../hooks/useTranslation";
import { UIText } from "../../ui/Typography";
import ConversationViewSelector from "./ConversationViewSelector";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';
const logger = createOptimizedLogger('ChatSettingsSection');

interface ChatSettingsSectionProps {
  onBack: () => void;
  onClose: () => void;
}

interface CollapsibleSectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  sectionKey: string;
}

// Hook pour gérer l'état des sections - OPTIMISÉ
const useSectionStates = () => {
  const [sectionStates, setSectionStates] = React.useState<
    Record<string, boolean>
  >({});
  const [isLoaded, setIsLoaded] = React.useState(false);
  const loadedRef = React.useRef(false);

  // Charger l'état des sections au démarrage - UNE SEULE FOIS
  React.useEffect(() => {
    if (loadedRef.current) return;

    const loadSectionStates = async () => {
      try {
        const savedStates = await AsyncStorage.getItem(
          "@chat_settings_sections"
        );
        if (savedStates) {
          const parsed = JSON.parse(savedStates);
          setSectionStates(parsed);
        }
        setIsLoaded(true);
        loadedRef.current = true;
      } catch (error) {
        logger.error(
          "Erreur lors du chargement des états des sections:",
          error
        );
        setIsLoaded(true);
        loadedRef.current = true;
      }
    };
    loadSectionStates();
  }, []);

  // Mémoriser la fonction de mise à jour
  const updateSectionState = React.useCallback(
    async (sectionKey: string, isExpanded: boolean) => {
      try {
        const newStates = { ...sectionStates, [sectionKey]: isExpanded };
        setSectionStates(newStates);
        await AsyncStorage.setItem(
          "@chat_settings_sections",
          JSON.stringify(newStates)
        );
      } catch (error) {
        logger.error(
          "Erreur lors de la sauvegarde de l'état de section:",
          error
        );
      }
    },
    [sectionStates]
  );

  return { sectionStates, updateSectionState, isLoaded };
};

const CollapsibleSection: React.FC<CollapsibleSectionProps> = React.memo(
  ({ title, icon, children, defaultExpanded = false, sectionKey }) => {
    const { currentTheme } = useTheme();
    const { sectionStates, updateSectionState, isLoaded } = useSectionStates();

    // Déterminer l'état initial basé sur la sauvegarde ou la valeur par défaut
    const getInitialExpanded = React.useCallback(() => {
      if (!isLoaded) return defaultExpanded;
      return sectionStates[sectionKey] !== undefined
        ? sectionStates[sectionKey]
        : defaultExpanded;
    }, [isLoaded, sectionStates, sectionKey, defaultExpanded]);

    const [isExpanded, setIsExpanded] = React.useState(getInitialExpanded);
    const [isInitialized, setIsInitialized] = React.useState(false);
    const animatedHeight = React.useRef(
      new Animated.Value(getInitialExpanded() ? 1 : 0)
    ).current;
    const rotateAnim = React.useRef(
      new Animated.Value(getInitialExpanded() ? 1 : 0)
    ).current;

    // Mettre à jour l'état quand les données sont chargées - OPTIMISÉ
    React.useEffect(() => {
      if (isLoaded && !isInitialized) {
        const shouldBeExpanded = getInitialExpanded();
        setIsExpanded(shouldBeExpanded);
        animatedHeight.setValue(shouldBeExpanded ? 1 : 0);
        rotateAnim.setValue(shouldBeExpanded ? 1 : 0);
        setIsInitialized(true);
      }
    }, [
      isLoaded,
      isInitialized,
      getInitialExpanded,
      animatedHeight,
      rotateAnim,
    ]);

    // Mémoriser la fonction toggle
    const toggleExpanded = React.useCallback(() => {
      const newExpanded = !isExpanded;
      setIsExpanded(newExpanded);
      updateSectionState(sectionKey, newExpanded);

      Animated.parallel([
        Animated.timing(animatedHeight, {
          toValue: newExpanded ? 1 : 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(rotateAnim, {
          toValue: newExpanded ? 1 : 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, [
      isExpanded,
      updateSectionState,
      sectionKey,
      animatedHeight,
      rotateAnim,
    ]);

    // Mémoriser la rotation
    const rotation = React.useMemo(
      () =>
        rotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "90deg"],
        }),
      [rotateAnim]
    );

    // Mémoriser les styles
    const headerStyle = React.useMemo(
      () => [
        tw`flex-row items-center justify-between p-3 rounded-xl`,
        {
          backgroundColor: isExpanded
            ? currentTheme.colors.accent + "10"
            : currentTheme.isDark
            ? "rgba(255, 255, 255, 0.05)"
            : "rgba(0, 0, 0, 0.03)",
          borderWidth: isExpanded ? 1 : 0,
          borderColor: isExpanded
            ? currentTheme.colors.accent + "30"
            : "transparent",
        },
      ],
      [isExpanded, currentTheme]
    );

    const iconContainerStyle = React.useMemo(
      () => [
        tw`w-8 h-8 rounded-full items-center justify-center mr-3`,
        {
          backgroundColor: isExpanded
            ? currentTheme.colors.accent
            : currentTheme.colors.accent + "20",
        },
      ],
      [isExpanded, currentTheme]
    );

    const titleStyle = React.useMemo(
      () => [
        tw`text-sm`,
        {
          color: isExpanded
            ? currentTheme.colors.accent
            : currentTheme.colors.text,
        },
      ],
      [isExpanded, currentTheme]
    );

    return (
      <View style={tw`mb-3`}>
        {/* En-tête de section */}
        <TouchableOpacity
          onPress={toggleExpanded}
          style={headerStyle}
          activeOpacity={0.7}
        >
          <View style={tw`flex-row items-center flex-1`}>
            <View style={iconContainerStyle}>
              <MaterialCommunityIcons
                name={icon as any}
                size={16}
                color={isExpanded ? "#FFFFFF" : currentTheme.colors.accent}
              />
            </View>
            <UIText weight="semibold" style={titleStyle}>
              {title}
            </UIText>
          </View>
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={
                isExpanded
                  ? currentTheme.colors.accent
                  : currentTheme.colors.textSecondary
              }
            />
          </Animated.View>
        </TouchableOpacity>

        {/* Contenu collapsible */}
        <Animated.View
          style={[
            {
              opacity: animatedHeight,
              maxHeight: animatedHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1500],
              }),
            },
            tw`overflow-hidden`,
          ]}
        >
          <View style={tw`pt-2`}>{children}</View>
        </Animated.View>
      </View>
    );
  }
);

// Composant pour une option de switch compacte - OPTIMISÉ
const CompactSwitchOption: React.FC<{
  title: string;
  description: string;
  value: boolean;
  onValueChange: () => void;
}> = React.memo(({ title, description, value, onValueChange }) => {
  const { currentTheme } = useTheme();

  const handlePress = React.useCallback(() => {
    logger.debug("🔧 CompactSwitchOption pressed, current value:", value);
    onValueChange();
  }, [value, onValueChange]);

  // Mémoriser les styles
  const containerStyle = React.useMemo(
    () => [
      tw`flex-row items-center justify-between p-3 rounded-lg mb-2`,
      {
        backgroundColor: currentTheme.isDark
          ? "rgba(255, 255, 255, 0.03)"
          : "rgba(0, 0, 0, 0.02)",
      },
    ],
    [currentTheme]
  );

  const titleStyle = React.useMemo(
    () => [tw`mb-0.5`, { color: currentTheme.colors.text }],
    [currentTheme]
  );

  const descriptionStyle = React.useMemo(
    () => [
      tw`text-xs leading-4`,
      {
        color: currentTheme.colors.textSecondary,
        opacity: 0.8,
      },
    ],
    [currentTheme]
  );

  const switchTrackColor = React.useMemo(
    () => ({
      false: currentTheme.colors.border,
      true: currentTheme.colors.accent,
    }),
    [currentTheme]
  );

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={containerStyle}
      activeOpacity={0.7}
    >
      <View style={tw`flex-1 mr-3`}>
        <UIText size="sm" weight="medium" style={titleStyle}>
          {title}
        </UIText>
        <UIText
          size="xs"
          style={[
            tw`leading-4`,
            {
              color: currentTheme.colors.textSecondary,
              opacity: 0.8,
            },
          ]}
          numberOfLines={2}
        >
          {description}
        </UIText>
      </View>
      <Switch
        value={value}
        onValueChange={handlePress}
        trackColor={switchTrackColor}
        thumbColor={currentTheme.colors.background}
        style={{ transform: [{ scale: 0.9 }] }}
      />
    </TouchableOpacity>
  );
});

const ChatSettingsSection: React.FC<ChatSettingsSectionProps> = ({
  onBack,
  onClose,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { preferences, toggleAutoScroll, isLoading } = useChatPreferences();
  const { autoLoadEnabled, toggleAutoLoad } = useChat();
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Sauvegarder et restaurer la position de scroll - OPTIMISÉ
  React.useEffect(() => {
    const loadScrollPosition = async () => {
      try {
        const savedPosition = await AsyncStorage.getItem(
          "@chat_settings_scroll"
        );
        if (savedPosition && scrollViewRef.current) {
          const position = JSON.parse(savedPosition);
          // Délai pour s'assurer que le contenu est rendu
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({ y: position.y, animated: false });
          }, 100);
        }
      } catch (error) {
        logger.error(
          "Erreur lors du chargement de la position de scroll:",
          error
        );
      }
    };
    loadScrollPosition();
  }, []);

  // Mémoriser le handler de scroll
  const handleScroll = React.useCallback(async (event: any) => {
    try {
      const position = { y: event.nativeEvent.contentOffset.y };
      await AsyncStorage.setItem(
        "@chat_settings_scroll",
        JSON.stringify(position)
      );
    } catch (error) {
      logger.error(
        "Erreur lors de la sauvegarde de la position de scroll:",
        error
      );
    }
  }, []);

  // Mémoriser les handlers
  const handleAutoScrollToggle = React.useCallback(async () => {
    logger.debug("🔧 Toggling autoScroll from:", preferences.autoScrollEnabled);
    const success = await toggleAutoScroll();
    logger.debug("🔧 Toggle result:", success);
  }, [preferences.autoScrollEnabled, toggleAutoScroll]);

  const handleAutoLoadToggle = React.useCallback(async () => {
    logger.debug("🔧 Toggling autoLoad from:", autoLoadEnabled);
    await toggleAutoLoad();
    logger.debug("🔧 AutoLoad toggled");
  }, [autoLoadEnabled, toggleAutoLoad]);

  // Mémoriser les styles
  const headerStyle = React.useMemo(
    () => [{ color: currentTheme.colors.text }],
    [currentTheme]
  );

  // Debug pour vérifier les valeurs - RÉDUIT
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      logger.debug("🔧 ChatSettings - preferences:", preferences);
      logger.debug("🔧 ChatSettings - autoLoadEnabled:", autoLoadEnabled);
      logger.debug("🔧 ChatSettings - isLoading:", isLoading);
    }
  }, [preferences, autoLoadEnabled, isLoading]);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={tw`flex-1`}
      contentContainerStyle={tw`pb-20`}
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={100}
    >
      {/* En-tête compact */}
      <View style={tw`px-4 mb-4`}>
        <UIText size="lg" weight="bold" style={headerStyle}>
          Paramètres du Chat
        </UIText>
      </View>

      <View style={tw`px-4`}>
        {/* Section Affichage des conversations (non repliable) */}
        <View style={tw`mb-4`}>
          <ConversationViewSelector />
        </View>

        {/* Section Comportement */}
        <CollapsibleSection
          title="Comportement"
          icon="cog-outline"
          defaultExpanded={true}
          sectionKey="behavior"
        >
          <CompactSwitchOption
            title="Défilement automatique"
            description="Défiler vers le bas lors de nouveaux messages"
            value={preferences.autoScrollEnabled}
            onValueChange={handleAutoScrollToggle}
          />
          <CompactSwitchOption
            title="Reprendre la conversation"
            description="Charger automatiquement la dernière conversation"
            value={autoLoadEnabled}
            onValueChange={handleAutoLoadToggle}
          />
        </CollapsibleSection>

        {/* Section Polices */}
        <CollapsibleSection
          title="Polices"
          icon="format-font"
          sectionKey="fonts"
        >
          <FontOptionsMenu onClose={onClose} />
        </CollapsibleSection>

        {/* Section Style des bulles */}
        <CollapsibleSection
          title="Style des bulles"
          icon="chat-outline"
          sectionKey="bubbleStyle"
        >
          <ChatStyleSelector />
        </CollapsibleSection>

        {/* Section Style du clavier */}
        <CollapsibleSection
          title="Barre de saisie"
          icon="keyboard-outline"
          sectionKey="inputStyle"
        >
          <InputStyleSelector />
        </CollapsibleSection>

        {/* Section Mise en page */}
        <CollapsibleSection
          title="Mise en page"
          icon="view-dashboard-outline"
          sectionKey="messageLayout"
        >
          <MessageLayoutSettings />
        </CollapsibleSection>
      </View>
    </ScrollView>
  );
};

export default ChatSettingsSection;
