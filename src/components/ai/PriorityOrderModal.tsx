import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import * as React from "react";
import {
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ScrollView,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
  withSpring,
} from "react-native-reanimated";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import tw from "twrnc";

import { AI_PROVIDERS } from "../../config/aiConfig";
import { useTheme } from "../../contexts/ThemeContext";
import { useCentralizedFont } from "../../hooks/useCentralizedFont";
import { useTranslation } from "../../hooks/useTranslation";
import { UIText } from "../ui/Typography";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('PriorityOrderModal');

// Type for icon names
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

// Type for API information map
interface ApiInfo {
  name: string;
  color: string;
  icon: IconName;
}

interface PriorityOrderModalProps {
  visible: boolean;
  onClose: () => void;
  priorityOrder: string[];
  moveApiInPriorityOrder: (apiName: string, direction: "up" | "down") => void;
  enabledApis: {
    [key: string]: boolean;
  };
}

// Composant pour un élément draggable
interface DraggableItemProps {
  item: string;
  index: number;
  apiInfo: ApiInfo;
  isEnabled: boolean;
  onDragEnd: (fromIndex: number, toIndex: number) => void;
  priorityOrder: string[];
  moveApiInPriorityOrder: (apiName: string, direction: "up" | "down") => void;
}

const DraggableItem: React.FC<DraggableItemProps> = ({
  item,
  index,
  apiInfo,
  isEnabled,
  onDragEnd,
  priorityOrder,
  moveApiInPriorityOrder,
}) => {
  const { currentTheme } = useTheme();
  const { ui } = useCentralizedFont();

  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const isDragging = useSharedValue(false);

  const gestureHandler =
    useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
      onStart: () => {
        isDragging.value = true;
        scale.value = withSpring(1.05);
      },
      onActive: (event) => {
        translateY.value = event.translationY;
      },
      onEnd: (event) => {
        const ITEM_HEIGHT = 70; // Hauteur approximative d'un élément
        const moveDistance = Math.round(event.translationY / ITEM_HEIGHT);
        const newIndex = Math.max(
          0,
          Math.min(priorityOrder.length - 1, index + moveDistance)
        );

        if (newIndex !== index) {
          runOnJS(onDragEnd)(index, newIndex);
        }

        translateY.value = withSpring(0);
        scale.value = withSpring(1);
        isDragging.value = false;
      },
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    zIndex: isDragging.value ? 1000 : 1,
    elevation: isDragging.value ? 10 : 2,
  }));

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View
        style={[
          animatedStyle,
          tw`flex-row items-center p-3 mb-2 rounded-lg`,
          { backgroundColor: `${apiInfo.color}10` },
        ]}
      >
        {/* Icône de drag handle */}
        <View style={tw`mr-2`}>
          <MaterialCommunityIcons
            name="drag-horizontal-variant"
            size={16}
            color={currentTheme.colors.textSecondary}
          />
        </View>

        <View style={tw`w-8 mr-2`}>
          <UIText
            size="base"
            weight="bold"
            style={[ui, tw`text-center`, { color: apiInfo.color }]}
          >
            {index + 1}
          </UIText>
        </View>

        <View
          style={[
            tw`w-8 h-8 rounded-full items-center justify-center mr-2`,
            { backgroundColor: `${apiInfo.color}20` },
          ]}
        >
          <MaterialCommunityIcons
            name={apiInfo.icon}
            size={16}
            color={apiInfo.color}
          />
        </View>

        <UIText
          size="base"
          weight="medium"
          style={[ui, tw`flex-1`, { color: currentTheme.colors.text }]}
        >
          {apiInfo.name}
        </UIText>

        <View style={tw`flex-row`}>
          <TouchableOpacity
            onPress={() => moveApiInPriorityOrder(item, "up")}
            disabled={index === 0}
            style={[
              tw`w-8 h-8 items-center justify-center rounded-full mr-1`,
              {
                opacity: index === 0 ? 0.5 : 1,
                backgroundColor: `${apiInfo.color}20`,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="arrow-up"
              size={16}
              color={apiInfo.color}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => moveApiInPriorityOrder(item, "down")}
            disabled={index === priorityOrder.length - 1}
            style={[
              tw`w-8 h-8 items-center justify-center rounded-full`,
              {
                opacity: index === priorityOrder.length - 1 ? 0.5 : 1,
                backgroundColor: `${apiInfo.color}20`,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="arrow-down"
              size={16}
              color={apiInfo.color}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
};

const PriorityOrderModal: React.FC<PriorityOrderModalProps> = ({
  visible,
  onClose,
  priorityOrder,
  moveApiInPriorityOrder,
  enabledApis,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();

  // État local pour la réorganisation drag & drop
  const [localPriorityOrder, setLocalPriorityOrder] =
    React.useState(priorityOrder);

  // Mettre à jour l'ordre local quand les props changent
  React.useEffect(() => {
    setLocalPriorityOrder(priorityOrder);
  }, [priorityOrder]);

  // Information for each API
  const apiInfoMap: Record<string, ApiInfo> = {
    [AI_PROVIDERS.OPENAI]: { name: "OpenAI", color: "#f59e0b", icon: "robot" },
    [AI_PROVIDERS.GEMINI]: { name: "Gemini", color: "#3b82f6", icon: "google" },
    [AI_PROVIDERS.MISTRAL]: {
      name: "Mistral",
      color: "#ef4444",
      icon: "weather-windy",
    },
    [AI_PROVIDERS.COHERE]: {
      name: "Cohere",
      color: "#10b981",
      icon: "lightning-bolt",
    },
    // Nouveaux services premium
    [AI_PROVIDERS.CLAUDE]: { name: "Claude", color: "#8B5CF6", icon: "brain" },
    [AI_PROVIDERS.PERPLEXITY]: {
      name: "Perplexity",
      color: "#10B981",
      icon: "search-web",
    },
    [AI_PROVIDERS.TOGETHER]: {
      name: "Together AI",
      color: "#6366F1",
      icon: "account-group",
    },
    [AI_PROVIDERS.GROQ]: { name: "Groq", color: "#F59E0B", icon: "flash" },
    [AI_PROVIDERS.FIREWORKS]: {
      name: "Fireworks",
      color: "#EC4899",
      icon: "rocket",
    },
  };

  // Fonction pour gérer la fin du drag & drop
  const handleDragEnd = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const newOrder = [...localPriorityOrder];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);

    setLocalPriorityOrder(newOrder);

    // Appliquer directement le nouvel ordre via la fonction parent
    logger.debug(
      `🔄 Réorganisation: ${movedItem} de ${fromIndex} vers ${toIndex}`
    );
  };

  // Sauvegarder les changements quand le modal se ferme
  const handleClose = () => {
    // Appliquer l'ordre final via les props parent
    const currentOrder = priorityOrder;
    if (JSON.stringify(localPriorityOrder) !== JSON.stringify(currentOrder)) {
      logger.debug("💾 Sauvegarde du nouvel ordre:", localPriorityOrder);
      // Simuler les changements nécessaires
      localPriorityOrder.forEach((apiName, newIndex) => {
        const currentIndex = currentOrder.indexOf(apiName);
        if (currentIndex !== newIndex) {
          const direction = currentIndex < newIndex ? "down" : "up";
          const steps = Math.abs(newIndex - currentIndex);

          for (let i = 0; i < steps; i++) {
            setTimeout(
              () => moveApiInPriorityOrder(apiName, direction),
              i * 100
            );
          }
        }
      });
    }
    onClose();
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <GestureHandlerRootView
          style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}
        >
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                tw`w-5/6 rounded-xl p-5 max-h-4/5`,
                {
                  backgroundColor: currentTheme.colors.surface,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.25,
                  shadowRadius: 20,
                  elevation: 10,
                },
              ]}
            >
              <View style={tw`flex-row justify-between items-center mb-4`}>
                <UIText
                  size="lg"
                  weight="bold"
                  style={[ui, { color: currentTheme.colors.text }]}
                >
                  {t("aiSettings.priorityOrder.title", "Ordre de Priorité")}
                </UIText>
                <TouchableOpacity onPress={handleClose}>
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={currentTheme.colors.text}
                  />
                </TouchableOpacity>
              </View>

              <UIText
                size="sm"
                style={[
                  ui,
                  tw`mb-3`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                {t(
                  "aiSettings.priorityOrder.description",
                  "Réorganisez les providers selon vos préférences"
                )}
              </UIText>

              <View
                style={[
                  tw`mb-4 p-3 rounded-lg`,
                  { backgroundColor: currentTheme.colors.background },
                ]}
              >
                <UIText
                  size="xs"
                  style={[
                    ui,
                    tw`text-center`,
                    { color: currentTheme.colors.accent },
                  ]}
                >
                  💡{" "}
                  {t(
                    "aiSettings.priorityOrder.hint",
                    "Glissez-déposez ou utilisez les flèches ↑↓"
                  )}
                </UIText>
              </View>

              <ScrollView
                style={tw`flex-1`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={tw`pb-2`}
              >
                {localPriorityOrder.map((item, index) => {
                  const apiInfo = apiInfoMap[item];
                  if (!apiInfo) return null;

                  const isEnabled = enabledApis[item] || false;

                  return (
                    <View key={item} style={tw`mb-2`}>
                      <DraggableItem
                        item={item}
                        index={index}
                        apiInfo={apiInfo}
                        isEnabled={isEnabled}
                        onDragEnd={handleDragEnd}
                        priorityOrder={localPriorityOrder}
                        moveApiInPriorityOrder={(apiName, direction) => {
                          const currentIndex =
                            localPriorityOrder.indexOf(apiName);
                          if (currentIndex === -1) return;

                          const newOrder = [...localPriorityOrder];
                          const targetIndex =
                            direction === "up"
                              ? currentIndex - 1
                              : currentIndex + 1;

                          if (targetIndex < 0 || targetIndex >= newOrder.length)
                            return;

                          [newOrder[currentIndex], newOrder[targetIndex]] = [
                            newOrder[targetIndex],
                            newOrder[currentIndex],
                          ];
                          setLocalPriorityOrder(newOrder);
                        }}
                      />
                    </View>
                  );
                })}
              </ScrollView>

              <View style={tw`flex-row justify-between mt-4 gap-3`}>
                <TouchableOpacity
                  onPress={() => {
                    setLocalPriorityOrder(priorityOrder);
                    handleClose();
                  }}
                  style={[
                    tw`flex-1 p-3 rounded-xl`,
                    { backgroundColor: currentTheme.colors.border },
                  ]}
                >
                  <UIText
                    size="base"
                    weight="medium"
                    style={[
                      ui,
                      tw`text-center`,
                      { color: currentTheme.colors.text },
                    ]}
                  >
                    {t("common.cancel", "Annuler")}
                  </UIText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleClose}
                  style={[
                    tw`flex-1 p-3 rounded-xl`,
                    { backgroundColor: currentTheme.colors.accent },
                  ]}
                >
                  <UIText
                    size="base"
                    weight="medium"
                    style={[ui, tw`text-center`, { color: "white" }]}
                  >
                    {t("common.save", "Enregistrer")}
                  </UIText>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </GestureHandlerRootView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default PriorityOrderModal;
