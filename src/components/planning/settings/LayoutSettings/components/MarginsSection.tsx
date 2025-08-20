import React from "react";
import { View } from "react-native";
import { useCentralizedFont } from "../../../../../hooks/useCentralizedFont";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { HeadingText, UIText } from "../../../../ui/Typography";
import { styles } from "../styles";
import { SectionProps } from "../types";
import { MARGIN_VALUES } from "../utils";
import { SettingControl } from "./SettingControl";

interface MarginsSectionProps extends SectionProps {
  preferences: any;
  updateCardMargins: (margins: Partial<any>) => void;
}

export const MarginsSection: React.FC<MarginsSectionProps> = ({
  themeColors,
  preferences,
  updateCardMargins,
}) => {
  const { t } = useTranslation();
  const { ui, heading } = useCentralizedFont();

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
        📏 {t("planning.settings.layout.marginsTitle", "Marges et espacement")}
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
          "planning.settings.layout.marginsDescription",
          "Ajustez les marges pour éviter que les cartes soient collées aux bords"
        )}
      </UIText>

      <SettingControl
        label={t(
          "planning.settings.layout.horizontalMargin",
          "Marge horizontale"
        )}
        currentValue={preferences.cardMargins.horizontal}
        values={MARGIN_VALUES.horizontal}
        unit="px"
        onValueChange={(value) => updateCardMargins({ horizontal: value })}
        themeColors={themeColors}
      />

      <SettingControl
        label={t("planning.settings.layout.verticalMargin", "Marge verticale")}
        currentValue={preferences.cardMargins.vertical}
        values={MARGIN_VALUES.vertical}
        unit="px"
        onValueChange={(value) => updateCardMargins({ vertical: value })}
        themeColors={themeColors}
      />

      <SettingControl
        label={t(
          "planning.settings.layout.betweenMargin",
          "Espacement entre cartes"
        )}
        currentValue={preferences.cardMargins.between}
        values={MARGIN_VALUES.between}
        unit="px"
        onValueChange={(value) => updateCardMargins({ between: value })}
        themeColors={themeColors}
      />
    </View>
  );
};
