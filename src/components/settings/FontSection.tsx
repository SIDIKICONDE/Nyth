import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useFont } from "../../contexts/FontContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { RootStackParamList } from "../../types/navigation";
import { getFontDisplayName } from "../../utils/fontUtils";
import { ContentText, Label, UIText } from "../ui/Typography";

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function FontSection() {
  const navigation = useNavigation<NavigationProp>();
  const { currentTheme } = useTheme();
  const { fonts } = useFont();
  const { t } = useTranslation();

  const handlePress = () => {
    navigation.navigate("FontSettings");
  };

  // Obtenir un aperçu des polices actuelles
  const getFontPreview = () => {
    const uniqueFonts = new Set([fonts.ui, fonts.content, fonts.heading]);
    if (uniqueFonts.size === 1) {
      return t("fonts.unified.preview", "Police unifiée : {{font}}", {
        font: getFontDisplayName(fonts.ui),
      });
    } else {
      return t("fonts.customized", "Polices personnalisées");
    }
  };

  return (
    <View
      style={[
        tw`rounded-2xl p-4 mb-4`,
        {
          backgroundColor: currentTheme.isDark
            ? "rgba(255, 255, 255, 0.05)"
            : "rgba(0, 0, 0, 0.05)",
        },
      ]}
    >
      <View style={tw`flex-row items-center mb-3`}>
        <MaterialCommunityIcons
          name="format-font"
          size={24}
          color={currentTheme.colors.primary}
          style={tw`mr-2`}
        />
        <Label size={18} weight="600" color={currentTheme.colors.text}>
          {t("settings.fonts.title", "Polices")}
        </Label>
      </View>

      <TouchableOpacity
        style={[
          tw`flex-row items-center justify-between p-3 rounded-xl`,
          {
            backgroundColor: currentTheme.isDark
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.03)",
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={tw`flex-1`}>
          <UIText size={16} weight="500" color={currentTheme.colors.text}>
            {t("settings.fonts.customize", "Personnaliser les polices")}
          </UIText>
          <ContentText
            size={14}
            color={currentTheme.colors.textSecondary}
            style={tw`mt-1`}
          >
            {getFontPreview()}
          </ContentText>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={currentTheme.colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}
