import React from "react";
import { TaskCustomization } from "../components";
import { FORM_FIELDS } from "../task-modal-constants";
import { CustomizationTabProps } from "../task-modal-types";

export const CustomizationTab: React.FC<CustomizationTabProps> = ({
  formState,
  updateField,
}) => {
  return (
    <TaskCustomization
      cardColor={formState.customization?.cardColor}
      cardIcon={formState.customization?.cardIcon}
      cardStyle={formState.customization?.cardStyle}
      showEstimatedTime={formState.customization?.showEstimatedTime}
      showProgress={formState.customization?.showProgress}
      showAttachments={formState.customization?.showAttachments}
      showSubtasks={formState.customization?.showSubtasks}
      onColorChange={(color) =>
        updateField(FORM_FIELDS.CUSTOMIZATION, {
          ...formState.customization,
          cardColor: color,
        })
      }
      onIconChange={(icon) =>
        updateField(FORM_FIELDS.CUSTOMIZATION, {
          ...formState.customization,
          cardIcon: icon,
        })
      }
      onStyleChange={(style) =>
        updateField(FORM_FIELDS.CUSTOMIZATION, {
          ...formState.customization,
          cardStyle: style as any,
        })
      }
      onFeatureToggle={(feature, enabled) =>
        updateField(FORM_FIELDS.CUSTOMIZATION, {
          ...formState.customization,
          [feature]: enabled,
        })
      }
    />
  );
};
