import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { forwardRef, useImperativeHandle } from "react";
import { TouchableOpacity, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useAIStatus } from "../../hooks/useAIStatus";
import { useCentralizedFont } from "../../hooks/useCentralizedFont";
import { useTranslation } from "../../hooks/useTranslation";
import { UIText } from "../ui/Typography";

export interface AIStatusIndicatorRef {
  refresh: () => void;
}

export const AIStatusIndicator = forwardRef<AIStatusIndicatorRef, {}>(
  (props, ref) => {
    const { currentTheme } = useTheme();
    const { t } = useTranslation();
    const { ui } = useCentralizedFont();
    const {
      totalAPIs,
      availableAPIs,
      isConfigured,
      isLoading: statusLoading,
      refresh,
    } = useAIStatus();

    // Exposer la fonction refresh à travers la référence
    useImperativeHandle(ref, () => ({
      refresh,
    }));

    return (
      <Animated.View entering={FadeIn.duration(500)} style={tw`mb-6`}>
        {/* Dynamic API status indicator */}
        <TouchableOpacity
          onPress={refresh}
          style={[
            tw`mx-auto px-4 py-2 rounded-full flex-row items-center justify-center`,
            {
              backgroundColor: isConfigured
                ? currentTheme.colors.surface
                : "#fee2e2",
              borderWidth: 1,
              borderColor: isConfigured
                ? currentTheme.colors.accent
                : "#ef4444",
              shadowColor: isConfigured
                ? currentTheme.colors.accent
                : "#ef4444",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={
              isConfigured ? "check-circle-outline" : "alert-circle-outline"
            }
            size={16}
            color={isConfigured ? currentTheme.colors.accent : "#ef4444"}
            style={tw`mr-1.5`}
          />
          <UIText
            size="sm"
            weight="medium"
            style={[
              ui,
              { color: isConfigured ? currentTheme.colors.accent : "#ef4444" },
            ]}
          >
            {statusLoading
              ? t("aiGenerator.actions.checkingSettings")
              : isConfigured
              ? t("aiGenerator.status.ready", { count: totalAPIs })
              : t("aiGenerator.status.noApi")}
          </UIText>
        </TouchableOpacity>

        {isConfigured && availableAPIs.length > 0 && (
          <View
            style={[
              tw`mt-2 mx-auto px-3 py-1 rounded-lg`,
              {
                backgroundColor: `${currentTheme.colors.accent}10`,
                borderWidth: 1,
                borderColor: `${currentTheme.colors.accent}20`,
              },
            ]}
          >
            <UIText
              size="xs"
              weight="medium"
              style={[
                ui,
                tw`text-center`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {t("aiGenerator.status.apis", { apis: availableAPIs.join(", ") })}
            </UIText>
          </View>
        )}
      </Animated.View>
    );
  }
);
