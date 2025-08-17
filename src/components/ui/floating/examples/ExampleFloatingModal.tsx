import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { UIText } from "../../Typography";
import {
  FloatingActionButton,
  FloatingContainer,
  FloatingModal,
  FloatingOverlay,
} from "../index";

import { createOptimizedLogger } from '../../../../utils/optimizedLogger';
const logger = createOptimizedLogger('ExampleFloatingModal');

/**
 * Exemple d'utilisation des nouveaux composants flottants
 * Démontre les différentes variantes et configurations possibles
 */

export const ExampleFloatingModal: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVariant, setModalVariant] = useState<
    "standard" | "glassmorphism" | "gradient"
  >("glassmorphism");
  const [modalPosition, setModalPosition] = useState<
    "center" | "bottom" | "top"
  >("bottom");

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const renderModalContent = () => (
    <View style={{ padding: 20 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <UIText size="xl" weight="bold" color={currentTheme.colors.text}>
          {t("example_modal_title", "Exemple de Modal")}
        </UIText>
        <FloatingActionButton
          onPress={handleCloseModal}
          icon="close"
          size="SMALL"
          backgroundColor={currentTheme.colors.error}
          style={{ position: "relative", margin: 0 }}
          accessibilityLabel={t("close", "Fermer")}
        />
      </View>

      {/* Content */}
      <ScrollView style={{ maxHeight: 400 }}>
        <UIText
          size="base"
          color={currentTheme.colors.text}
          style={{
            lineHeight: 24,
            marginBottom: 16,
          }}
        >
          {t(
            "example_modal_content",
            `
            Ce modal utilise les nouveaux composants flottants standardisés :
            
            • FloatingModal avec effet glassmorphism
            • FloatingActionButton avec différentes tailles
            • FloatingContainer pour le contenu
            • Animations fluides et cohérentes
            • Support des thèmes clair/sombre
            • Accessibilité intégrée
          `
          )}
        </UIText>

        {/* Exemple de conteneur flottant dans le modal */}
        <FloatingContainer
          variant="gradient"
          theme={currentTheme.isDark ? "dark" : "light"}
          elevation="LOW"
          borderRadius="MEDIUM"
          style={{
            padding: 16,
            marginVertical: 16,
            minHeight: 80,
          }}
        >
          <UIText size="sm" color={currentTheme.colors.text} align="center">
            {t(
              "example_nested_container",
              "Conteneur flottant imbriqué avec effet gradient"
            )}
          </UIText>
        </FloatingContainer>

        {/* Boutons d'action */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            marginTop: 20,
          }}
        >
          <FloatingActionButton
            onPress={() => setModalVariant("standard")}
            icon="format-paint"
            size="MEDIUM"
            variant="outlined"
            backgroundColor={currentTheme.colors.primary}
            style={{ position: "relative", margin: 0 }}
            accessibilityLabel="Standard"
          />
          <FloatingActionButton
            onPress={() => setModalVariant("glassmorphism")}
            icon="blur"
            size="MEDIUM"
            variant="gradient"
            backgroundColor={currentTheme.colors.accent}
            style={{ position: "relative", margin: 0 }}
            accessibilityLabel="Glassmorphism"
          />
          <FloatingActionButton
            onPress={() => setModalVariant("gradient")}
            icon="gradient-horizontal"
            size="MEDIUM"
            backgroundColor={currentTheme.colors.secondary}
            style={{ position: "relative", margin: 0 }}
            accessibilityLabel="Gradient"
          />
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {/* FAB principal pour ouvrir le modal */}
      <FloatingActionButton
        onPress={handleOpenModal}
        icon="eye"
        size="LARGE"
        position="FAB_BOTTOM_RIGHT"
        elevation="HIGH"
        variant="gradient"
        backgroundColor={currentTheme.colors.primary}
        gradientColors={[
          currentTheme.colors.primary,
          currentTheme.colors.accent,
        ]}
        accessibilityLabel={t(
          "open_example_modal",
          "Ouvrir le modal d'exemple"
        )}
      />

      {/* Modal flottant */}
      <FloatingModal
        visible={modalVisible}
        onClose={handleCloseModal}
        variant={modalVariant}
        theme={currentTheme.isDark ? "dark" : "light"}
        position={modalPosition}
        elevation="EXTREME"
        borderRadius="LARGE"
        overlayVariant="BLUR_DARK"
        blurIntensity="MEDIUM"
        keyboardAvoidingEnabled={true}
        onShow={() => logger.debug("Modal ouvert")}
        onDismiss={() => logger.debug("Modal fermé")}
      >
        {renderModalContent()}
      </FloatingModal>

      {/* Overlay d'exemple (optionnel) */}
      <FloatingOverlay
        visible={false} // Désactivé par défaut
        variant="BLUR_LIGHT"
        blurIntensity="LIGHT"
        onPress={() => logger.debug("Overlay pressé")}
      />
    </View>
  );
};

export default ExampleFloatingModal;
