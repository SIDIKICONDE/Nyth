import React, { useEffect, useState } from "react";
import { Animated, View } from "react-native";
import tw from "twrnc";
import { Caption, UIText } from "../../components/ui/Typography";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";

interface AutoSaveIndicatorProps {
  isActive: boolean;
  lastSave?: number | null;
  className?: string;
}

export default function AutoSaveIndicator({
  isActive,
  lastSave,
  className = "",
}: AutoSaveIndicatorProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [pulseAnim] = useState(new Animated.Value(1));
  const [showSaved, setShowSaved] = useState(false);

  // Pulsation animation when saving is active
  useEffect(() => {
    if (isActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
      // Retourner une fonction de nettoyage vide si les conditions ne sont pas remplies
      return () => {};
    }
  }, [isActive, pulseAnim]);

  // Temporarily show "Saved" after a save
  useEffect(() => {
    if (lastSave) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }

    // Retourner une fonction de nettoyage vide si les conditions ne sont pas remplies
    return () => {};
  }, [lastSave]);

  const formatLastSave = (timestamp: number | null): string => {
    if (!timestamp) return "";
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes > 0) return `${minutes}${t("autoSave.minutes")}`;
    if (seconds < 5) return t("autoSave.now");
    return `${seconds}${t("autoSave.seconds")}`;
  };

  if (!isActive && !lastSave) return null;

  return (
    <View
      style={[
        tw`flex-row items-center px-3 py-2 rounded-lg ${className}`,
        {
          backgroundColor: showSaved
            ? currentTheme.colors.success + "20"
            : currentTheme.colors.warning + "15",
          borderWidth: 1,
          borderColor: showSaved
            ? currentTheme.colors.success + "40"
            : currentTheme.colors.warning + "30",
        },
      ]}
    >
      <Animated.View
        style={[
          tw`mr-2`,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <UIText size="sm">{showSaved ? "✅" : "💾"}</UIText>
      </Animated.View>

      <View style={tw`flex-1`}>
        <Caption
          style={{
            color: showSaved
              ? currentTheme.colors.success
              : currentTheme.colors.warning,
            fontWeight: "500",
          }}
        >
          {showSaved ? t("autoSave.saved") : t("autoSave.autoSave")}
        </Caption>

        {lastSave && !showSaved && (
          <Caption style={{ color: currentTheme.colors.textSecondary }}>
            {t("autoSave.last")}: {formatLastSave(lastSave)}
          </Caption>
        )}
      </View>

      {isActive && !showSaved && (
        <View style={tw`flex-row items-center`}>
          <View
            style={[
              tw`w-2 h-2 rounded-full mr-1`,
              { backgroundColor: currentTheme.colors.warning },
            ]}
          />
          <Caption style={{ color: currentTheme.colors.textSecondary }}>
            {t("autoSave.active")}
          </Caption>
        </View>
      )}
    </View>
  );
}
