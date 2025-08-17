import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ImprovedFloatingButton, ImprovedFloatingMenu } from "./";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';
const logger = createOptimizedLogger('ExampleUsage');

/**
 * Exemple d'utilisation des composants flottants améliorés
 *
 * Ce composant montre comment utiliser les nouveaux composants
 * ImprovedFloatingButton et ImprovedFloatingMenu pour créer
 * des interfaces utilisateur élégantes après la migration d'Expo
 */
export const FloatingComponentsExample: React.FC = () => {
  const [menuVisible, setMenuVisible] = useState(false);

  const handleFABPress = () => {
    setMenuVisible(true);
  };

  const handleCloseMenu = () => {
    setMenuVisible(false);
  };

  const handleMenuAction = (action: string) => {
    logger.debug(`Action sélectionnée: ${action}`);
    setMenuVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Contenu principal de votre écran */}
      <View style={styles.content}>
        <Text style={styles.title}>Interface avec Menus Flottants</Text>
        <Text style={styles.subtitle}>
          Exemple d'utilisation des composants améliorés
        </Text>
      </View>

      {/* Bouton flottant principal */}
      <ImprovedFloatingButton
        onPress={handleFABPress}
        icon="plus"
        variant="gradient"
        gradientColors={["#FF6B6B", "#FF8E8E"]}
        size="large"
        position="bottom-right"
        animated={true}
        pulseAnimation={true}
        accessibilityLabel="Ouvrir le menu d'actions"
      />

      {/* Menu flottant */}
      <ImprovedFloatingMenu
        visible={menuVisible}
        onClose={handleCloseMenu}
        position="bottom-right"
        glassEffect={true}
        backdropBlur={true}
      >
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>Actions disponibles</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuAction("create")}
          >
            <MaterialCommunityIcons
              name="plus-circle"
              size={24}
              color="#007AFF"
            />
            <Text style={styles.menuItemText}>Créer nouveau</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuAction("edit")}
          >
            <MaterialCommunityIcons name="pencil" size={24} color="#FF9500" />
            <Text style={styles.menuItemText}>Modifier</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuAction("share")}
          >
            <MaterialCommunityIcons name="share" size={24} color="#34C759" />
            <Text style={styles.menuItemText}>Partager</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuAction("delete")}
          >
            <MaterialCommunityIcons name="delete" size={24} color="#FF3B30" />
            <Text style={styles.menuItemText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </ImprovedFloatingMenu>

      {/* Exemple de bouton secondaire */}
      <ImprovedFloatingButton
        onPress={() => logger.debug("Bouton secondaire")}
        icon="heart"
        variant="glassmorphism"
        iconColor="#FF6B6B"
        size="medium"
        position="bottom-left"
        animated={true}
        accessibilityLabel="Favoris"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  menuContent: {
    paddingVertical: 8,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
    fontWeight: "500",
  },
});

export default FloatingComponentsExample;
