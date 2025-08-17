import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import * as React from "react";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";
import { Caption, H4, UIText } from "../../components/ui/Typography";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { Script } from "../../types";
import BackButton from "../common/BackButton";

interface EditorHeaderProps {
  isLoading: boolean;
  onGoBack: () => void;
  onImportTxt: () => void;
  onDismissKeyboard: () => void;
  wordCount?: number;
  content?: string;
  currentScript?: Script | null;
  onSaveScript?: () => void;
  isAutoSaveActive?: boolean;
  lastAutoSave?: number | null;
}

export default function EditorHeader({
  isLoading,
  onGoBack,
  onImportTxt,
  onDismissKeyboard,
  wordCount = 0,
  content = "",
  currentScript,
  onSaveScript,
  isAutoSaveActive = false,
  lastAutoSave,
}: EditorHeaderProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [showAutoSaveNotification, setShowAutoSaveNotification] =
    useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-50)).current;
  const { width: screenWidth } = Dimensions.get("window");

  const estimatedDuration = Math.ceil(wordCount / 150);

  const formatLastSave = (timestamp: number | null): string => {
    if (!timestamp) return "";
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes > 0) return `${minutes}${t("autoSave.minutes")}`;
    return `${seconds}${t("autoSave.seconds")}`;
  };

  // Handle temporary display of auto-save notification
  useEffect(() => {
    let animationTimer: ReturnType<typeof setTimeout>;

    if (isAutoSaveActive && lastAutoSave) {
      // Show notification
      setShowAutoSaveNotification(true);

      // Animation for appearance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Schedule disappearance after 2 seconds
      const timer = setTimeout(() => {
        // Animation for disappearance
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowAutoSaveNotification(false);
        });
      }, 2500);

      animationTimer = timer;
    } else if (!isAutoSaveActive) {
      // If auto-save is disabled, immediately hide the notification
      setShowAutoSaveNotification(false);
    }

    return () => {
      if (animationTimer) clearTimeout(animationTimer);
    };
  }, [lastAutoSave, isAutoSaveActive, fadeAnim, slideAnim]);

  // Define content for action buttons
  const renderActionButtons = () => {
    return (
      <View style={tw`flex-row items-center relative`}>
        {/* Next button (always visible if there's content) */}
        {onSaveScript && content.trim().length > 0 && (
          <TouchableOpacity
            onPress={() => {
              onDismissKeyboard();
              onSaveScript();
            }}
            style={[
              tw`px-3 py-1.5 rounded-lg mr-2`,
              {
                backgroundColor: currentTheme.colors.primary,
                shadowColor: currentTheme.colors.primary,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
                elevation: 2,
              },
            ]}
            activeOpacity={0.8}
          >
            <UIText size="sm" weight="medium" style={{ color: "white" }}>
              {t("editor.actions.next")}
            </UIText>
          </TouchableOpacity>
        )}

        {/* TXT Button */}
        {!isLoading && (
          <TouchableOpacity
            onPress={() => {
              onDismissKeyboard();
              onImportTxt();
            }}
            style={[
              tw`w-8 h-8 rounded-lg items-center justify-center`,
              {
                backgroundColor: currentTheme.colors.accent,
                shadowColor: currentTheme.colors.accent,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
                elevation: 2,
              },
            ]}
            activeOpacity={0.8}
          >
            <MaterialIcons name="description" size={18} color="white" />
          </TouchableOpacity>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <ActivityIndicator color={currentTheme.colors.primary} size="small" />
        )}
      </View>
    );
  };

  return (
    <>
      <View
        style={[
          tw`px-4 py-2`,
          {
            backgroundColor: currentTheme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: currentTheme.colors.border,
            shadowColor: currentTheme.colors.primary,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          },
        ]}
      >
        {/* First line: Navigation and actions */}
        <View style={tw`flex-row items-center justify-between`}>
          {/* Left side: BackButton + Title */}
          <View style={[tw`flex-row items-center flex-1`]}>
            <BackButton
              onPress={onGoBack}
              style={[
                tw`w-10 h-10 rounded-full items-center justify-center`,
                {
                  backgroundColor: currentTheme.colors.primary,
                  shadowColor: currentTheme.colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 6,
                },
              ]}
              floating={false}
              size={10}
              iconSize={20}
              iconColor="white"
            />

            <View>
              <H4 style={{ color: currentTheme.colors.text }}>
                {t("editor.title")}
              </H4>
            </View>
          </View>

          {/* Right side: Buttons */}
          <View style={tw`flex-row items-center`}>{renderActionButtons()}</View>
        </View>

        {/* Second line: Centered statistics */}
        <View style={tw`flex-row items-center justify-center mt-2`}>
          <View
            style={[
              tw`flex-row items-center px-2 py-0.5 rounded-md mx-1`,
              { backgroundColor: currentTheme.colors.primary + "15" },
            ]}
          >
            <Caption
              style={[
                tw`mr-1 font-bold`,
                { color: currentTheme.colors.primary },
              ]}
            >
              {wordCount}
            </Caption>
            <Caption style={{ color: currentTheme.colors.textMuted }}>
              {t("editor.stats.words")}
            </Caption>
          </View>

          <View
            style={[
              tw`flex-row items-center px-2 py-0.5 rounded-md mx-1`,
              { backgroundColor: currentTheme.colors.accent + "15" },
            ]}
          >
            <Caption
              style={[
                tw`mr-1 font-bold`,
                { color: currentTheme.colors.accent },
              ]}
            >
              ~{estimatedDuration}
            </Caption>
            <Caption style={{ color: currentTheme.colors.textMuted }}>
              {t("editor.stats.min")}
            </Caption>
          </View>

          <View
            style={[
              tw`flex-row items-center px-2 py-0.5 rounded-md mx-1`,
              { backgroundColor: currentTheme.colors.success + "15" },
            ]}
          >
            <Caption
              style={[
                tw`mr-1 font-bold`,
                { color: currentTheme.colors.success },
              ]}
            >
              {content.length}
            </Caption>
            <Caption style={{ color: currentTheme.colors.textMuted }}>
              {t("editor.stats.chars")}
            </Caption>
          </View>

          {/* Auto-save indicator */}
          {lastAutoSave && (
            <View
              style={[
                tw`flex-row items-center px-2 py-0.5 rounded-md mx-1`,
                { backgroundColor: currentTheme.colors.warning + "15" },
              ]}
            >
              <Caption style={tw`mr-1`}>💾</Caption>
              <Caption
                style={[tw`font-bold`, { color: currentTheme.colors.warning }]}
              >
                {formatLastSave(lastAutoSave)}
              </Caption>
            </View>
          )}
        </View>
      </View>
    </>
  );
}
