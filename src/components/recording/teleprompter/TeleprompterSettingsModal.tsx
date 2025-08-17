import React, { useState, useEffect } from "react";
import { View, Text, Modal, ScrollView } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { TeleprompterSettings } from "./types";
import { SettingsHeader } from "./settings/SettingsHeader";
import { SpeedControl } from "./settings/SpeedControl";
import { FontSizeControl } from "./settings/FontSizeControl";
import {
  TextColorPicker,
  BackgroundColorPicker,
  IconColorPicker,
} from "./settings/ColorPickers";
import { AlignmentSelector } from "./settings/AlignmentSelector";
import { OpacityControl } from "./settings/OpacityControl";
import { OptionsToggles } from "./settings/OptionsToggles";
import { SettingsFooter } from "./settings/SettingsFooter";
import { MarginControl } from "./settings/MarginControl";
import { GlassEffectControl } from "./settings/GlassEffectControl";
import { LineHeightControl } from "./settings/LineHeightControl";
import { LetterSpacingControl } from "./settings/LetterSpacingControl";
import { VerticalPaddingControl } from "./settings/VerticalPaddingControl";
import { StartPositionSelector } from "./settings/StartPositionSelector";
import { GuideLineControl } from "./settings/GuideLineControl";
import { ScrollMethodControl } from "./settings/ScrollMethodControl";
import { TextShadowControl } from "./settings/TextShadowControl";

interface TeleprompterSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  settings: Partial<
    TeleprompterSettings & {
      scrollCalculationMethod?: "classic" | "wpm" | "duration" | "lines";
      scrollWPM?: number;
      scrollDurationMinutes?: number;
      scrollLinesPerSecond?: number;
    }
  >;
  onSettingsChange: (settings: any) => void;
  scrollSpeed: number;
  onScrollSpeedChange: (speed: number) => void;
  backgroundOpacity: number;
  onBackgroundOpacityChange: (opacity: number) => void;
}

