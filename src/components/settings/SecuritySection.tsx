import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import { View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { RootStackParamList } from "../../types";
import Card from "./Card";
import SectionHeader from "./SectionHeader";
import SettingRow from "./SettingRow";
import { BypassProtectionToggle } from "./security-section/components/BypassProtectionToggle";
import { EnhancedSecurityToggle } from "./security-section/components/EnhancedSecurityToggle";
import { useSecuritySettings } from "./security-section/hooks/useSecuritySettings";

type SecuritySectionNavigationProp = StackNavigationProp<RootStackParamList>;

export const SecuritySection: React.FC = () => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const navigation = useNavigation<SecuritySectionNavigationProp>();
  const {
    settings,
    isLoading,
    updateEnhancedSecurity,
    updateBypassProtection,
  } = useSecuritySettings();

  const handlePrivacyPolicyPress = () => {
    // Afficher l'écran de politique de confidentialité
    navigation.navigate("PrivacyPolicyScreen");
  };

  if (isLoading) {
    return null;
  }

  return (
    <View>
      <SectionHeader
        title={t("settings.security.title", "Sécurité & Confidentialité")}
      />

      <Card>
        <EnhancedSecurityToggle
          value={settings.enhancedSecurity}
          onValueChange={updateEnhancedSecurity}
        />

        <BypassProtectionToggle
          value={settings.bypassProtection}
          onValueChange={updateBypassProtection}
        />

        <SettingRow
          icon="shield-account"
          iconColor="#ffffff"
          iconBgColor={currentTheme.colors.primary}
          title={t(
            "settings.security.privacyPolicy",
            "Politique de confidentialité"
          )}
          subtitle={t(
            "settings.security.privacyPolicyDesc",
            "Consulter notre politique de protection des données"
          )}
          onPress={handlePrivacyPolicyPress}
          isLast
        />
      </Card>
    </View>
  );
};
