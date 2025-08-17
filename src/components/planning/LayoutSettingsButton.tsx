import Ionicons from "react-native-vector-icons/Ionicons";
import React, { useState } from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { FAB_SIZES } from "../../constants/floatingStyles";
import { UIText } from "../ui/Typography";
import { LayoutSettings } from "./settings/LayoutSettings";

interface LayoutSettingsButtonProps {
  activeTab?: string;
}

export const LayoutSettingsButton: React.FC<LayoutSettingsButtonProps> = ({
  activeTab,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleOpenSettings = () => {
    setIsModalVisible(true);
  };

  const handleCloseSettings = () => {
    setIsModalVisible(false);
  };

  // Ne pas afficher le bouton si l'onglet actif n'est pas "tasks"
  if (activeTab !== "tasks") {
    return null;
  }

  return (
    <>
      {/* Bouton FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: currentTheme.colors.primary,
            shadowColor: currentTheme.colors.primary,
          },
        ]}
        onPress={handleOpenSettings}
        activeOpacity={0.8}
      >
        <Ionicons
          name="options-outline"
          size={FAB_SIZES.SMALL.iconSize}
          color="white"
        />
      </TouchableOpacity>

      {/* Modal des paramètres */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseSettings}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: currentTheme.colors.background },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: currentTheme.colors.border },
            ]}
          >
            <UIText
              size="lg"
              weight="semibold"
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.modalTitle, { color: currentTheme.colors.text }]}
            >
              {t("planning.settings.layout.title", "🎛️ Paramètres de Layout")}
            </UIText>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseSettings}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={24}
                color={currentTheme.colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Contenu */}
          <LayoutSettings />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: FAB_SIZES.SMALL.width,
    height: FAB_SIZES.SMALL.height,
    borderRadius: FAB_SIZES.SMALL.borderRadius,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  modalTitle: {
    flex: 1,
    marginRight: 8,
  },
  closeButton: {
    padding: 8,
  },
});
