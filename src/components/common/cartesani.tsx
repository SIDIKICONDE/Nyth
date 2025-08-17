import React from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from "react-native-reanimated";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('cartesani');

const { width: screenWidth } = Dimensions.get("window");

// Card configuration
const CARD_HEIGHT = 120;
const CARD_WIDTH = 100;
const STACK_OFFSET = 8; // Décalage entre les cartes dans la pile
const MAX_VISIBLE_CARDS = 5; // Nombre max de cartes visibles dans la pile
const FAN_SPREAD = 40; // Distance d'étalement en éventail

// Types
interface Card {
  id?: string;
  color: string;
  content?: React.ReactNode;
}

interface IMessageStackProps {
  cards?: Card[];
  cardWidth?: number;
  cardHeight?: number;
  maxVisible?: number;
  onCardPress?: (card: Card, index: number) => void;
  onCardSwipe?: (
    card: Card,
    index: number,
    direction: "left" | "right"
  ) => void;
}

// Sample cards data
const DEFAULT_CARDS: Card[] = [
  { id: "1", color: "#FF6B6B" },
  { id: "2", color: "#4ECDC4" },
  { id: "3", color: "#45B7D1" },
  { id: "4", color: "#96CEB4" },
  { id: "5", color: "#FFEAA7" },
  { id: "6", color: "#DDA0DD" },
  { id: "7", color: "#A8E6CF" },
  { id: "8", color: "#FFB3BA" },
];

