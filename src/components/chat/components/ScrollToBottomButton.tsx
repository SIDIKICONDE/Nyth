import React from "react";
import { TouchableOpacity, Animated } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";

interface ScrollToBottomButtonProps {
  visible: boolean;
  onPress: () => void;
}

export const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({
  visible,
  onPress,
}) => {
  const { currentTheme } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 150, // Réduit de 200 à 150ms pour plus de réactivité
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        tw`absolute bottom-32`,
        {
          left: "50%",
          marginLeft: -20, // La moitié de la largeur du bouton (40px/2)
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0], // Réduit de 20 à 10px pour une animation plus subtile
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        style={[
          tw`w-10 h-10 rounded-full items-center justify-center`,
          {
            backgroundColor: currentTheme.colors.primary,
            shadowColor: currentTheme.colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="chevron-down"
          size={20}
          color={currentTheme.colors.background}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};
