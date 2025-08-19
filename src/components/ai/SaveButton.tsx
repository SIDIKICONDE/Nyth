import * as React from "react";
import { Pressable, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import Animated, { FadeInRight } from "react-native-reanimated";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";

import { useTheme } from "../../contexts/ThemeContext";
import { useCentralizedFont } from "../../hooks/useCentralizedFont";
import { useTranslation } from "../../hooks/useTranslation";
import { UIText } from "../ui/Typography";

interface SaveButtonProps {
  onPress: () => Promise<void> | void;
  isSaving: boolean;
}

const SaveButton: React.FC<SaveButtonProps> = ({ onPress, isSaving }) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();

  const handlePress = () => {
    onPress();
  };

  return (
    <Animated.View
      entering={FadeInRight.duration(300).delay(200)}
      style={tw`relative ml-2`}
    >
      <Pressable
        onPress={handlePress}
        disabled={isSaving}
        style={({ pressed }) => [
          tw`overflow-hidden rounded-lg px-3 py-2`,
          {
            opacity: pressed ? 0.8 : 1,
            backgroundColor: isSaving 
              ? currentTheme.colors.accent || '#10b981'
              : currentTheme.colors.primary,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        <View style={tw`flex-row items-center justify-center`}>
          {isSaving ? (
            <>
              <ActivityIndicator size={12} color="#FFFFFF" />
              <UIText
                size="xs"
                weight="medium"
                style={[ui, tw`ml-1`, { color: "#FFFFFF" }]}
                children={t("settings.actions.saving", "Enregistrement...")}
              />
            </>
          ) : (
            <View style={tw`flex-row items-center`}>
              <MaterialCommunityIcons
                name="content-save"
                size={14}
                color="#FFFFFF"
                style={tw`mr-1`}
              />
              <UIText
                size="xs"
                weight="medium"
                style={[ui, { color: "#FFFFFF" }]}
                children={t("common.save", "Enregistrer")}
              />
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default SaveButton;
