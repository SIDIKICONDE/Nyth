import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Dimensions, View } from "react-native";
import { useCentralizedFont } from "../../../hooks/useCentralizedFont";
import { RecordingSettings, Script } from "../../../types";
import { TextFormatter } from "../../../utils/textFormatter";
import { ContentText } from "../../ui/Typography";
import { TouchPauseHandler } from "./TouchPauseHandler";
import { ScrollingState } from "./types";

interface TeleprompterContentProps {
  script: Script | null;
  settings: RecordingSettings;
  scrollAnimation: Animated.Value;
  scrollingState: ScrollingState;
  currentTheme: any;
  onDoubleTap?: () => void;
  onTextHeightChange?: (height: number) => void;
  onTextMeasured?: (measured: boolean) => void;
  onTogglePause?: () => void;
  onPauseScroll?: () => void;
  onResumeScroll?: () => void;
}

export function TeleprompterContent({
  script,
  settings,
  scrollAnimation,
  scrollingState,
  currentTheme,
  onDoubleTap,
  onTextHeightChange,
  onTextMeasured,
  onTogglePause,
  onPauseScroll,
  onResumeScroll,
}: TeleprompterContentProps) {
  const { t } = useTranslation();

  const { content } = useCentralizedFont({
    defaultCategory: "content",
    baseSize: settings?.fontSize || 16,
    autoLineHeight: true,
    autoLetterSpacing: false,
  });

  const contentMeasuredRef = useRef(false);
  const textHeightRef = useRef(0);
  const [forceRemount, setForceRemount] = useState(0);

  const calculateTextHeight = () => {
    try {
      if (!script?.content || typeof script.content !== "string") return 0;

      const fontSize = settings?.fontSize || 20;
      const lineHeight = (settings as any)?.lineHeightMultiplier
        ? fontSize * (settings as any).lineHeightMultiplier
        : fontSize * 1.4;

      let screenWidth = 375;
      try {
        const dimensions = Dimensions.get("window");
        screenWidth = dimensions.width || 375;
      } catch {
        screenWidth = 375;
      }

      const containerMargins = 32;
      const contentPadding = 32;
      const availableWidth = screenWidth - containerMargins - contentPadding;

      if (availableWidth <= 0) {
        return 100;
      }

      const avgCharWidth = fontSize * 0.6;
      const charsPerLine = Math.max(
        1,
        Math.floor(availableWidth / avgCharWidth)
      );

      const words = script.content.split(/\s+/);
      let currentLineLength = 0;
      let numberOfLines = 1;

      words.forEach((word) => {
        if (currentLineLength + word.length > charsPerLine) {
          numberOfLines++;
          currentLineLength = word.length;
        } else {
          currentLineLength += word.length + 1;
        }
      });

      const totalHeight = Math.max(100, numberOfLines * lineHeight + 40);
      return totalHeight;
    } catch {
      return 100;
    }
  };

  useEffect(() => {
    if (script?.content && !contentMeasuredRef.current) {
      const estimatedHeight = calculateTextHeight();
      textHeightRef.current = estimatedHeight;
      if (onTextHeightChange) onTextHeightChange(estimatedHeight);
      contentMeasuredRef.current = true;
      if (onTextMeasured) onTextMeasured(true);

      const baseStart = scrollingState.startPosition;
      const posSetting = (settings as any)?.startPosition ?? "top";
      const offset = (settings as any)?.positionOffset ?? 0;
      const translateStart =
        posSetting === "top"
          ? baseStart + offset
          : posSetting === "center"
          ? baseStart + offset - textHeightRef.current / 2
          : baseStart + offset - textHeightRef.current;

      scrollAnimation.setValue(translateStart);
    }
  }, [
    script?.content,
    settings?.fontSize,
    (settings as any)?.lineHeightMultiplier,
  ]);

  useEffect(() => {
    if (!script?.content) return;
    contentMeasuredRef.current = false;
    setForceRemount((prev) => prev + 1);
  }, [script?.content]);

  useEffect(() => {
    if (contentMeasuredRef.current) {
      contentMeasuredRef.current = false;
      setForceRemount((prev) => prev + 1);
    }
  }, [
    settings?.fontSize,
    settings?.textAlignment,
    settings?.textColor,
    (settings as any)?.lineHeightMultiplier,
    (settings as any)?.letterSpacing,
    (settings as any)?.verticalPaddingTop,
    (settings as any)?.verticalPaddingBottom,
    (settings as any)?.isMirroredVertical,
    (settings as any)?.guideEnabled,
    (settings as any)?.guideColor,
    (settings as any)?.guideOpacity,
    (settings as any)?.guideHeight,
  ]);

  useEffect(() => {
    const baseStart = scrollingState.startPosition;
    const posSetting = (settings as any)?.startPosition ?? "top";
    const offset = (settings as any)?.positionOffset ?? 0;
    const height = textHeightRef.current;
    const translateStart =
      posSetting === "top"
        ? baseStart + offset
        : posSetting === "center"
        ? baseStart + offset - height / 2
        : baseStart + offset - height;
    scrollAnimation.setValue(translateStart);
  }, [
    (settings as any)?.startPosition,
    (settings as any)?.positionOffset,
    scrollingState.startPosition,
    forceRemount,
  ]);

  if (!onPauseScroll || !onResumeScroll) {
    return null;
  }

  const teleprompterTextStyle = {
    fontSize: settings?.fontSize || 16,
    color: settings?.textColor || "#ffffff",
    lineHeight:
      settings && (settings as any).lineHeightMultiplier
        ? (settings?.fontSize || 16) * (settings as any).lineHeightMultiplier
        : (settings?.fontSize || 16) * 1.4,
    letterSpacing: (settings as any)?.letterSpacing ?? 0,
    paddingVertical: 8,
    ...(settings?.textShadow && {
      textShadowColor: currentTheme.isDark
        ? "rgba(0,0,0,0.8)"
        : "rgba(255,255,255,0.8)",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 3,
    }),
    transform: [
      { scaleX: settings?.isMirrored ? -1 : 1 },
      { scaleY: (settings as any)?.isMirroredVertical ? -1 : 1 },
    ],
  } as const;

  const screenWidth = Dimensions.get("window").width;
  const horizontalPadding =
    settings?.horizontalMargin !== undefined
      ? Math.round((screenWidth * (settings.horizontalMargin || 0)) / 100)
      : 16;

  const verticalPaddingTop = (settings as any)?.verticalPaddingTop ?? 40;
  const verticalPaddingBottom = (settings as any)?.verticalPaddingBottom ?? 40;

  const guideEnabled = (settings as any)?.guideEnabled ?? false;
  const guideColor = (settings as any)?.guideColor ?? "#FFCC00";
  const guideOpacity = (settings as any)?.guideOpacity ?? 0.35;
  const guideHeight = (settings as any)?.guideHeight ?? 2;

  return (
    <TouchPauseHandler
      onTogglePause={onTogglePause}
      onPauseScroll={onPauseScroll}
      onResumeScroll={onResumeScroll}
      onDoubleTap={onDoubleTap}
    >
      <View
        key={forceRemount}
        style={{ flex: 1, padding: 4, paddingTop: 0, paddingBottom: 0 }}
      >
        <Animated.View
          style={{
            transform: [{ translateY: scrollAnimation }],
            width: "100%",
            minHeight: Math.max(20000, textHeightRef.current * 2),
          }}
        >
          <View
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout;
              if (height > 0 && height !== textHeightRef.current) {
                textHeightRef.current = height;
                if (onTextHeightChange) onTextHeightChange(height);
                if (onTextMeasured) onTextMeasured(true);
                const baseStart = scrollingState.startPosition;
                const posSetting = (settings as any)?.startPosition ?? "top";
                const offset = (settings as any)?.positionOffset ?? 0;
                const translateStart =
                  posSetting === "top"
                    ? baseStart + offset
                    : posSetting === "center"
                    ? baseStart + offset - height / 2
                    : baseStart + offset - height;
                scrollAnimation.setValue(translateStart);
              }
            }}
            style={{
              minHeight: Math.max(1000, textHeightRef.current),
              paddingHorizontal: horizontalPadding,
              paddingTop: verticalPaddingTop,
              paddingBottom: verticalPaddingBottom,
            }}
          >
            <ContentText
              color={settings?.textColor || "#ffffff"}
              style={[
                teleprompterTextStyle,
                { textAlign: settings?.textAlignment || "center" },
              ]}
              numberOfLines={0}
              ellipsizeMode="clip"
              allowFontScaling={false}
            >
              {(() => {
                try {
                  if (script?.content && typeof script.content === "string") {
                    let formattedContent = script.content;
                    try {
                      formattedContent = TextFormatter.applyMarkdownFormatting(
                        script.content
                      );
                    } catch {
                      formattedContent = script.content;
                    }
                    try {
                      return formattedContent
                        .replace(/<[^>]*>/g, "")
                        .replace(/&lt;/g, "")
                        .replace(/&gt;/g, "");
                    } catch {
                      return formattedContent;
                    }
                  } else {
                    return t(
                      "recording.promptText",
                      "Your text will appear here..."
                    );
                  }
                } catch {
                  return t(
                    "recording.promptText",
                    "Your text will appear here..."
                  );
                }
              })()}
            </ContentText>
          </View>
        </Animated.View>

        {guideEnabled && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "50%",
              height: guideHeight,
              backgroundColor: guideColor,
              opacity: guideOpacity,
            }}
          />
        )}
      </View>
    </TouchPauseHandler>
  );
}
