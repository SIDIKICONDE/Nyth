import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { Goal } from "../../../../types/planning";
import { GoalTypeOption } from "../types";

interface CustomGoalType {
  key: string;
  label: string;
  icon: string;
}

const AVAILABLE_ICONS = [
  "trophy",
  "fitness",
  "book",
  "briefcase",
  "heart",
  "star",
  "home",
  "car",
  "airplane",
  "camera",
  "musical-notes",
  "restaurant",
  "medical",
  "school",
  "build",
  "code",
  "wallet",
  "people",
  "leaf",
];

interface GoalTypeSelectorProps {
  selectedType: Goal["type"];
  onTypeChange: (type: Goal["type"]) => void;
  options: GoalTypeOption[];
}

export const GoalTypeSelector: React.FC<GoalTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  options,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [customTypes, setCustomTypes] = React.useState<CustomGoalType[]>([]);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newTypeName, setNewTypeName] = React.useState("");
  const [selectedIcon, setSelectedIcon] = React.useState("trophy");

  const allTypes = [...options, ...customTypes];

  const animatedValues = React.useRef(
    allTypes.reduce((acc, type) => {
      acc[type.key] = new Animated.Value(type.key === selectedType ? 1 : 0);
      return acc;
    }, {} as Record<string, Animated.Value>)
  ).current;

  React.useEffect(() => {
    allTypes.forEach((type) => {
      if (!animatedValues[type.key]) {
        animatedValues[type.key] = new Animated.Value(
          type.key === selectedType ? 1 : 0
        );
      }
      Animated.spring(animatedValues[type.key], {
        toValue: type.key === selectedType ? 1 : 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    });
  }, [selectedType, customTypes]);

  const handleTypeSelect = (type: Goal["type"]) => {
    onTypeChange(type);
  };

  const handleCreateCustomType = () => {
    if (!newTypeName.trim()) {
      Alert.alert(
        t("planning.goals.customTypes.error", "Erreur"),
        t(
          "planning.goals.customTypes.nameRequired",
          "Veuillez saisir un nom pour le type"
        )
      );
      return;
    }

    const customType: CustomGoalType = {
      key: `custom_${Date.now()}`,
      icon: selectedIcon,
      label: newTypeName.trim(),
    };

    setCustomTypes((prev) => [...prev, customType]);
    setNewTypeName("");
    setSelectedIcon("trophy");
    setShowCreateModal(false);

    // Sélectionner automatiquement le nouveau type
    onTypeChange(customType.key as Goal["type"]);
  };

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.createModalContainer,
            { backgroundColor: currentTheme.colors.surface },
          ]}
        >
          <Text
            style={[styles.modalTitle, { color: currentTheme.colors.text }]}
          >
            {t(
              "planning.goals.customTypes.createCustomType",
              "Créer un type personnalisé"
            )}
          </Text>

          {/* Nom du type */}
          <View style={styles.inputSection}>
            <Text
              style={[styles.inputLabel, { color: currentTheme.colors.text }]}
            >
              {t("planning.goals.customTypes.typeName", "Nom du type")}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: currentTheme.colors.background,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                },
              ]}
              value={newTypeName}
              onChangeText={setNewTypeName}
              placeholder={t(
                "planning.goals.customTypes.typeNamePlaceholder",
                "Ex: Fitness, Lecture, Carrière..."
              )}
              placeholderTextColor={currentTheme.colors.textSecondary}
              maxLength={20}
            />
          </View>

          {/* Sélection d'icône */}
          <View style={styles.inputSection}>
            <Text
              style={[styles.inputLabel, { color: currentTheme.colors.text }]}
            >
              {t("planning.goals.customTypes.chooseIcon", "Choisir une icône")}
            </Text>
            <View style={styles.iconsGrid}>
              {AVAILABLE_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    {
                      backgroundColor:
                        selectedIcon === icon
                          ? currentTheme.colors.primary + "20"
                          : currentTheme.colors.background,
                      borderColor:
                        selectedIcon === icon
                          ? currentTheme.colors.primary
                          : currentTheme.colors.border,
                    },
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Ionicons
                    name={icon as any}
                    size={20}
                    color={
                      selectedIcon === icon
                        ? currentTheme.colors.primary
                        : currentTheme.colors.textSecondary
                    }
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Boutons d'action */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                { backgroundColor: currentTheme.colors.background },
              ]}
              onPress={() => setShowCreateModal(false)}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                {t("planning.goals.customTypes.cancel", "Annuler")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.createButton,
                { backgroundColor: currentTheme.colors.primary },
              ]}
              onPress={handleCreateCustomType}
            >
              <Text style={styles.createButtonText}>
                {t("planning.goals.customTypes.create", "Créer")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View
      style={[
        styles.fieldContainer,
        { backgroundColor: currentTheme.colors.surface },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconHeader,
            { backgroundColor: currentTheme.colors.primary + "15" },
          ]}
        >
          <Ionicons
            name="shapes"
            size={16}
            color={currentTheme.colors.primary}
          />
        </View>
        <Text style={[styles.fieldLabel, { color: currentTheme.colors.text }]}>
          {t("planning.goals.goalType", "Type d'objectif")}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.optionsRow}>
          {allTypes.map((type) => {
            const isSelected = selectedType === type.key;
            const animatedValue =
              animatedValues[type.key] || new Animated.Value(0);

            return (
              <TouchableOpacity
                key={type.key}
                style={styles.optionWrapper}
                onPress={() => handleTypeSelect(type.key as Goal["type"])}
                activeOpacity={0.8}
              >
                <Animated.View
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: currentTheme.colors.surface,
                      borderColor: isSelected
                        ? currentTheme.colors.primary
                        : currentTheme.colors.border,
                      borderWidth: isSelected ? 2 : 1,
                      transform: [
                        {
                          scale: animatedValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.05],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        StyleSheet.absoluteFillObject,
                        {
                          backgroundColor: currentTheme.colors.primary + "10",
                        },
                      ]}
                    />
                  )}

                  <Animated.View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor: animatedValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [
                            currentTheme.colors.background,
                            currentTheme.colors.primary + "20",
                          ],
                        }),
                      },
                    ]}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={16}
                      color={
                        isSelected
                          ? currentTheme.colors.primary
                          : currentTheme.colors.textSecondary
                      }
                    />
                  </Animated.View>

                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: isSelected
                          ? currentTheme.colors.primary
                          : currentTheme.colors.text,
                        fontWeight: isSelected ? "700" : "600",
                      },
                    ]}
                  >
                    {t(`planning.goals.types.${type.key}`, type.label)}
                  </Text>

                  {isSelected && (
                    <Animated.View
                      style={[
                        styles.selectedIndicator,
                        {
                          opacity: animatedValue,
                          transform: [
                            {
                              scale: animatedValue.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 1],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={12}
                        color={currentTheme.colors.primary}
                      />
                    </Animated.View>
                  )}
                </Animated.View>
              </TouchableOpacity>
            );
          })}

          {/* Bouton Ajouter un type */}
          <TouchableOpacity
            style={styles.optionWrapper}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.optionButton,
                styles.addButton,
                {
                  backgroundColor: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  borderStyle: Platform.OS === "ios" ? "solid" : "dashed",
                },
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: currentTheme.colors.primary + "15" },
                ]}
              >
                <Ionicons
                  name="add"
                  size={16}
                  color={currentTheme.colors.primary}
                />
              </View>
              <Text
                style={[
                  styles.optionText,
                  { color: currentTheme.colors.primary, fontWeight: "600" },
                ]}
              >
                {t("planning.goals.customTypes.addType", "Ajouter")}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderCreateModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  iconHeader: {
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  optionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  optionWrapper: {
    minWidth: 80,
  },
  optionButton: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    minHeight: 60,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    overflow: "hidden",
    position: "relative",
  },
  addButton: {
    borderWidth: 2,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    fontSize: 11,
    textAlign: "center",
  },
  selectedIndicator: {
    position: "absolute",
    top: 2,
    right: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  createModalContainer: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  iconsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  iconOption: {
    width: "15%",
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
});
