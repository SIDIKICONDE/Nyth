import React from "react";
import { Animated, Modal, TouchableWithoutFeedback } from "react-native";
import tw from "twrnc";
import { useModalAnimation } from "./hooks/useModalAnimation";
import { ModalContent } from "./ModalContent";
import { TeleprompterSelectionModalProps } from "./types";

export const TeleprompterSelectionModal: React.FC<
  TeleprompterSelectionModalProps
> = ({ visible, onClose, ...contentProps }) => {
  const { fadeAnim } = useModalAnimation(visible);

  const handleBackgroundPress = () => {
    onClose();
  };

  // Animation de scale pour le contenu
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, scaleAnim]);

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <TouchableWithoutFeedback onPress={handleBackgroundPress}>
        <Animated.View
          style={[
            tw`flex-1 justify-center items-center px-4`,
            {
              backgroundColor: "rgba(0,0,0,0.7)",
              opacity: fadeAnim,
            },
          ]}
        >
          <Animated.View
            style={[
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <ModalContent {...contentProps} />
          </Animated.View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
