import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useCentralizedFont } from "../../hooks/useCentralizedFont";
import { useDisplayPreferences } from "../../hooks/useDisplayPreferences";
import { useTranslation } from "../../hooks/useTranslation";
import { useContrastOptimization } from "../../hooks/useContrastOptimization";
import { UIText } from "../ui/Typography";

type TabType = "scripts" | "videos";

interface TabSelectorAnimatedProps {
  activeTab: TabType;
  scriptsCount: number;
  recordingsCount: number;
  onTabChange: (tab: TabType) => void;
}

interface TabButtonProps {
  isActive: boolean;
  onPress: () => void;
  icon: string;
  label: string;
  count: number;
  isLibraryMode: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({
  isActive,
  onPress,
  icon,
  label,
  count,
  isLibraryMode,
}) => {
  const { currentTheme } = useTheme();
  const { ui } = useCentralizedFont();
  const { getOptimizedTabColors, getOptimizedBadgeColors } =
    useContrastOptimization();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let glowLoop: Animated.CompositeAnimation | null = null;
    if (isActive && isLibraryMode) {
      glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      glowLoop.start();
    } else {
      glowAnim.setValue(0);
    }
    return () => {
      glowLoop?.stop?.();
    };
  }, [isActive, isLibraryMode, glowAnim]);

  const handlePress = () => {
    // Animation de pression
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={tw`flex-1`}
    >
      <Animated.View
        style={[tw`relative`, { transform: [{ scale: scaleAnim }] }]}
      >
        {isLibraryMode && isActive ? (
          <LinearGradient
            colors={[
              currentTheme.colors.primary,
              `${currentTheme.colors.primary}DD`,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              tw`px-4 py-3 rounded-xl flex-row items-center justify-center`,
              {
                shadowColor: currentTheme.colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 8,
                elevation: 8,
                borderWidth: 2,
                borderColor: `${currentTheme.colors.primary}`,
              },
            ]}
          >
            {/* Effet de lueur animé */}
            <Animated.View
              style={[
                tw`absolute inset-0 rounded-xl`,
                {
                  backgroundColor: currentTheme.colors.background,
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.1, 0.3],
                  }),
                },
              ]}
            />

            <MaterialCommunityIcons
              name={icon}
              size={22}
              color={currentTheme.colors.background}
              style={{
                textShadowColor: "rgba(0,0,0,0.3)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
            />
            <UIText
              size="base"
              weight="bold"
              style={[
                ui,
                tw`ml-2 text-white`,
                {
                  textShadowColor: "rgba(0,0,0,0.3)",
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                },
              ]}
            >
              {label}
            </UIText>
            <View style={tw`ml-2 bg-white px-2 py-0.5 rounded-full`}>
              <UIText
                size="xs"
                weight="bold"
                style={[ui, { color: currentTheme.colors.primary }]}
              >
                {count}
              </UIText>
            </View>
          </LinearGradient>
        ) : (
          <View
            style={[
              tw`px-4 py-3 rounded-xl flex-row items-center justify-center`,
              {
                backgroundColor: isActive
                  ? getOptimizedTabColors(true).background
                  : isLibraryMode
                  ? `${currentTheme.colors.surface}80`
                  : "transparent",
                borderWidth: isActive ? 0 : 2,
                borderColor: isLibraryMode
                  ? currentTheme.colors.border
                  : isActive
                  ? getOptimizedTabColors(true).background
                  : currentTheme.colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={20}
              color={
                isActive
                  ? getOptimizedTabColors(true).text
                  : currentTheme.colors.textSecondary
              }
            />
            <UIText
              size="base"
              weight="medium"
              style={[
                ui,
                tw`ml-2`,
                {
                  color: isActive
                    ? getOptimizedTabColors(true).text
                    : currentTheme.colors.textSecondary,
                },
              ]}
            >
              {label}
            </UIText>
            <View
              style={[
                tw`ml-2 px-2 py-0.5 rounded-full`,
                {
                  backgroundColor: isActive
                    ? getOptimizedBadgeColors(true).background
                    : currentTheme.colors.surface,
                },
              ]}
            >
              <UIText
                size="xs"
                weight="bold"
                color={
                  isActive
                    ? getOptimizedBadgeColors(true).text
                    : currentTheme.colors.textSecondary
                }
                style={ui}
              >
                {count}
              </UIText>
            </View>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function TabSelectorAnimated({
  activeTab,
  scriptsCount,
  recordingsCount,
  onTabChange,
}: TabSelectorAnimatedProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { scriptDisplayStyle } = useDisplayPreferences();

  const isLibraryMode = scriptDisplayStyle === "library";

  // Configuration des onglets avec icônes Material Community Icons
  const tabs = [
    {
      value: "scripts" as TabType,
      icon: isLibraryMode ? "bookshelf" : "file-document-multiple",
      label: t("home.tabs.scripts"),
      count: scriptsCount,
    },
    {
      value: "videos" as TabType,
      icon: isLibraryMode ? "cassette" : "video-vintage",
      label: t("home.tabs.videos"),
      count: recordingsCount,
    },
  ];

  return (
    <View style={tw`px-4 py-3`}>
      <View
        style={[
          tw`flex-row rounded-2xl p-1`,
          {
            backgroundColor: isLibraryMode
              ? `${currentTheme.colors.background}95`
              : currentTheme.colors.surface,
            borderWidth: isLibraryMode ? 1 : 0,
            borderColor: currentTheme.colors.border,
            shadowColor: isLibraryMode ? "#000" : "transparent",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isLibraryMode ? 0.1 : 0,
            shadowRadius: 4,
            elevation: isLibraryMode ? 3 : 0,
          },
        ]}
      >
        {tabs.map((tab, index) => (
          <React.Fragment key={tab.value}>
            <TabButton
              isActive={activeTab === tab.value}
              onPress={() => onTabChange(tab.value)}
              icon={tab.icon}
              label={tab.label}
              count={tab.count}
              isLibraryMode={isLibraryMode}
            />
            {index < tabs.length - 1 && <View style={tw`w-0.5 mx-1`} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}
