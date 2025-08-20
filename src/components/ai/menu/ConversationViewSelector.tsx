import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import * as React from "react";
import { Animated, TouchableOpacity, View } from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import tw from "twrnc";
import {
  ConversationListViewType,
  useConversationView,
} from "../../../contexts/ConversationViewContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { UIText } from "../../ui/Typography";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';
const logger = createOptimizedLogger('ConversationViewSelector');

interface ConversationViewSelectorProps {
  onViewChange?: (viewType: ConversationListViewType) => void;
}

const ConversationViewSelector: React.FC<ConversationViewSelectorProps> = ({
  onViewChange,
}) => {
  const { currentTheme } = useTheme();
  const { viewType, changeViewType, isLoading } = useConversationView();

  const translateX = React.useRef(new Animated.Value(0)).current;
  const [sliderWidth, setSliderWidth] = React.useState(300);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Corriger les options pour correspondre aux types exacts
  const options = React.useMemo(
    () => [
      {
        type: "sections" as ConversationListViewType,
        icon: "view-list",
        label: "Sections",
      },
      {
        type: "cards" as ConversationListViewType,
        icon: "view-grid",
        label: "Cartes",
      },
      {
        type: "ios" as ConversationListViewType,
        icon: "apple-ios",
        label: "iOS",
      },
    ],
    []
  );

  const currentIndex = React.useMemo(
    () => options.findIndex((option) => option.type === viewType),
    [options, viewType]
  );

  const thumbSize = React.useMemo(() => 60, []);
  const padding = React.useMemo(() => 32, []);

  // Fonction pour changer de vue - OPTIMISÉE
  const handleViewChange = React.useCallback(
    async (newViewType: ConversationListViewType) => {
      logger.debug(
        "🎯 ConversationViewSelector - changing view from:",
        viewType,
        "to:",
        newViewType
      );

      if (newViewType === viewType) {
        logger.debug("⚠️ Same view type, skipping change");
        return;
      }

      try {
        await changeViewType(newViewType);
        logger.debug(
          "✅ ConversationViewSelector - view changed successfully to:",
          newViewType
        );
        onViewChange?.(newViewType);
      } catch (error) {
        logger.error("❌ Error changing view type:", error);
      }
    },
    [viewType, changeViewType, onViewChange]
  );

  // Debug pour vérifier les changements de viewType
  React.useEffect(() => {
    logger.debug(
      "🔄 ConversationViewSelector - current viewType:",
      viewType,
      "currentIndex:",
      currentIndex
    );
  }, [viewType, currentIndex]);

  // Fonction pour calculer la position du curseur
  const calculatePosition = React.useCallback(
    (index: number, width: number) => {
      if (width <= 0 || index < 0) return 0;

      const availableWidth = width - padding;
      const optionWidth = availableWidth / options.length;
      const optionCenter = padding / 2 + optionWidth * index + optionWidth / 2;
      return optionCenter - thumbSize / 2;
    },
    [padding, options.length, thumbSize]
  );

  // Positionner le curseur selon l'option sélectionnée - OPTIMISÉ
  React.useEffect(() => {
    if (sliderWidth > 0 && currentIndex >= 0 && !isLoading) {
      const targetPosition = calculatePosition(currentIndex, sliderWidth);

      // Pour l'initialisation, pas d'animation
      if (!isInitialized) {
        translateX.setValue(targetPosition);
        setIsInitialized(true);
        logger.debug(
          "🎯 Initial position set for index:",
          currentIndex,
          "position:",
          targetPosition
        );
      } else {
        // Animation seulement si l'index a vraiment changé
        Animated.spring(translateX, {
          toValue: targetPosition,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
        logger.debug(
          "🎯 Animated to position for index:",
          currentIndex,
          "position:",
          targetPosition
        );
      }
    }
  }, [
    currentIndex,
    sliderWidth,
    isLoading,
    calculatePosition,
    translateX,
    isInitialized,
  ]);

  // Mémoriser les handlers pour éviter les re-créations
  const onGestureEvent = React.useMemo(
    () =>
      Animated.event([{ nativeEvent: { translationX: translateX } }], {
        useNativeDriver: true,
      }),
    [translateX]
  );

  const onHandlerStateChange = React.useCallback(
    (event: any) => {
      if (event.nativeEvent.state === State.END) {
        const { translationX } = event.nativeEvent;

        // Utiliser les mêmes calculs que pour le positionnement initial
        const availableWidth = sliderWidth - padding;
        const optionWidth = availableWidth / options.length;

        // Calculer la position actuelle du centre du curseur
        const currentCenterPosition = translationX + thumbSize / 2;

        // Trouver l'option la plus proche
        let newIndex = Math.round(
          (currentCenterPosition - padding / 2 - optionWidth / 2) / optionWidth
        );
        newIndex = Math.max(0, Math.min(options.length - 1, newIndex));

        logger.debug(
          "🎯 Gesture ended, calculated newIndex:",
          newIndex,
          "current:",
          currentIndex
        );

        if (newIndex !== currentIndex) {
          const newViewType = options[newIndex].type;
          handleViewChange(newViewType);
        }

        // Animer vers la position finale
        const finalPosition = calculatePosition(newIndex, sliderWidth);
        Animated.spring(translateX, {
          toValue: finalPosition,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    },
    [
      sliderWidth,
      padding,
      options,
      thumbSize,
      currentIndex,
      handleViewChange,
      calculatePosition,
      translateX,
    ]
  );

  // Mémoriser le handler de layout
  const handleLayout = React.useCallback(
    (event: any) => {
      const { width } = event.nativeEvent.layout;
      if (width !== sliderWidth) {
        logger.debug("🎯 Layout changed, new width:", width);
        setSliderWidth(width);
      }
    },
    [sliderWidth]
  );

  if (isLoading) {
    return (
      <View style={tw`px-4 py-4`}>
        <UIText size="sm" color={currentTheme.colors.textSecondary}>
          Chargement...
        </UIText>
      </View>
    );
  }

  return (
    <View style={tw`px-4 py-4`}>
      <View style={tw`mb-4`}>
        {/* Container du slider */}
        <View style={tw`relative`} onLayout={handleLayout}>
          {/* Track du slider */}
          <View
            style={[
              tw`h-16 rounded-2xl`,
              {
                backgroundColor: currentTheme.isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.06)",
              },
            ]}
          >
            {/* Labels des positions - maintenant cliquables */}
            <View style={tw`absolute inset-0 flex-row items-center px-4`}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={option.type}
                  onPress={() => {
                    logger.debug(
                      "🎯 Option clicked:",
                      option.type,
                      "index:",
                      index
                    );
                    handleViewChange(option.type);
                  }}
                  style={[
                    tw`items-center py-2`,
                    {
                      flex: 1, // Chaque option prend la même largeur
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={option.icon as any}
                    size={20}
                    color={
                      index === currentIndex
                        ? currentTheme.colors.accent
                        : currentTheme.colors.textSecondary
                    }
                    style={{ opacity: index === currentIndex ? 1 : 0.5 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Curseur du slider */}
          <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
            shouldCancelWhenOutside={true}
            activeOffsetX={[-10, 10]}
            failOffsetY={[-20, 20]}
          >
            <Animated.View
              style={[
                tw`absolute top-2 w-15 h-12 rounded-xl items-center justify-center`,
                {
                  backgroundColor: currentTheme.isDark
                    ? "rgba(255, 255, 255, 0.12)"
                    : "rgba(255, 255, 255, 0.4)",
                  borderWidth: 1,
                  borderColor: currentTheme.isDark
                    ? "rgba(255, 255, 255, 0.2)"
                    : "rgba(255, 255, 255, 0.3)",
                  transform: [{ translateX }],
                  shadowColor: currentTheme.colors.accent,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={options[currentIndex]?.icon as any}
                size={20}
                color="#FFFFFF"
              />
            </Animated.View>
          </PanGestureHandler>
        </View>
      </View>
    </View>
  );
};

export default ConversationViewSelector;
