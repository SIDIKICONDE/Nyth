import React from "react";
import { ScrollView, View } from "react-native";
import { useTranslation } from "../../../../../hooks/useTranslation";
import {
  ColorPicker,
  FeatureToggles,
  IconPicker,
  PreviewSection,
  SectionNavigation,
  StylePicker,
} from "./components";
import { CARD_ICONS, getCardColors, getCardStyles } from "./constants";
import { useTaskCustomization } from "./hooks";
import { styles } from "./styles";
import { TaskCustomizationProps } from "./types";

export const TaskCustomizationComponent: React.FC<TaskCustomizationProps> = (
  props
) => {
  const { t } = useTranslation();

  const {
    activeSection,
    currentCustomization,
    features,
    sections,
    handleSectionChange,
    handleColorChange,
    handleIconChange,
    handleStyleChange,
    handleFeatureToggle,
    cardColor,
    cardIcon,
    cardStyle,
  } = useTaskCustomization(props);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "preview":
        return <PreviewSection customization={currentCustomization} />;

      case "colors":
        return (
          <ColorPicker
            selectedColor={cardColor}
            onColorSelect={handleColorChange}
            colors={getCardColors(t)}
          />
        );

      case "icons":
        return (
          <IconPicker
            selectedIcon={cardIcon}
            onIconSelect={handleIconChange}
            icons={CARD_ICONS}
          />
        );

      case "styles":
        return (
          <StylePicker
            selectedStyle={cardStyle}
            onStyleSelect={handleStyleChange}
            styles={getCardStyles(t)}
          />
        );

      case "features":
        return (
          <FeatureToggles features={features} onToggle={handleFeatureToggle} />
        );

      default:
        return <PreviewSection customization={currentCustomization} />;
    }
  };

  return (
    <View style={styles.container}>
      <SectionNavigation
        sections={sections}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSectionContent()}
      </ScrollView>
    </View>
  );
};
