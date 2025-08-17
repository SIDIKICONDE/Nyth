import { useTheme } from "@/contexts/ThemeContext";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { UIText } from "../../ui/Typography";
import tw from "twrnc";

interface LayoutHeaderProps {
  onReset: () => void;
  isResetting: boolean;
}

export const LayoutHeader: React.FC<LayoutHeaderProps> = ({
  onReset,
  isResetting,
}) => {
  const { currentTheme } = useTheme();

  return (
    <View style={tw`px-4 mb-6`}>
      <View style={tw`flex-row items-center justify-between`}>
        <View style={tw`flex-row items-center`}>
          <View
            style={[
              tw`w-12 h-12 rounded-2xl items-center justify-center mr-3`,
              {
                backgroundColor: `${currentTheme.colors.primary}15`,
                borderWidth: 1,
                borderColor: `${currentTheme.colors.primary}30`,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="view-dashboard-variant"
              size={24}
              color={currentTheme.colors.primary}
            />
          </View>
          <View>
            <UIText
              size="lg"
              weight="bold"
              style={[{ color: currentTheme.colors.text }]}
            >
              Mise en page
            </UIText>
            <UIText
              size="xs"
              style={[
                {
                  color: currentTheme.colors.textSecondary,
                  opacity: 0.7,
                },
              ]}
            >
              Personnalisez l'apparence des messages
            </UIText>
          </View>
        </View>

        <TouchableOpacity
          onPress={onReset}
          style={[
            tw`w-10 h-10 rounded-xl items-center justify-center`,
            {
              backgroundColor: currentTheme.isDark
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.05)",
            },
          ]}
          disabled={isResetting}
        >
          <MaterialCommunityIcons
            name="backup-restore"
            size={20}
            color={currentTheme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};
