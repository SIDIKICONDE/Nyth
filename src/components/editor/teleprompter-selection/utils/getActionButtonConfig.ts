import { ActionButtonProps } from "../types";

interface ButtonConfig {
  key: string;
  config: Omit<ActionButtonProps, "onPress" | "textColor">;
  translationKey: string;
}

export const getActionButtonConfigs = (
  isDark: boolean
): Record<string, ButtonConfig> => {
  const getColors = (baseColor: string, opacity: number = 0.12) => ({
    backgroundColor: isDark
      ? `rgba(${baseColor}, ${opacity})`
      : `rgba(${baseColor}, ${opacity * 0.6})`,
    borderColor: isDark
      ? `rgba(${baseColor}, ${opacity * 2})`
      : `rgba(${baseColor}, ${opacity * 1.5})`,
  });

  return {
    camera: {
      key: "camera",
      config: {
        ...getColors("59, 130, 246", 0.15),
        iconBackgroundColor: "#3B82F6",
        iconName: "videocam",
        iconLibrary: "Ionicons",
        title: "Camera",
      },
      translationKey: "home.script.camera",
    },
    edit: {
      key: "edit",
      config: {
        ...getColors("139, 92, 246", 0.15),
        iconBackgroundColor: "#8B5CF6",
        iconName: "pencil",
        iconLibrary: "MaterialCommunityIcons",
        title: "Edit",
      },
      translationKey: "common.edit",
    },
    favorite: {
      key: "favorite",
      config: {
        ...getColors("251, 191, 36", 0.15),
        iconBackgroundColor: "#F59E0B",
        iconName: "star",
        iconLibrary: "MaterialCommunityIcons",
        title: "Favorite",
      },
      translationKey: "home.script.favorite",
    },
    unfavorite: {
      key: "unfavorite",
      config: {
        ...getColors("251, 191, 36", 0.15),
        iconBackgroundColor: "#F59E0B",
        iconName: "star-outline",
        iconLibrary: "MaterialCommunityIcons",
        title: "Unfavorite",
      },
      translationKey: "home.script.unfavorite",
    },
    duplicate: {
      key: "duplicate",
      config: {
        ...getColors("34, 197, 94", 0.15),
        iconBackgroundColor: "#22C55E",
        iconName: "content-copy",
        iconLibrary: "MaterialCommunityIcons",
        title: "Duplicate",
      },
      translationKey: "home.script.duplicate",
    },
    delete: {
      key: "delete",
      config: {
        ...getColors("239, 68, 68", 0.15),
        iconBackgroundColor: "#EF4444",
        iconName: "trash-can-outline",
        iconLibrary: "MaterialCommunityIcons",
        title: "Delete",
      },
      translationKey: "common.delete",
    },
  };
};
