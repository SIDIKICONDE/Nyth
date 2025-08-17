import React from "react";
import { useTheme } from "../../../../contexts/ThemeContext";
import {
  CompactCard,
  CreativeCard,
  DefaultCard,
  DetailedCard,
  KanbanCard,
  MinimalCard,
  ModernCard,
} from "./components";
import { DEFAULT_CUSTOMIZATION } from "./constants";
import { TaskCardProps } from "./types";

import { createOptimizedLogger } from '../../../../utils/optimizedLogger';
const logger = createOptimizedLogger('TaskCardComponent');

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onPress,
  onEdit,
  onDelete,
  onLongPress,
  isDragging = false,
  customStyles,
}) => {
  const { currentTheme } = useTheme();
  const customization = { ...DEFAULT_CUSTOMIZATION, ...task.customization };

  const {
    cardColor = currentTheme.colors.primary,
    cardIcon,
    cardStyle,
  } = customization;

  logger.debug("🎨 TaskCard - Style sélectionné:", cardStyle);
  logger.debug("🎨 TaskCard - Customization complète:", customization);
  logger.debug("🎨 TaskCard - Task ID:", task.id);

  const commonProps = {
    task,
    onPress,
    onEdit,
    onDelete,
    onLongPress,
    isDragging,
    customStyles,
    cardColor,
    cardIcon,
    customization,
    themeColors: currentTheme.colors,
  };

  // Rendu selon le style choisi
  switch (cardStyle) {
    case "minimal":
      return <MinimalCard {...commonProps} />;
    case "detailed":
      return <DetailedCard {...commonProps} />;
    case "creative":
      return <CreativeCard {...commonProps} />;
    case "compact":
      return <CompactCard {...commonProps} />;
    case "modern":
      return <ModernCard {...commonProps} />;
    case "kanban":
      return <KanbanCard {...commonProps} />;
    // Pour les styles non encore implémentés, utiliser le style par défaut
    case "timeline":
    case "priority":
    case "progress":
    case "team":
    case "glass":
      return <DefaultCard {...commonProps} />;
    default:
      return <DefaultCard {...commonProps} />;
  }
};
