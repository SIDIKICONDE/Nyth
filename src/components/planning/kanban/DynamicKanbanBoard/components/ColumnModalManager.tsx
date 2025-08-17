import React from "react";
import { ColumnModal } from "../../ColumnModal";
import { ColumnModalManagerProps } from "../types";

export const ColumnModalManager: React.FC<ColumnModalManagerProps> = ({
  visible,
  selectedColumn,
  onClose,
  onSave,
  presetColors,
  suggestedColor,
}) => {
  return (
    <ColumnModal
      visible={visible}
      column={selectedColumn}
      onClose={onClose}
      onSave={onSave}
      presetColors={presetColors}
      suggestedColor={suggestedColor}
    />
  );
};
