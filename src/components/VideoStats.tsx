import React from "react";
import { View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../contexts/ThemeContext";
import { useCentralizedFont } from "../hooks/useCentralizedFont";
import { useTranslation } from "../hooks/useTranslation";
import { UIText } from "./ui/Typography";

interface VideoStatsProps {
  duration: number;
  size: string;
  resolution: string;
  format?: "mp4" | "mov";
}

export default function VideoStats({
  duration,
  size,
  resolution,
  format,
}: VideoStatsProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View
      style={[
        tw`p-1.5 mx-2 rounded-lg mt-1.5 mb-0.5 border`,
        {
          backgroundColor: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
          shadowColor: currentTheme.colors.primary,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        },
      ]}
    >
      <View style={tw`flex-row justify-between mb-1 px-2`}>
        <UIText
          size="xs"
          style={[ui, { color: currentTheme.colors.textSecondary }]}
        >
          {t("videoStats.duration", "Duration")}
        </UIText>
        <UIText
          size="xs"
          weight="medium"
          style={[ui, { color: currentTheme.colors.text }]}
        >
          {formatDuration(duration)}
        </UIText>
      </View>

      <View style={tw`flex-row justify-between mb-1 px-2`}>
        <UIText
          size="xs"
          style={[ui, { color: currentTheme.colors.textSecondary }]}
        >
          {t("videoStats.size", "Size")}
        </UIText>
        <UIText
          size="xs"
          weight="medium"
          style={[ui, { color: currentTheme.colors.text }]}
        >
          {size}
        </UIText>
      </View>

      <View style={tw`flex-row justify-between mb-1 px-2`}>
        <UIText
          size="xs"
          style={[ui, { color: currentTheme.colors.textSecondary }]}
        >
          {t("videoStats.resolution", "Resolution")}
        </UIText>
        <UIText
          size="xs"
          weight="medium"
          style={[ui, { color: currentTheme.colors.text }]}
        >
          {resolution}
        </UIText>
      </View>

      {format && (
        <View style={tw`flex-row justify-between px-2`}>
          <UIText
            size="xs"
            style={[ui, { color: currentTheme.colors.textSecondary }]}
          >
            {t("videoStats.format", "Format")}
          </UIText>
          <View
            style={[
              tw`px-1.5 py-0.5 rounded-full`,
              {
                backgroundColor:
                  format === "mp4"
                    ? "#3b82f640" // Bleu pour MP4
                    : "#ef444440", // Rouge pour MOV
              },
            ]}
          >
            <UIText
              size="xs"
              weight="bold"
              style={[
                ui,
                {
                  color:
                    format === "mp4"
                      ? "#1d4ed8" // Bleu foncé pour MP4
                      : "#b91c1c", // Rouge foncé pour MOV
                },
              ]}
            >
              {format.toUpperCase()}
            </UIText>
          </View>
        </View>
      )}
    </View>
  );
}
