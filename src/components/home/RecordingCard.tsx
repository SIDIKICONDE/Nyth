import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import RNFS from "react-native-fs";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Dimensions, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Card } from "react-native-paper";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { Recording, Script } from "../../types";
import { toDate } from "../../utils/dateHelpers";
import { formatDate, formatTime } from "../../utils/dateUtils";
import { UIText } from "../ui/Typography";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('RecordingCard');

interface RecordingCardProps {
  recording: Recording;
  scripts: Script[];
  onPress: () => void;
  onDelete: () => void;
  isSelected?: boolean | null;
  onToggleSelection?: () => void;
  onLongPress?: () => void;
}

export default function RecordingCard({
  recording,
  scripts,
  onPress,
  onDelete,
  isSelected = null,
  onToggleSelection,
  onLongPress,
}: RecordingCardProps) {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [fileExists, setFileExists] = useState(true);
  const [checkingFile, setCheckingFile] = useState(true);
  const isSelectionMode = isSelected !== null;
  const swipeableRef = useRef<Swipeable>(null);

  // Dynamic calculation of content preview length
  const descriptionLength = useMemo(() => {
    const screenWidth = Dimensions.get("window").width;
    // About 5 pixels per character for the description
    return Math.floor(screenWidth / 5);
  }, []);

  useEffect(() => {
    const checkVideoFile = async () => {
      try {
        const fileInfo = await RNFS.stat(recording.videoUri);
        setFileExists(fileInfo.isFile());
      } catch (error) {
        logger.error("Error checking file:", error);
        setFileExists(false);
      } finally {
        setCheckingFile(false);
      }
    };

    checkVideoFile();
  }, [recording.videoUri]);

  const getScriptTitle = (scriptId?: string) => {
    if (!scriptId) return t("home.recording.noScript");
    const script = scripts.find((s) => s.id === scriptId);
    return script?.title || t("home.recording.untitled");
  };

  const handlePress = () => {
    if (isSelectionMode && onToggleSelection) {
      onToggleSelection();
    } else if (fileExists) {
      onPress();
    } else {
      Alert.alert(
        t("home.recording.fileNotFound"),
        t("home.recording.fileNotFoundMessage"),
        [
          {
            text: t("home.recording.removeFromList"),
            onPress: onDelete,
          },
          {
            text: t("common.cancel"),
            style: "cancel",
          },
        ]
      );
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress();
    }
  };

  const handleDelete = () => {
    if (swipeableRef.current) {
      swipeableRef.current.close();
    }
    onDelete();
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    // Delete progress calculation based on movement
    const deleteProgress = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [100, 0],
      extrapolate: "clamp",
    });

    // More dramatic color effect to show progress
    const backgroundColor = progress.interpolate({
      inputRange: [0, 1],
      outputRange: ["#ff3b3030", "#ff3b30"],
    });

    // Animation for text
    const textOpacity = deleteProgress.interpolate({
      inputRange: [30, 50, 70, 100],
      outputRange: [0, 1, 1, 0],
      extrapolate: "clamp",
    });

    const confirmOpacity = deleteProgress.interpolate({
      inputRange: [60, 80, 100],
      outputRange: [0, 1, 1],
      extrapolate: "clamp",
    });

    // Animation for scale effect that gives a tactile feeling
    const scale = deleteProgress.interpolate({
      inputRange: [0, 50, 100],
      outputRange: [0.95, 0.97, 1],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          tw`flex-1 h-8 justify-center items-center`,
          {
            backgroundColor,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={tw`w-full flex-row justify-between items-center px-4`}>
          <Animated.Text
            style={[tw`text-white font-bold text-xs`, { opacity: textOpacity }]}
          >
            {t("home.recording.swipe")}
          </Animated.Text>

          <Animated.Text
            style={[
              tw`text-white font-bold text-xs`,
              { opacity: confirmOpacity },
            ]}
            onPress={handleDelete}
          >
            {t("home.recording.release")}
          </Animated.Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      enabled={!isSelectionMode}
      friction={2.2}
      overshootRight={false}
      rightThreshold={50}
      overshootFriction={12}
      animationOptions={{
        overshootClamping: false,
        restSpeedThreshold: 0.1,
        restDisplacementThreshold: 0.1,
        useNativeAnimations: true,
      }}
      onSwipeableRightOpen={handleDelete}
    >
      <Card
        style={[
          tw`mx-3 mb-2`,
          {
            backgroundColor: isSelected
              ? `${currentTheme.colors.primary}10`
              : currentTheme.colors.surface,
            borderWidth: 1,
            borderColor: isSelected
              ? currentTheme.colors.primary
              : fileExists
              ? currentTheme.colors.border
              : currentTheme.colors.error,
            opacity: fileExists ? 1 : 0.6,
            shadowColor: currentTheme.colors.primary,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 2,
            elevation: 1,
          },
        ]}
        onPress={handlePress}
        onLongPress={handleLongPress}
      >
        <Card.Content style={tw`p-2`}>
          <View style={tw`flex-1`}>
            <View style={tw`flex-row justify-between items-center mb-1`}>
              <View style={tw`flex-row items-center flex-1 mr-2`}>
                {isSelectionMode ? (
                  <MaterialCommunityIcons
                    name={
                      isSelected ? "checkbox-marked" : "checkbox-blank-outline"
                    }
                    size={22}
                    color={
                      isSelected
                        ? currentTheme.colors.primary
                        : currentTheme.colors.textSecondary
                    }
                    style={tw`mr-1`}
                  />
                ) : (
                  <UIText style={tw`mr-1`}>🎬</UIText>
                )}
                <UIText
                  size={16}
                  weight="medium"
                  style={tw`flex-1`}
                  numberOfLines={1}
                >
                  {getScriptTitle(recording.scriptId)}
                </UIText>
              </View>

              <UIText size="xs" color={currentTheme.colors.text + "60"}>
                {formatDate(toDate(recording.createdAt))}{" "}
                {t("home.recording.at")}{" "}
                {formatTime(toDate(recording.createdAt))}
              </UIText>
            </View>

            {/* Inline badges */}
            <View style={tw`flex-row gap-1`}>
              {/* Quality badge based on duration */}
              <View
                style={[
                  tw`px-1.5 py-0.5 rounded-full`,
                  {
                    backgroundColor:
                      recording.duration > 60
                        ? currentTheme.colors.success
                        : recording.duration > 30
                        ? currentTheme.colors.warning
                        : currentTheme.colors.error,
                  },
                ]}
              >
                <UIText size={10} weight="bold" style={{ color: "white" }}>
                  {recording.duration > 60
                    ? "HD"
                    : recording.duration > 30
                    ? "MD"
                    : "SD"}
                </UIText>
              </View>

              {/* Overlay badge if present */}
              {recording.hasOverlay && (
                <View
                  style={[
                    tw`px-1.5 py-0.5 rounded-full`,
                    { backgroundColor: currentTheme.colors.accent },
                  ]}
                >
                  <UIText size={10} weight="bold" style={{ color: "white" }}>
                    📝
                  </UIText>
                </View>
              )}

              {/* File status badge */}
              {checkingFile ? (
                <View
                  style={[
                    tw`px-1.5 py-0.5 rounded-full`,
                    { backgroundColor: currentTheme.colors.border },
                  ]}
                >
                  <UIText
                    size={10}
                    weight="bold"
                    color={currentTheme.colors.textMuted}
                  >
                    ⏳
                  </UIText>
                </View>
              ) : !fileExists ? (
                <View
                  style={[
                    tw`px-1.5 py-0.5 rounded-full`,
                    { backgroundColor: currentTheme.colors.error },
                  ]}
                >
                  <UIText size={10} weight="bold" style={{ color: "white" }}>
                    ❌
                  </UIText>
                </View>
              ) : (
                <View
                  style={[
                    tw`px-1.5 py-0.5 rounded-full`,
                    { backgroundColor: currentTheme.colors.success },
                  ]}
                >
                  <UIText size={10} weight="bold" style={{ color: "white" }}>
                    ✅
                  </UIText>
                </View>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    </Swipeable>
  );
}
