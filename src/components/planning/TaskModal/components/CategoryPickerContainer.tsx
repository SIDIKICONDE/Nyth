import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
  Platform,
} from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { UIText } from "../../../ui/Typography";
import { useCategoryData } from "./CategoryPicker/hooks/useCategoryData";

import { createOptimizedLogger } from "../../../../utils/optimizedLogger";
const logger = createOptimizedLogger("CategoryPickerContainer");

interface CategoryPickerContainerProps {
  value?: string;
  onCategoryChange: (categoryId: string) => void;
  error?: string;
}

const MAIN_CATEGORIES = [
  {
    id: "development",
    name: "Dev",
    color: "#3B82F6",
  },
  {
    id: "design",
    name: "Design",
    color: "#8B5CF6",
  },
  {
    id: "content",
    name: "Contenu",
    color: "#10B981",
  },
  {
    id: "marketing",
    name: "Marketing",
    color: "#F59E0B",
  },
  {
    id: "research",
    name: "Recherche",
    color: "#06B6D4",
  },
  {
    id: "meeting",
    name: "Réunion",
    color: "#84CC16",
  },
] as const;

const QUICK_ICONS = ["📁", "💼", "🎯", "⚡", "🔥", "💡", "🎨", "🔧"];

const CARD_WIDTH = 70;
const CARD_SPACING = 8;

export const CategoryPickerContainer: React.FC<
  CategoryPickerContainerProps
