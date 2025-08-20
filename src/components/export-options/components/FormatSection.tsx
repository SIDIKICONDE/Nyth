import React from "react";
import { TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../hooks/useCentralizedFont";
import { useTranslation } from "../../../hooks/useTranslation";
import { UIText } from "../../ui/Typography";
import { ExportFormat } from "../types";

interface FormatSectionProps {
  exportFormat: ExportFormat;
  handleFormatChange: (format: ExportFormat) => void;
}

export const FormatSection: React.FC<FormatSectionProps> = ({
  exportFormat,
  handleFormatChange,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();

  return (
    <View style={tw`mb-2`}>
      <UIText
        size="sm"
        weight="medium"
        style={[ui, tw`mb-3`, { color: currentTheme.colors.textSecondary }]}
      >
        {t("exportOptions.format.title", "Format")}
      </UIText>
      <View style={tw`flex-row gap-2`}>
        <TouchableOpacity
          onPress={() => handleFormatChange("mp4")}
          style={[
            tw`px-4 py-3 rounded-lg flex-1`,
            {
              backgroundColor:
                exportFormat === "mp4"
                  ? currentTheme.colors.primary
                  : currentTheme.colors.surface,
              borderWidth: 1,
              borderColor:
                exportFormat === "mp4"
                  ? currentTheme.colors.primary
                  : currentTheme.colors.border,
            },
          ]}
        >
          <UIText
            weight="medium"
            style={[
              ui,
              tw`text-center`,
              {
                color:
                  exportFormat === "mp4" ? "#fff" : currentTheme.colors.text,
              },
            ]}
          >
            {t("exportOptions.format.mp4", "MP4")}
          </UIText>
          <UIText
            size="xs"
            style={[
              ui,
              tw`text-center mt-1`,
              {
                color:
                  exportFormat === "mp4"
                    ? "#fff"
                    : currentTheme.colors.textSecondary,
              },
            ]}
          >
            {t("exportOptions.format.mp4Description", "Universel")}
          </UIText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleFormatChange("mov")}
          style={[
            tw`px-4 py-3 rounded-lg flex-1`,
            {
              backgroundColor:
                exportFormat === "mov"
                  ? currentTheme.colors.primary
                  : currentTheme.colors.surface,
              borderWidth: 1,
              borderColor:
                exportFormat === "mov"
                  ? currentTheme.colors.primary
                  : currentTheme.colors.border,
            },
          ]}
        >
          <UIText
            weight="medium"
            style={[
              ui,
              tw`text-center`,
              {
                color:
                  exportFormat === "mov" ? "#fff" : currentTheme.colors.text,
              },
            ]}
          >
            {t("exportOptions.format.mov", "MOV")}
          </UIText>
          <UIText
            size="xs"
            style={[
              ui,
              tw`text-center mt-1`,
              {
                color:
                  exportFormat === "mov"
                    ? "#fff"
                    : currentTheme.colors.textSecondary,
              },
            ]}
          >
            {t("exportOptions.format.movDescription", "Haute qualité")}
          </UIText>
        </TouchableOpacity>
      </View>
    </View>
  );
};
