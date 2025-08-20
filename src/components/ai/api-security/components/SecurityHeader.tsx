import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { UIText } from "../../../ui/Typography";

interface SecurityHeaderProps {
  apiKeysCount: number;
}

export const SecurityHeader: React.FC<SecurityHeaderProps> = ({
  apiKeysCount,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={tw`mb-3 p-4 rounded-lg bg-gray-100`}>
      <View style={tw`flex-row items-center`}>
        <MaterialCommunityIcons
          name="shield-check"
          size={24}
          color={currentTheme.colors.primary}
        />
        <View style={tw`ml-3`}>
          <UIText size="lg" weight="bold" color={currentTheme.colors.text}>
            {t("security.title", "Sécurité")}
          </UIText>
          <UIText size="xs" color={currentTheme.colors.textSecondary}>
            {apiKeysCount} {t("security.keys.count", "clés protégées")}
          </UIText>
        </View>
      </View>
    </View>
  );
};
