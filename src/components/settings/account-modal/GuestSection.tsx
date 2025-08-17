import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { UIText } from "../../ui/Typography";
import { GuestSectionProps } from "./types";

export const GuestSection: React.FC<GuestSectionProps> = ({
  onClose,
  navigation,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const handleLogin = () => {
    onClose();
    navigation.navigate("Login");
  };

  const handleRegister = () => {
    onClose();
    navigation.navigate("Register");
  };

  return (
    <View style={tw`px-6 pb-8`}>
      <View style={tw`items-center mb-4`}>
        <MaterialCommunityIcons
          name="account-off-outline"
          size={48}
          color={currentTheme.colors.textSecondary}
          style={tw`mb-2`}
        />
        <UIText size={16} weight="semibold" color={currentTheme.colors.text}>
          {t("settings.account.notConnected")}
        </UIText>
      </View>

      <View style={tw`gap-3`}>
        <TouchableOpacity
          onPress={handleLogin}
          style={[
            tw`flex-row items-center justify-center py-3 rounded-xl`,
            { backgroundColor: currentTheme.colors.primary },
          ]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="login"
            size={20}
            color="#ffffff"
            style={tw`mr-2`}
          />
          <UIText weight="medium" style={tw`text-white`}>
            {t("settings.account.login")}
          </UIText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRegister}
          style={[
            tw`flex-row items-center justify-center py-3 rounded-xl`,
            {
              backgroundColor: currentTheme.colors.background,
              borderWidth: 1,
              borderColor: currentTheme.colors.border,
            },
          ]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="account-plus-outline"
            size={20}
            color={currentTheme.colors.text}
            style={tw`mr-2`}
          />
          <UIText weight="medium" color={currentTheme.colors.text}>
            {t("settings.account.register")}
          </UIText>
        </TouchableOpacity>
      </View>
    </View>
  );
};
