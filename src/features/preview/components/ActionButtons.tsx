import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import React from "react";
import { Pressable, View } from "react-native";
import Animated, {
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import tw from "twrnc";
import { useTheme } from "@/contexts/ThemeContext";
import { useCentralizedFont } from "@/hooks/useCentralizedFont";
import { useTranslation } from "@/hooks/useTranslation";
import { UIText } from "@/components/ui/Typography";

interface ActionButtonsProps {
  isExporting: boolean;
  onBasicShare: () => void;
  onExport: () => void;
}

export function ActionButtons({
  isExporting,
  onBasicShare,
  onExport,
}: ActionButtonsProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();

  // Animation values
  const exportScale = useSharedValue(1);
  const exportOpacity = useSharedValue(1);
  const basicShareScale = useSharedValue(1);

  // Gestion des animations pour les boutons
  React.useEffect(() => {
    if (isExporting) {
      exportScale.value = withSpring(1.05, { damping: 15 });
      exportOpacity.value = withTiming(0.8, { duration: 200 });
      basicShareScale.value = withTiming(0.95, { duration: 200 });
    } else {
      exportScale.value = withSpring(1, { damping: 15 });
      exportOpacity.value = withTiming(1, { duration: 200 });
      basicShareScale.value = withSpring(1, { damping: 15 });
    }
  }, [isExporting]);

  const exportAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: exportScale.value }],
    opacity: exportOpacity.value,
  }));

  const basicShareAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: basicShareScale.value }],
    opacity: isExporting ? 0.6 : 1,
  }));

  // Empêcher les actions pendant l'export
  const handleBasicSharePress = () => {
    if (!isExporting) {
      onBasicShare();
    }
  };

  // Couleurs dynamiques pour les boutons
  const shareColor = currentTheme.colors.secondary;
  const exportColor = currentTheme.colors.primary;

  return (
    <View style={tw`py-1`}>
      {/* Boutons alignés horizontalement */}
      <View style={tw`flex-row items-center gap-3`}>
        {/* Bouton de partage avec design moderne */}
        <Animated.View
          entering={FadeInLeft.duration(400).delay(200).springify()}
          style={[basicShareAnimatedStyle, tw`flex-1`]}
        >
          <Pressable
            onPress={handleBasicSharePress}
            disabled={isExporting}
            style={({ pressed }) => [
              tw`rounded-2xl p-3 flex-row items-center justify-center`,
              {
                backgroundColor: pressed
                  ? `${shareColor}20`
                  : currentTheme.colors.surface,
                borderWidth: 2,
                borderColor: `${shareColor}30`,
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <MaterialCommunityIcons
              name="share"
              size={22}
              color={shareColor}
              style={tw`mr-2`}
            />
            <UIText
              size="base"
              weight="semibold"
              style={[ui, { color: shareColor }]}
            >
              {t("preview.actions.share", "Partager")}
            </UIText>
          </Pressable>
        </Animated.View>

        {/* Bouton d'export principal avec gradient */}
        <Animated.View
          entering={FadeInRight.duration(500).delay(400).springify()}
          style={[exportAnimatedStyle, tw`flex-1`]}
        >
          <Pressable
            onPress={onExport}
            disabled={isExporting}
            style={({ pressed }) => [
              tw`rounded-2xl overflow-hidden`,
              {
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
                shadowColor: exportColor,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              },
            ]}
          >
            <LinearGradient
              colors={
                isExporting
                  ? [`${exportColor}80`, `${exportColor}60`]
                  : [exportColor, `${exportColor}E0`]
              }
              style={tw`p-3 flex-row items-center justify-center`}
            >
              <UIText size="base" weight="bold" style={[ui, tw`text-white`]}>
                {isExporting
                  ? t("preview.actions.exporting", "Export en cours...")
                  : t("preview.actions.export", "Exporter la vidéo")}
              </UIText>

              {/* Indicateur de chargement */}
              {isExporting && (
                <View style={tw`ml-2`}>
                  <Animated.View
                    entering={FadeInRight.duration(300)}
                    style={[
                      tw`w-4 h-4 rounded-full border-2 border-white border-t-transparent`,
                      {
                        transform: [{ rotate: "45deg" }],
                      },
                    ]}
                  />
                </View>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