// Individual Card Component
const StackCard: React.FC<{
  card: Card;
  index: number;
  totalCards: number;
  cardWidth: number;
  cardHeight: number;
  maxVisible: number;
  onPress?: (card: Card, index: number) => void;
  onSwipe?: (card: Card, index: number, direction: "left" | "right") => void;
  isActive: boolean;
  isAnimating: boolean;
  fanMode: "none" | "left" | "right";
}> = ({
  card,
  index,
  totalCards,
  cardWidth,
  cardHeight,
  maxVisible,
  onPress,
  onSwipe,
  isActive,
  isAnimating,
  fanMode,
}) => {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotateZ = useSharedValue(0);

  // Position dans la pile (0 = carte du dessus, 1 = deuxième, etc.)
  const stackPosition = Math.min(index, maxVisible - 1);
  const isVisible = index < maxVisible;

  const handlePress = () => {
    if (!isActive || isAnimating) return;

    logger.debug(`Carte ${index + 1} pressée:`, card);

    // Animation de feedback
    scale.value = withSpring(1.1, {}, () => {
      scale.value = withSpring(1);
    });

    if (onPress) {
      onPress(card, index);
    }
  };

  const handleSwipeLeft = () => {
    if (!isActive || isAnimating) return;

    logger.debug(`Carte ${index + 1} swipée vers la gauche:`, card);

    // Animation de sortie vers la gauche
    translateX.value = withTiming(-screenWidth, { duration: 300 });
    rotateZ.value = withTiming(-15, { duration: 300 });
    scale.value = withTiming(0.8, { duration: 300 }, () => {
      if (onSwipe) {
        runOnJS(onSwipe)(card, index, "left");
      }
    });
  };

  const handleSwipeRight = () => {
    if (!isActive || isAnimating) return;

    logger.debug(`Carte ${index + 1} swipée vers la droite:`, card);

    // Animation de sortie vers la droite
    translateX.value = withTiming(screenWidth, { duration: 300 });
    rotateZ.value = withTiming(15, { duration: 300 });
    scale.value = withTiming(0.8, { duration: 300 }, () => {
      if (onSwipe) {
        runOnJS(onSwipe)(card, index, "right");
      }
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    if (!isVisible) return { opacity: 0 };

    // Position de base dans la pile
    const baseTranslateY = stackPosition * STACK_OFFSET;
    const baseScale = 1 - stackPosition * 0.05; // Cartes plus petites en arrière
    const baseOpacity = 1 - stackPosition * 0.1; // Cartes plus transparentes

    // Calcul de l'étalement en éventail
    let fanTranslateX = 0;
    let fanRotation = 0;

    if (fanMode !== "none" && stackPosition > 0) {
      // Plus la carte est loin dans la pile, plus elle est étalée
      const fanDistance = stackPosition * FAN_SPREAD;
      const rotationAngle = stackPosition * 8; // 8 degrés par carte

      if (fanMode === "left") {
        fanTranslateX = -fanDistance;
        fanRotation = -rotationAngle;
      } else if (fanMode === "right") {
        fanTranslateX = fanDistance;
        fanRotation = rotationAngle;
      }
    }

    return {
      transform: [
        { translateX: translateX.value + fanTranslateX },
        { translateY: baseTranslateY },
        { scale: scale.value * baseScale },
        { rotateZ: `${rotateZ.value + fanRotation}deg` },
      ],
      opacity: fanMode !== "none" ? 1 : baseOpacity, // En mode éventail, toutes les cartes sont visibles
      zIndex: totalCards - index, // Carte du dessus a le z-index le plus élevé
    };
  });

  if (!isVisible) return null;

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={() => {
        Alert.alert("Actions", "Que voulez-vous faire ?", [
          { text: "Swipe Gauche", onPress: handleSwipeLeft },
          { text: "Swipe Droite", onPress: handleSwipeRight },
          { text: "Annuler", style: "cancel" },
        ]);
      }}
      activeOpacity={isActive ? 0.8 : 1}
      disabled={!isActive || isAnimating}
      style={{ position: "absolute" }}
    >
      <Animated.View
        style={[
          styles.card,
          {
            width: cardWidth,
            height: cardHeight,
            backgroundColor: card.color,
          },
          animatedStyle,
        ]}
      >
        <Animated.View style={styles.cardContent}>{card.content}</Animated.View>

        {/* Indicateur visuel pour la carte active */}
        {isActive && (
          <View style={styles.activeIndicator}>
            <View style={styles.activeIndicatorDot} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Main IMessageStack Component
const IMessageStack: React.FC<IMessageStackProps> = ({
  cards = DEFAULT_CARDS,
  cardWidth = CARD_WIDTH,
  cardHeight = CARD_HEIGHT,
  maxVisible = MAX_VISIBLE_CARDS,
  onCardPress,
  onCardSwipe,
}) => {
  const [currentCards, setCurrentCards] = React.useState(cards);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [fanMode, setFanMode] = React.useState<"none" | "left" | "right">(
    "none"
  );

  const handleCardPress = React.useCallback(
    (card: Card, index: number) => {
      logger.debug("Stack - Carte pressée:", card, "Index:", index);
      if (onCardPress) {
        onCardPress(card, currentIndex + index);
      }
    },
    [onCardPress, currentIndex]
  );

  const handleCardSwipe = React.useCallback(
    (card: Card, index: number, direction: "left" | "right") => {
      logger.debug("Stack - Carte swipée:", card, "Direction:", direction);

      setIsAnimating(true);

      // Passer à la carte suivante après un délai
      setTimeout(() => {
        setCurrentIndex((prev) => {
          const newIndex = prev + 1;
          // Reset si on arrive à la fin
          if (newIndex >= currentCards.length) {
            return 0;
          }
          return newIndex;
        });
        setIsAnimating(false);
      }, 400);

      // Callback optionnel
      if (onCardSwipe) {
        onCardSwipe(card, currentIndex + index, direction);
      }
    },
    [onCardSwipe, currentIndex, currentCards.length]
  );

  // Gestion de l'étalement en éventail
  const handleLeftSidePress = () => {
    logger.debug("🃏 Côté gauche pressé - Étalement vers la gauche");
    setFanMode((prev) => (prev === "left" ? "none" : "left"));
  };

  const handleRightSidePress = () => {
    logger.debug("🃏 Côté droit pressé - Étalement vers la droite");
    setFanMode((prev) => (prev === "right" ? "none" : "right"));
  };

  // Cartes visibles (en commençant par l'index actuel)
  const visibleCards = React.useMemo(() => {
    const result = [];
    for (
      let i = 0;
      i < maxVisible && currentIndex + i < currentCards.length;
      i++
    ) {
      result.push(currentCards[currentIndex + i]);
    }
    return result;
  }, [currentCards, currentIndex, maxVisible]);

  // Informations de debug
  React.useEffect(() => {
    logger.debug("🎴 Stack State:", {
      currentIndex,
      visibleCards: visibleCards.length,
      totalCards: currentCards.length,
      isAnimating,
      fanMode,
    });
  }, [
    currentIndex,
    visibleCards.length,
    currentCards.length,
    isAnimating,
    fanMode,
  ]);

  return (
    <View style={styles.container}>
      {/* Message d'instruction */}
      <View style={styles.instructionsContainer}>
        <View
          style={{
            padding: 10,
            backgroundColor: "rgba(76, 205, 196, 0.1)",
            borderRadius: 10,
            marginBottom: 15,
          }}
        >
          <View style={{ alignItems: "center" }}>
            {/* Instructions textuelles ici si nécessaire */}
          </View>
        </View>
      </View>

      <View
        style={[
          styles.stackContainer,
          { width: cardWidth * 2, height: cardHeight },
        ]}
      >
        {/* Zone cliquable côté gauche */}
        <TouchableOpacity
          style={[
            styles.sideButton,
            styles.leftSide,
            { backgroundColor: "rgba(76, 205, 196, 0.2)" },
          ]}
          onPress={handleLeftSidePress}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.sideIndicator,
              {
                backgroundColor:
                  fanMode === "left" ? "#4ECDC4" : "rgba(76, 205, 196, 0.5)",
              },
            ]}
          />
        </TouchableOpacity>

        {/* Cartes du stack */}
        <View style={styles.cardsContainer}>
          {visibleCards.map((card, relativeIndex) => {
            return (
              <StackCard
                key={`${
                  card.id || currentIndex + relativeIndex
                }-${currentIndex}`}
                card={card}
                index={relativeIndex}
                totalCards={visibleCards.length}
                cardWidth={cardWidth}
                cardHeight={cardHeight}
                maxVisible={maxVisible}
                onPress={handleCardPress}
                onSwipe={handleCardSwipe}
                isActive={relativeIndex === 0} // Seule la première carte est interactive
                isAnimating={isAnimating}
                fanMode={fanMode}
              />
            );
          })}
        </View>

        {/* Zone cliquable côté droit */}
        <TouchableOpacity
          style={[
            styles.sideButton,
            styles.rightSide,
            { backgroundColor: "rgba(76, 205, 196, 0.2)" },
          ]}
          onPress={handleRightSidePress}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.sideIndicator,
              {
                backgroundColor:
                  fanMode === "right" ? "#4ECDC4" : "rgba(76, 205, 196, 0.5)",
              },
            ]}
          />
        </TouchableOpacity>
      </View>

      {/* Indicateurs de progression */}
      <View style={styles.progressContainer}>
        <View style={styles.progressText}>
          <Animated.View
            style={[styles.progressDot, { backgroundColor: "#666" }]}
          />
          <Animated.View style={[styles.progressInfo]}>
            {/* Info: {currentIndex + 1} / {currentCards.length} */}
          </Animated.View>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Animated.View style={styles.instructionText}>
          {/* Appuyez sur les côtés pour étaler les cartes */}
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  stackContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  cardsContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  sideButton: {
    width: 50,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  leftSide: {
    marginRight: -25, // Chevauche légèrement avec les cartes
  },
  rightSide: {
    marginLeft: -25, // Chevauche légèrement avec les cartes
  },
  sideIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    opacity: 0.6,
  },
  card: {
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  activeIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  activeIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  progressContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  progressText: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  progressInfo: {
    // Styles pour les infos de progression si nécessaire
  },
  instructionsContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  instructionText: {
    // Styles pour les instructions si nécessaire
  },
  controlsContainer: {
    flexDirection: "row",
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  controlButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default IMessageStack;
export type { Card, IMessageStackProps };
