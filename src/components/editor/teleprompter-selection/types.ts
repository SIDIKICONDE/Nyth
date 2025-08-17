export interface TeleprompterSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTeleprompterWithCamera: () => void;
  onDuplicate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
}

export interface ActionButtonProps {
  onPress: () => void;
  backgroundColor: string;
  borderColor: string;
  iconBackgroundColor: string;
  iconName: string;
  iconLibrary: "MaterialCommunityIcons" | "Ionicons";
  title: string;
  textColor: string;
}
