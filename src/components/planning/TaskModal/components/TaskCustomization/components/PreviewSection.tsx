import React from "react";
import { TaskCustomization as TaskCustomizationType } from "../../../../../../types/planning";
import { TaskPreview } from "../../TaskPreview";

interface PreviewSectionProps {
  customization: TaskCustomizationType;
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({
  customization,
}) => {
  return <TaskPreview customization={customization} />;
};
