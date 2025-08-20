import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { TouchableOpacity } from "react-native";
import { UIText } from "../../../../components/ui/Typography";
import { useTheme } from "../../../../contexts/ThemeContext";
import { COLORS, ICONS, LABELS, UI_CONFIG } from "../constants";
import { styles } from "../styles";
import { ChatButtonProps } from "../types";

export const ChatButton: React.FC<ChatButtonProps> = ({ onPress }) => {
  const { currentTheme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.chatButton,
        { backgroundColor: currentTheme.colors.primary },
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={ICONS.CHAT}
        size={UI_CONFIG.CHAT_ICON_SIZE}
        color={COLORS.WHITE}
      />
            <UIText 
        size={14} 
        weight="600" 
        style={[styles.chatButtonText, { color: COLORS.WHITE }]}
      >
        {LABELS.CHAT_BUTTON_TEXT}
      </UIText>
    </TouchableOpacity>
  );
};