> = ({ value, onCategoryChange, error }) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("📁");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Utiliser le hook pour accéder aux catégories personnalisées
  const { customCategories, handleAddCustomCategory } = useCategoryData();

  const handleCategorySelect = (categoryId: string) => {
    onCategoryChange(categoryId);
  };

  const handleOpenAddModal = () => {
    setShowAddModal(true);
    setNewCategoryName("");
    setSelectedIcon("📁");
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setNewCategoryName("");
    setSelectedIcon("📁");
    setIsSubmitting(false);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newCategoryId = await handleAddCustomCategory(
        newCategoryName.trim(),
        selectedIcon,
        ""
      );
      onCategoryChange(newCategoryId);
      handleCloseAddModal();
    } catch (error) {
      logger.error("Error creating category:", error);
      setIsSubmitting(false);
    }
  };

  const renderCategoryCard = (
    categoryConfig: (typeof MAIN_CATEGORIES)[number],
    index: number
  ) => {
    const isSelected = categoryConfig.id === value;

    return (
      <TouchableOpacity
        key={categoryConfig.id}
        style={[
          styles.categoryCard,
          {
            backgroundColor: isSelected
              ? categoryConfig.color + "15"
              : currentTheme.colors.surface,
            borderColor: isSelected
              ? categoryConfig.color
              : currentTheme.colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => handleCategorySelect(categoryConfig.id)}
        activeOpacity={0.7}
      >
        <UIText
          size="sm"
          weight={isSelected ? "bold" : "medium"}
          color={
            isSelected
              ? categoryConfig.color
              : currentTheme.colors.textSecondary
          }
          style={styles.categoryLabel}
        >
          {categoryConfig.name}
        </UIText>
      </TouchableOpacity>
    );
  };

  const renderCustomCategoryCard = (customCategory: any, index: number) => {
    const isSelected = customCategory.id === value;
    const categoryColor = "#8B5CF6";

    return (
      <TouchableOpacity
        key={customCategory.id}
        style={[
          styles.categoryCard,
          {
            backgroundColor: isSelected
              ? categoryColor + "15"
              : currentTheme.colors.surface,
            borderColor: isSelected
              ? categoryColor
              : currentTheme.colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => handleCategorySelect(customCategory.id)}
        activeOpacity={0.7}
      >
        <UIText
          size="xs"
          weight={isSelected ? "bold" : "medium"}
          color={isSelected ? categoryColor : currentTheme.colors.textSecondary}
          style={styles.categoryLabel}
        >
          {customCategory.name}
        </UIText>
      </TouchableOpacity>
    );
  };

  const renderAddCard = () => {
    return (
      <TouchableOpacity
        key="add-category"
        style={[
          styles.categoryCard,
          styles.addCard,
          {
            backgroundColor: currentTheme.colors.primary + "10",
            borderColor: currentTheme.colors.primary,
            borderStyle: Platform.OS === "ios" ? "solid" : "dashed",
          },
        ]}
        onPress={handleOpenAddModal}
        activeOpacity={0.7}
      >
        <UIText
          size="lg"
          weight="bold"
          color={currentTheme.colors.primary}
          style={styles.addIcon}
        >
          +
        </UIText>
      </TouchableOpacity>
    );
  };

  const renderFloatingModal = () => {
    if (!showAddModal) return null;

    return (
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseAddModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseAddModal}
        >
          <View style={styles.floatingModal}>
            <TouchableOpacity activeOpacity={1}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <UIText
                  size="sm"
                  weight="bold"
                  color={currentTheme.colors.text}
                >
                  Nouvelle catégorie
                </UIText>
                <TouchableOpacity
                  onPress={handleCloseAddModal}
                  style={styles.closeButton}
                >
                  <UIText size="lg" color={currentTheme.colors.textSecondary}>
                    ×
                  </UIText>
                </TouchableOpacity>
              </View>

              {/* Input nom */}
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: currentTheme.colors.surface,
                    borderColor: currentTheme.colors.border,
                    color: currentTheme.colors.text,
                  },
                ]}
                placeholder="Nom de la catégorie"
                placeholderTextColor={currentTheme.colors.textSecondary}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                maxLength={20}
                autoFocus
              />

              {/* Sélection d'icône rapide */}
              <View style={styles.iconSection}>
                <UIText
                  size="xs"
                  color={currentTheme.colors.textSecondary}
                  style={styles.iconLabel}
                >
                  Icône
                </UIText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.iconList}>
                    {QUICK_ICONS.map((icon) => (
                      <TouchableOpacity
                        key={icon}
                        style={[
                          styles.iconButton,
                          {
                            backgroundColor:
                              selectedIcon === icon
                                ? currentTheme.colors.primary + "20"
                                : currentTheme.colors.surface,
                            borderColor:
                              selectedIcon === icon
                                ? currentTheme.colors.primary
                                : currentTheme.colors.border,
                          },
                        ]}
                        onPress={() => setSelectedIcon(icon)}
                      >
                        <UIText size="lg">{icon}</UIText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Boutons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.cancelButton,
                    { borderColor: currentTheme.colors.border },
                  ]}
                  onPress={handleCloseAddModal}
                >
                  <UIText size="sm" color={currentTheme.colors.textSecondary}>
                    Annuler
                  </UIText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.createButton,
                    {
                      backgroundColor:
                        newCategoryName.trim() && !isSubmitting
                          ? currentTheme.colors.primary
                          : currentTheme.colors.border,
                    },
                  ]}
                  onPress={handleCreateCategory}
                  disabled={!newCategoryName.trim() || isSubmitting}
                >
                  <UIText
                    size="sm"
                    weight="bold"
                    color={
                      newCategoryName.trim() && !isSubmitting
                        ? "#FFFFFF"
                        : currentTheme.colors.textSecondary
                    }
                  >
                    {isSubmitting ? "..." : "Créer"}
                  </UIText>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <UIText
        size="sm"
        weight="semibold"
        color={currentTheme.colors.text}
        style={styles.header}
      >
        {t("planning.tasks.taskModal.categoryLabel", "Catégorie")}
      </UIText>

      {/* Compact Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* Catégories principales */}
        {MAIN_CATEGORIES.map((categoryConfig, index) =>
          renderCategoryCard(categoryConfig, index)
        )}

        {/* Catégories personnalisées */}
        {customCategories.map((customCategory, index) =>
          renderCustomCategoryCard(customCategory, index)
        )}

        {/* Bouton d'ajout */}
        {renderAddCard()}
      </ScrollView>

      {/* Error message */}
      {error && (
        <UIText size="xs" color="#EF4444" style={styles.errorText}>
          {error}
        </UIText>
      )}

      {/* Modal flottant */}
      {renderFloatingModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    marginBottom: 8,
  },
  scrollView: {
    marginHorizontal: -4,
  },
  scrollContent: {
    paddingHorizontal: 4,
  },
  categoryCard: {
    width: CARD_WIDTH,
    height: 40,
    marginHorizontal: CARD_SPACING / 2,
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  addCard: {
    borderWidth: 1,
    borderStyle: Platform.OS === "ios" ? "solid" : "dashed",
  },
  categoryLabel: {
    textAlign: "center",
    fontSize: 12,
  },
  addIcon: {
    textAlign: "center",
  },
  errorText: {
    marginTop: 4,
    textAlign: "center",
  },
  // Modal flottant
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  floatingModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  iconSection: {
    marginBottom: 20,
  },
  iconLabel: {
    marginBottom: 8,
  },
  iconList: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  createButton: {
    // Styles dynamiques appliqués inline
  },
});
