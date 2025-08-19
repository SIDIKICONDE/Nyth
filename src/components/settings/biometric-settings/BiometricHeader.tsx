import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { Platform, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { InstantSwitch } from "../../common/InstantSwitch";
import { UIText } from "../../ui/Typography";
import Card from "../Card";

interface BiometricHeaderProps {
  isEnabled: boolean;
  isEnrolled: boolean;
  isUpdating: string | null;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
}

export const BiometricHeader: React.FC<BiometricHeaderProps> = ({
  isEnabled,
  isEnrolled,
  isUpdating,
  onToggle,
  disabled = false,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  // Déterminer le type de biométrie selon la plateforme
  const biometricType =
    Platform.OS === "ios" ? "Face ID" : "Empreinte digitale";
  const biometricIcon =
    Platform.OS === "ios" ? "face-recognition" : "fingerprint";

  return (
    <Card>
      <View style={tw`flex-row items-center justify-between`}>
        <View style={tw`flex-row items-center flex-1`}>
          <View
            style={[
              tw`w-12 h-12 rounded-full items-center justify-center mr-3`,
              {
                backgroundColor: isEnabled
                  ? currentTheme.colors.primary + "20"
                  : currentTheme.colors.surface,
                opacity: disabled ? 0.5 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={biometricIcon as any}
              size={24}
              color={
                isEnabled
                  ? currentTheme.colors.primary
                  : currentTheme.colors.text + "60"
              }
            />
          </View>

          <View style={tw`flex-1`}>
            <UIText
              size="base"
              weight="semibold"
              style={[
                {
                  color: currentTheme.colors.text,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
            >
              {t("biometric.protection", "Protection biométrique")}
            </UIText>
            <UIText
              size="sm"
              style={[
                tw`mt-1`,
                {
                  color: currentTheme.colors.text + "80",
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
            >
              {Platform.OS === "ios"
                ? t(
                    "biometric.protectionDesc",
                    "Sécurisez vos données sensibles"
                  )
                : t(
                    "biometric.protectionDescAndroid",
                    "Utilisez votre empreinte digitale"
                  )}
            </UIText>
          </View>
        </View>

        <InstantSwitch
          value={isEnabled}
          onValueChange={onToggle}
          disabled={disabled || isUpdating === "main"}
          trackColor={{
            false: currentTheme.colors.border,
            true: currentTheme.colors.primary,
          }}
          thumbColor="#ffffff"
        />
      </View>

      {/* Message d'état */}
      {!isEnrolled && !disabled && (
        <View
          style={[
            tw`mt-3 p-3 rounded-lg flex-row items-center`,
            { backgroundColor: "#fef3c7" },
          ]}
        >
          <MaterialCommunityIcons
            name="alert-circle"
            size={20}
            color="#f59e0b"
            style={tw`mr-2`}
          />
          <UIText size="sm" style={[tw`flex-1`, { color: "#92400e" }]}>
            {Platform.OS === "ios"
              ? t(
                  "biometric.setupFirst",
                  "Configurez d'abord Face ID/Touch ID dans les paramètres système"
                )
              : t(
                  "biometric.setupFirstAndroid",
                  "Configurez d'abord l'empreinte digitale dans les paramètres système"
                )}
          </UIText>
        </View>
      )}
    </Card>
  );
};
