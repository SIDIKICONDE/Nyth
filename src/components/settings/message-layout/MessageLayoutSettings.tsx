import { useMessageLayout } from "@/contexts/MessageLayoutContext";
import { useTranslation } from "@/hooks/useTranslation";
import React, { useState } from "react";
import { Alert, Animated, View } from "react-native";
import tw from "twrnc";
import { HelpCard } from "./HelpCard";
import { LayoutHeader } from "./LayoutHeader";
import { ModernStepControl } from "./ModernStepControl";
import { LAYOUT_CONTROLS } from "./constants";

export const MessageLayoutSettings: React.FC = () => {
  const { settings, updateSettings, resetToDefaults } = useMessageLayout();
  const { t } = useTranslation();
  const [isResetting, setIsResetting] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleReset = async () => {
    Alert.alert(
      t("settings.messageLayout.reset.title", "Réinitialiser"),
      t(
        "settings.messageLayout.reset.message",
        "Restaurer les paramètres par défaut ?"
      ),
      [
        {
          text: t("common.cancel", "Annuler"),
          style: "cancel",
        },
        {
          text: t("settings.messageLayout.reset.confirm", "Réinitialiser"),
          style: "destructive",
          onPress: async () => {
            setIsResetting(true);
            await resetToDefaults();
            setIsResetting(false);
          },
        },
      ]
    );
  };

  return (
    <Animated.View style={[tw`py-2`, { opacity: fadeAnim }]}>
      {/* En-tête moderne */}
      <LayoutHeader onReset={handleReset} isResetting={isResetting} />

      {/* Contrôles redesignés */}
      <View style={tw`px-4 pb-24`}>
        <ModernStepControl
          {...LAYOUT_CONTROLS.messageWidth}
          value={settings.messageWidth}
          onValueChange={(value) => updateSettings({ messageWidth: value })}
        />

        <ModernStepControl
          {...LAYOUT_CONTROLS.messageHeight}
          value={Math.round(settings.messageHeight * 10) / 10}
          onValueChange={(value) => updateSettings({ messageHeight: value })}
        />

        <ModernStepControl
          {...LAYOUT_CONTROLS.messageGap}
          value={settings.messageGap}
          onValueChange={(value) => updateSettings({ messageGap: value })}
        />

        <ModernStepControl
          {...LAYOUT_CONTROLS.paddingHorizontal}
          value={settings.paddingHorizontal}
          onValueChange={(value) =>
            updateSettings({ paddingHorizontal: value })
          }
        />

        <ModernStepControl
          {...LAYOUT_CONTROLS.paddingVertical}
          value={settings.paddingVertical}
          onValueChange={(value) => updateSettings({ paddingVertical: value })}
        />

        {/* Carte d'aide moderne */}
        <HelpCard />
      </View>
    </Animated.View>
  );
};