export function TeleprompterSettingsModal({
  visible,
  onClose,
  settings,
  onSettingsChange,
  scrollSpeed,
  onScrollSpeedChange,
  backgroundOpacity,
  onBackgroundOpacityChange,
}: TeleprompterSettingsModalProps) {
  const { currentTheme } = useTheme();

  const [localSettings, setLocalSettings] = useState<any>(settings);
  const [localScrollSpeed, setLocalScrollSpeed] = useState(scrollSpeed);
  const [localBackgroundOpacity, setLocalBackgroundOpacity] =
    useState(backgroundOpacity);

  useEffect(() => {
    setLocalSettings(settings);
    setLocalScrollSpeed(scrollSpeed);
    setLocalBackgroundOpacity(backgroundOpacity);
  }, [settings, scrollSpeed, backgroundOpacity]);

  const updateSetting = (key: string, value: any) => {
    const newSettings = {
      ...localSettings,
      [key]: value,
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={tw`flex-1 bg-black bg-opacity-50 justify-center items-center`}
      >
        <View
          style={[
            tw`w-11/12 max-w-md rounded-3xl p-6 m-4`,
            {
              backgroundColor: currentTheme.colors.background,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 20,
            },
          ]}
        >
          <SettingsHeader />

          <ScrollView style={tw`max-h-96`} showsVerticalScrollIndicator={false}>
            <ScrollMethodControl
              method={localSettings.scrollCalculationMethod as any}
              wpm={localSettings.scrollWPM}
              durationMinutes={localSettings.scrollDurationMinutes}
              linesPerSecond={localSettings.scrollLinesPerSecond}
              onChange={(next) => {
                const mapped = {
                  scrollCalculationMethod: next.method,
                  scrollWPM: next.wpm,
                  scrollDurationMinutes: next.durationMinutes,
                  scrollLinesPerSecond: next.linesPerSecond,
                };
                const merged = { ...localSettings, ...mapped };
                setLocalSettings(merged);
                onSettingsChange(merged);
              }}
            />

            <SpeedControl
              value={localScrollSpeed}
              onChange={(v) => {
                setLocalScrollSpeed(v);
                onScrollSpeedChange(v);
              }}
            />
            <FontSizeControl
              value={localSettings.fontSize || 24}
              onChange={(size) =>
                updateSetting("fontSize", Math.max(12, Math.min(48, size)))
              }
            />

            <LineHeightControl
              value={localSettings.lineHeightMultiplier}
              onChange={(v) => updateSetting("lineHeightMultiplier", v)}
            />

            <LetterSpacingControl
              value={localSettings.letterSpacing}
              onChange={(v) => updateSetting("letterSpacing", v)}
            />

            <View style={tw`mb-5`}>
              <Text
                style={[
                  tw`text-lg font-semibold mb-3`,
                  { color: currentTheme.colors.text },
                ]}
              >
                Couleurs
              </Text>
              <View style={tw`mb-3`}>
                <TextColorPicker
                  selectedColor={localSettings.textColor}
                  onSelect={(c) => updateSetting("textColor", c)}
                />
              </View>
              <BackgroundColorPicker
                selectedColor={localSettings.backgroundColor}
                onSelect={(c) => updateSetting("backgroundColor", c)}
              />
              <View style={tw`mt-3`}>
                <IconColorPicker
                  title="Icône réglages"
                  selectedColor={localSettings.settingsIconColor}
                  onSelect={(c) => updateSetting("settingsIconColor", c)}
                />
                <IconColorPicker
                  title="Icône édition"
                  selectedColor={localSettings.editIconColor}
                  onSelect={(c) => updateSetting("editIconColor", c)}
                />
              </View>
            </View>

            <AlignmentSelector
              value={localSettings.textAlignment}
              onChange={(a) => updateSetting("textAlignment", a)}
            />

            <MarginControl
              value={localSettings.horizontalMargin ?? 10}
              onChange={(v) => updateSetting("horizontalMargin", v)}
            />

            <VerticalPaddingControl
              top={localSettings.verticalPaddingTop}
              bottom={localSettings.verticalPaddingBottom}
              onChange={(v) => {
                const merged = {
                  ...localSettings,
                  verticalPaddingTop: v.top,
                  verticalPaddingBottom: v.bottom,
                };
                setLocalSettings(merged);
                onSettingsChange(merged);
              }}
            />

            <StartPositionSelector
              value={localSettings.startPosition}
              offset={localSettings.positionOffset}
              onChange={(v) => {
                const merged = {
                  ...localSettings,
                  startPosition: v.position,
                  positionOffset: v.offset,
                };
                setLocalSettings(merged);
                onSettingsChange(merged);
              }}
            />

            <OpacityControl
              value={localBackgroundOpacity}
              onChange={(v) => {
                setLocalBackgroundOpacity(v);
                onBackgroundOpacityChange(v);
              }}
            />
            <OptionsToggles
              isMirrored={localSettings.isMirrored}
              onToggleMirror={(v) => updateSetting("isMirrored", v)}
              textShadow={localSettings.textShadow}
              onToggleTextShadow={(v) => updateSetting("textShadow", v)}
              hideControls={localSettings.hideControls}
              onToggleHideControls={(v) => updateSetting("hideControls", v)}
              isMirroredVertical={localSettings.isMirroredVertical}
              onToggleMirrorVertical={(v) =>
                updateSetting("isMirroredVertical", v)
              }
              guideEnabled={localSettings.guideEnabled}
              onToggleGuide={(v) => updateSetting("guideEnabled", v)}
            />

            <TextShadowControl
              value={localSettings.textShadow}
              onChange={(v) => updateSetting("textShadow", v)}
            />

            {localSettings.guideEnabled && (
              <GuideLineControl
                color={localSettings.guideColor}
                opacity={localSettings.guideOpacity}
                height={localSettings.guideHeight}
                onChange={(next) => {
                  const mapped = {
                    ...(next.color !== undefined
                      ? { guideColor: next.color }
                      : {}),
                    ...(next.opacity !== undefined
                      ? { guideOpacity: next.opacity }
                      : {}),
                    ...(next.height !== undefined
                      ? { guideHeight: next.height }
                      : {}),
                  };
                  const merged = { ...localSettings, ...mapped };
                  setLocalSettings(merged);
                  onSettingsChange(merged);
                }}
              />
            )}

            <GlassEffectControl
              enabled={localSettings.glassEnabled}
              onToggle={(v) => updateSetting("glassEnabled", v)}
              blurAmount={localSettings.glassBlurAmount ?? 25}
              onBlurChange={(v) => updateSetting("glassBlurAmount", v)}
            />
          </ScrollView>

          <SettingsFooter
            onReset={() => {
              const defaults = {
                fontSize: 24,
                textColor: "#FFFFFF",
                backgroundColor: "#000000",
                textAlignment: "center",
                horizontalMargin: 10,
                isMirrored: false,
                textShadow: true,
                hideControls: false,
                glassEnabled: true,
                glassBlurAmount: 25,
                lineHeightMultiplier: 1.4,
                letterSpacing: 0,
                verticalPaddingTop: 40,
                verticalPaddingBottom: 40,
                startPosition: "top",
                positionOffset: 0,
                isMirroredVertical: false,
                guideEnabled: false,
                guideColor: "#FFCC00",
                guideOpacity: 0.35,
                guideHeight: 2,
                scrollCalculationMethod: "classic" as const,
                scrollWPM: 160,
                scrollDurationMinutes: 3,
                scrollLinesPerSecond: 1,
              };
              setLocalSettings(defaults);
              onSettingsChange(defaults);
              setLocalScrollSpeed(50);
              onScrollSpeedChange(50);
              setLocalBackgroundOpacity(80);
              onBackgroundOpacityChange(80);
            }}
            onClose={onClose}
          />
        </View>
      </View>
    </Modal>
  );
}
