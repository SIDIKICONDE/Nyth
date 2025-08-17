import React from "react";
import { View } from "react-native";
import { useCentralizedFont } from "../../../../../hooks/useCentralizedFont";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { HeadingText, UIText } from "../../../../ui/Typography";
import { styles } from "../styles";
import { SectionProps } from "../types";
import { COLUMN_VALUES } from "../utils";
import { SettingControl } from "./SettingControl";

interface ColumnsSectionProps extends SectionProps {
  preferences: any;
  updateCardSizing: (sizing: Partial<any>) => void;
  updateColumnSpacing: (spacing: Partial<any>) => void;
}

export const ColumnsSection: React.FC<ColumnsSectionProps> = ({
  themeColors,
  preferences,
  updateCardSizing,
  updateColumnSpacing,
}) => {
  const { t } = useTranslation();
  const { heading, ui } = useCentralizedFont();

  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        },
      ]}
    >
      <HeadingText
        size="lg"
        weight="semibold"
        style={[heading, styles.sectionTitle, { color: themeColors.text }]}
      >
        📋 {t("planning.settings.layout.columnsTitle", "Colonnes et cartes")}
      </HeadingText>

      <UIText
        size="sm"
        weight="medium"
        style={[
          ui,
          styles.sectionDescription,
          { color: themeColors.textSecondary },
        ]}
      >
        {t(
          "planning.settings.layout.columnsDescription",
          "Ajustez la taille et l'espacement des colonnes"
        )}
      </UIText>

      <SettingControl
        label={t(
          "planning.settings.layout.columnWidth",
          "Largeur des colonnes"
        )}
        currentValue={preferences.cardSizing.minWidth}
        values={COLUMN_VALUES.width}
        unit="px"
        onValueChange={(value) => updateCardSizing({ minWidth: value })}
        themeColors={themeColors}
      />

      <SettingControl
        label={t(
          "planning.settings.layout.columnSpacing",
          "Espacement entre colonnes"
        )}
        currentValue={preferences.columnSpacing.horizontal}
        values={COLUMN_VALUES.spacing}
        unit="px"
        onValueChange={(value) => updateColumnSpacing({ horizontal: value })}
        themeColors={themeColors}
      />

      <SettingControl
        label={t("planning.settings.layout.columnPadding", "Padding interne")}
        currentValue={preferences.columnSpacing.padding}
        values={COLUMN_VALUES.padding}
        unit="px"
        onValueChange={(value) => updateColumnSpacing({ padding: value })}
        themeColors={themeColors}
      />

      <SettingControl
        label={t("planning.settings.layout.borderRadius", "Arrondi des cartes")}
        currentValue={preferences.cardSizing.borderRadius}
        values={COLUMN_VALUES.borderRadius}
        unit="px"
        onValueChange={(value) => updateCardSizing({ borderRadius: value })}
        themeColors={themeColors}
      />
    </View>
  );
};
