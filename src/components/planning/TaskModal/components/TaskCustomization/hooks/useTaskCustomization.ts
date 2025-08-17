import { useMemo, useState } from "react";
import { useTranslation } from "../../../../../../hooks/useTranslation";
import { TaskCustomization as TaskCustomizationType } from "../../../../../../types/planning";
import {
  DEFAULT_VALUES,
  getFeatureDefinitions,
  getNavigationSections,
} from "../constants";
import { FeatureToggle, TaskCustomizationProps } from "../types";

export const useTaskCustomization = (props: TaskCustomizationProps) => {
  const { t } = useTranslation();

  const {
    cardColor = DEFAULT_VALUES.CARD_COLOR,
    cardIcon = DEFAULT_VALUES.CARD_ICON,
    cardStyle = DEFAULT_VALUES.CARD_STYLE,
    showEstimatedTime = DEFAULT_VALUES.SHOW_ESTIMATED_TIME,
    showProgress = DEFAULT_VALUES.SHOW_PROGRESS,
    showAttachments = DEFAULT_VALUES.SHOW_ATTACHMENTS,
    showSubtasks = DEFAULT_VALUES.SHOW_SUBTASKS,
    onColorChange,
    onIconChange,
    onStyleChange,
    onFeatureToggle,
  } = props;

  const [activeSection, setActiveSection] = useState<string>(
    DEFAULT_VALUES.ACTIVE_SECTION
  );

  // Créer l'objet de personnalisation actuel
  const currentCustomization: TaskCustomizationType = useMemo(
    () => ({
      cardColor,
      cardIcon,
      cardStyle,
      showEstimatedTime,
      showProgress,
      showAttachments,
      showSubtasks,
    }),
    [
      cardColor,
      cardIcon,
      cardStyle,
      showEstimatedTime,
      showProgress,
      showAttachments,
      showSubtasks,
    ]
  );

  // Créer la liste des fonctionnalités avec leurs états actuels
  const features: FeatureToggle[] = useMemo(
    () =>
      getFeatureDefinitions(t).map((feature) => ({
        ...feature,
        enabled: getFeatureState(feature.key),
      })),
    [t, showEstimatedTime, showProgress, showAttachments, showSubtasks]
  );

  function getFeatureState(featureKey: string): boolean {
    switch (featureKey) {
      case "showEstimatedTime":
        return showEstimatedTime;
      case "showProgress":
        return showProgress;
      case "showAttachments":
        return showAttachments;
      case "showSubtasks":
        return showSubtasks;
      default:
        return false;
    }
  }

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  const handleColorChange = (color: string) => {
    onColorChange(color);
  };

  const handleIconChange = (icon: string) => {
    onIconChange(icon);
  };

  const handleStyleChange = (style: string) => {
    onStyleChange(style);
  };

  const handleFeatureToggle = (feature: string, enabled: boolean) => {
    onFeatureToggle(feature, enabled);
  };

  return {
    // État
    activeSection,
    currentCustomization,
    features,
    sections: getNavigationSections(t),

    // Actions
    handleSectionChange,
    handleColorChange,
    handleIconChange,
    handleStyleChange,
    handleFeatureToggle,

    // Valeurs actuelles
    cardColor,
    cardIcon,
    cardStyle,
  };
};
