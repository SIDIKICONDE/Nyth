import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, TouchableOpacity } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useCentralizedFont } from "../../hooks/useCentralizedFont";
import { useLanguage } from "../../hooks/useLanguage";
import { UIText } from "../ui/Typography";

export const LanguageSelectorCompact: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();

  const handleLanguagePress = () => {
    // Avec plus de 2 langues, afficher un menu de sélection
    const buttons = availableLanguages.map((lang) => ({
      text: `${lang.flag} ${lang.name}`,
      onPress: () => {
        if (lang.code !== currentLanguage) {
          changeLanguage(lang.code);
        }
      },
    }));

    Alert.alert(
      t("settings.language.changeTitle", "Change Language"),
      t("settings.language.selectLanguage", "Select your preferred language"),
      [
        ...buttons,
        {
          text: t("common.cancel", "Cancel"),
          style: "cancel",
        },
      ]
    );
  };

  const currentLang = availableLanguages.find(
    (lang) => lang.code === currentLanguage
  );

  return (
    <TouchableOpacity
      onPress={handleLanguagePress}
      style={[
        tw`px-2.5 py-1.5 rounded-lg flex-row items-center`,
        {
          backgroundColor: currentTheme.colors.background,
          borderWidth: 1,
          borderColor: currentTheme.colors.border,
        },
      ]}
      activeOpacity={0.7}
    >
      <UIText style={[ui, tw`mr-1`, { color: currentTheme.colors.text }]}>
        {currentLang?.flag}
      </UIText>
      <UIText
        size="sm"
        weight="medium"
        style={[ui, tw`mr-1`, { color: currentTheme.colors.text }]}
      >
        {currentLang?.code.toUpperCase()}
      </UIText>
      <MaterialIcons
        name="arrow-drop-down"
        size={16}
        color={currentTheme.colors.textSecondary}
      />
    </TouchableOpacity>
  );
};
