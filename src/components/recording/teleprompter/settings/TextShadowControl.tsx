import React from "react";
import { View, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../../../components/ui/Typography";

interface TextShadowControlProps {
  value?: boolean;
  onChange: (value: boolean) => void;
}

export function TextShadowControl({
  value,
  onChange,
}: TextShadowControlProps): React.JSX.Element {
  const { currentTheme } = useTheme();
  const enabled = Boolean(value);
  return (
    <View style={tw`mb-5`}>
      <UIText
        size="lg"
        weight="semibold"
        style={[tw`mb-3`, { color: currentTheme.colors.text }]}
      >
        Ombre du texte
      </UIText>

      <TouchableOpacity
        style={[
          tw`flex-row items-center justify-between px-3 py-2 rounded-lg`,
          { backgroundColor: currentTheme.colors.surface },
        ]}
        onPress={() => onChange(!enabled)}
      >
        <View style={tw`flex-row items-center`}>
          <MaterialCommunityIcons
            name={enabled ? "blur" : "blur-off"}
            size={18}
            color={currentTheme.colors.text}
          />
          <UIText
            size="sm"
            weight="medium"
            style={[tw`ml-2`, { color: currentTheme.colors.text }]}
          >
            {enabled ? "Activée" : "Désactivée"}
          </UIText>
        </View>
        <View
          style={[
            tw`w-10 h-5 rounded-full p-0.5`,
            {
              backgroundColor: enabled ? currentTheme.colors.accent : "#ccc",
            },
          ]}
        >
          <View
            style={[
              tw`w-4 h-4 rounded-full bg-white shadow-sm`,
              { transform: [{ translateX: enabled ? 16 : 0 }] },
            ]}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}
