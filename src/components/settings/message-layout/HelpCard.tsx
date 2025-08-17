import { useTheme } from "@/contexts/ThemeContext";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { UIText } from "../../ui/Typography";
import React from "react";
import { View } from "react-native";
import tw from "twrnc";

export const HelpCard: React.FC = () => {
  const { currentTheme } = useTheme();

  return (
    <View
      style={[
        tw`p-4 rounded-2xl mt-4 mb-6 flex-row items-center`,
        {
          backgroundColor: `${currentTheme.colors.primary}10`,
          borderWidth: 1,
          borderColor: `${currentTheme.colors.primary}20`,
        },
      ]}
    >
      <View
        style={[
          tw`w-10 h-10 rounded-xl items-center justify-center mr-3`,
          {
            backgroundColor: `${currentTheme.colors.primary}20`,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="lightbulb-outline"
          size={20}
          color={currentTheme.colors.primary}
        />
      </View>
      <View style={tw`flex-1`}>
        <UIText
          size="sm"
          weight="semibold"
          style={[
            tw`mb-1`,
            { color: currentTheme.colors.text },
          ]}
        >
          Astuce
        </UIText>
        <UIText
          size="xs"
          style={[
            tw`leading-5`,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          Les modifications sont appliquées en temps réel. Utilisez les boutons
          rapides pour tester différentes configurations.
        </UIText>
      </View>
    </View>
  );
};
