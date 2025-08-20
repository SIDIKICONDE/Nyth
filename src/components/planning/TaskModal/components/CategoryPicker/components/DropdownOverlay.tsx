import React from "react";
import { TouchableOpacity } from "react-native";
import { styles } from "../styles";

interface DropdownOverlayProps {
  visible: boolean;
  onPress: () => void;
}

export const DropdownOverlay: React.FC<DropdownOverlayProps> = ({
  visible,
  onPress,
}) => {
  if (!visible) return null;

  return (
    <TouchableOpacity
      style={styles.overlay}
      onPress={onPress}
      activeOpacity={1}
    />
  );
};
