import React from "react";
import { Animated, Dimensions } from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import tw from "twrnc";

interface SwipeableContentProps {
  currentPage: number;
  onPageChange: (pageIndex: number) => void;
  children: React.ReactNode;
}

const SwipeableContent: React.FC<SwipeableContentProps> = ({
  currentPage,
  onPageChange,
  children,
}) => {
  const screenWidth = Dimensions.get("window").width * 0.85; // Largeur du menu
  const swipeTranslateX = React.useRef(new Animated.Value(0)).current;

  // Gestion des gestes de swipe
  const onSwipeGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: swipeTranslateX } }],
    { useNativeDriver: true }
  );

  const onSwipeHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;

      // Seuils pour déclencher le changement de page
      const swipeThreshold = screenWidth * 0.3;
      const velocityThreshold = 500;

      if (
        Math.abs(translationX) > swipeThreshold ||
        Math.abs(velocityX) > velocityThreshold
      ) {
        if (translationX > 0 && currentPage === 1) {
          // Swipe vers la droite : aller à la page précédente (Réglages)
          onPageChange(0);
        } else if (translationX < 0 && currentPage === 0) {
          // Swipe vers la gauche : aller à la page suivante (Conversations)
          onPageChange(1);
        }
      }

      // Réinitialiser l'animation de swipe
      Animated.spring(swipeTranslateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={onSwipeGestureEvent}
      onHandlerStateChange={onSwipeHandlerStateChange}
      activeOffsetX={[-10, 10]}
      failOffsetY={[-5, 5]}
    >
      <Animated.View
        style={[
          tw`flex-1`,
          {
            transform: [
              {
                translateX: swipeTranslateX.interpolate({
                  inputRange: [-screenWidth, 0, screenWidth],
                  outputRange: [-50, 0, 50],
                  extrapolate: "clamp",
                }),
              },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    </PanGestureHandler>
  );
};

export default SwipeableContent;
