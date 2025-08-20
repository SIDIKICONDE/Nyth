import { I18nManager } from "react-native";

// Options de transition communes pour tous les écrans
export const getScreenTransitionOptions = () => ({
  cardStyleInterpolator: ({ current }: { current: { progress: any } }) => ({
    cardStyle: {
      opacity: current?.progress || 1,
    },
  }),
  transitionSpec: {
    open: {
      animation: "timing" as const,
      config: {
        duration: 200,
      },
    },
    close: {
      animation: "timing" as const,
      config: {
        duration: 200,
      },
    },
  },
});

// Options de transition plus douces pour les écrans AI
export const getAIScreenTransitionOptions = () => ({
  cardStyleInterpolator: ({ current }: { current: { progress: any } }) => {
    if (!current?.progress) {
      return {
        cardStyle: {
          opacity: 1,
          transform: [{ translateY: 0 }],
        },
      };
    }

    return {
      cardStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        }),
        transform: [
          {
            translateY: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [5, 0],
            }),
          },
        ],
      },
    };
  },
  transitionSpec: {
    open: {
      animation: "timing" as const,
      config: {
        duration: 250,
      },
    },
    close: {
      animation: "timing" as const,
      config: {
        duration: 200,
      },
    },
  },
  gestureEnabled: true,
  gestureDirection: "vertical" as const,
  cardOverlayEnabled: true,
});

// Options de transition par défaut pour le navigateur principal
export const getDefaultNavigatorOptions = () => ({
  headerShown: false,
  gestureEnabled: true,
  cardStyleInterpolator: ({
    current,
    layouts,
  }: {
    current: { progress: any };
    layouts: { screen: { width: number } };
  }) => {
    if (!current?.progress || !layouts?.screen?.width) {
      return {
        cardStyle: {
          opacity: 1,
          transform: [{ translateX: 0 }],
        },
      };
    }

    // Inverser la direction de l'animation en RTL
    const isRTL = I18nManager.isRTL;
    const outputRange = isRTL
      ? [-layouts.screen.width, 0]
      : [layouts.screen.width, 0];

    return {
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange,
            }),
          },
        ],
        opacity: current.progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0.5, 1],
        }),
      },
    };
  },
  transitionSpec: {
    open: {
      animation: "timing" as const,
      config: {
        duration: 300,
      },
    },
    close: {
      animation: "timing" as const,
      config: {
        duration: 300,
      },
    },
  },
});
