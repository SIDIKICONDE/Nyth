import React from "react";
import { View, TouchableOpacity } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../../../components/ui/Typography";

interface SettingsFooterProps {
  onReset: () => void;
  onClose: () => void;
}

export function SettingsFooter({
  onReset,
  onClose,
}: SettingsFooterProps): React.JSX.Element {
  const { currentTheme } = useTheme();
  return (
    <View style={tw`flex-row justify-between mt-4`}>
      <TouchableOpacity
        style={[
          tw`flex-1 py-3 rounded-xl mr-2`,
          { backgroundColor: currentTheme.colors.surface },
        ]}
        onPress={onReset}
      >
        <UIText
          weight="medium"
          align="center"
          style={{ color: currentTheme.colors.text }}
        >
          Reset
        </UIText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          tw`flex-1 py-3 rounded-xl ml-2`,
          { backgroundColor: currentTheme.colors.accent },
        ]}
        onPress={onClose}
      >
        <UIText weight="medium" align="center" color="white">
          Terminé
        </UIText>
      </TouchableOpacity>
    </View>
  );
}
