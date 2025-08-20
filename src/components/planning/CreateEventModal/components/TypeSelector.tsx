import { UIText } from "@/components/ui/Typography";
import { useTheme } from "@/contexts/ThemeContext";
import { useCentralizedFont } from "@/hooks/useCentralizedFont";
import { useTranslation } from "@/hooks/useTranslation";
import { PlanningEvent } from "@/types/planning";
import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import {
  Alert,
  Animated,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { EVENT_TYPES } from "../constants";

interface TypeSelectorProps {
  selectedType: PlanningEvent["type"];
  onTypeChange: (type: PlanningEvent["type"]) => void;
}

interface CustomType {
  value: string;
  icon: string;
  label: string;
}

const AVAILABLE_ICONS = [
  "briefcase",
  "people",
  "person",
  "alarm",
  "star",
  "heart",
  "home",
  "car",
  "airplane",
  "book",
  "camera",
  "game-controller",
  "musical-notes",
  "fitness",
  "restaurant",
  "medical",
  "school",
  "build",
  "code",
];

export const TypeSelector: React.FC<TypeSelectorProps> = ({
  selectedType,
  onTypeChange,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();
  const [customTypes, setCustomTypes] = React.useState<CustomType[]>([]);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newTypeName, setNewTypeName] = React.useState("");
  const [selectedIcon, setSelectedIcon] = React.useState("star");

  const animatedValues = React.useRef(
    [...EVENT_TYPES, ...customTypes].reduce((acc, type) => {
      acc[type.value] = new Animated.Value(type.value === selectedType ? 1 : 0);
      return acc;
    }, {} as Record<string, Animated.Value>)
  ).current;

  const allTypes = [...EVENT_TYPES, ...customTypes];

  React.useEffect(() => {
    allTypes.forEach((type) => {
      if (!animatedValues[type.value]) {
        animatedValues[type.value] = new Animated.Value(
          type.value === selectedType ? 1 : 0
        );
      }
      Animated.spring(animatedValues[type.value], {
        toValue: type.value === selectedType ? 1 : 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    });
  }, [selectedType, customTypes]);

  const handleTypeSelect = (type: PlanningEvent["type"]) => {
    onTypeChange(type);
  };

  const handleCreateCustomType = () => {
    if (!newTypeName.trim()) {
      Alert.alert(
        t("planning.events.customTypes.error", "Erreur"),
        t(
          "planning.events.customTypes.nameRequired",
          "Veuillez saisir un nom pour le type"
        )
      );
      return;
    }

    const customType: CustomType = {
      value: `custom_${Date.now()}`,
      icon: selectedIcon,
      label: newTypeName.trim(),
    };

    setCustomTypes((prev) => [...prev, customType]);
    setNewTypeName("");
    setSelectedIcon("star");
    setShowCreateModal(false);

    // Sélectionner automatiquement le nouveau type
    onTypeChange(customType.value as PlanningEvent["type"]);
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
          <UIText
            size="lg"
            weight="bold"
            color={currentTheme.colors.text}
            align="center"
          >
            {t(
              "planning.events.customTypes.createCustomType",
              "Créer un type personnalisé"
            )}
          </UIText>

          {/* Nom du type */}
          <View style={styles.inputSection}>
            <UIText
              size="sm"
              weight="semibold"
              color={currentTheme.colors.text}
            >
              {t("planning.events.customTypes.typeName", "Nom du type")}
            </UIText>
            <TextInput
              style={[
                styles.textInput,
                ui,
                {
                  backgroundColor: currentTheme.colors.background,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                },
              ]}
              value={newTypeName}
              onChangeText={setNewTypeName}
              placeholder={t(
                "planning.events.customTypes.typeNamePlaceholder",
                "Ex: Sport, Cuisine, Projet..."
              )}
              placeholderTextColor={currentTheme.colors.textSecondary}
              maxLength={20}
            />
          </View>

          {/* Sélection d'icône */}
          <View style={styles.inputSection}>
            <UIText
              size="sm"
              weight="semibold"
              color={currentTheme.colors.text}
            >
              {t("planning.events.customTypes.chooseIcon", "Choisir une icône")}
            </UIText>
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
              <UIText
                size="sm"
                weight="semibold"
                color={currentTheme.colors.textSecondary}
              >
                {t("planning.events.customTypes.cancel", "Annuler")}
              </UIText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.createButton,
                { backgroundColor: currentTheme.colors.primary },
              ]}
              onPress={handleCreateCustomType}
            >
              <UIText size="sm" weight="semibold" color="#fff">
                {t("planning.events.customTypes.create", "Créer")}
              </UIText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconHeader,
            { backgroundColor: currentTheme.colors.primary + "15" },
          ]}
        >
          <Ionicons
            name="shapes"
            size={18}
            color={currentTheme.colors.primary}
          />
        </View>
        <UIText size="base" weight="semibold" color={currentTheme.colors.text}>
          {t("planning.events.customTypes.eventType", "Type d'événement")}
        </UIText>
      </View>

      <View style={styles.optionsGrid}>
        {allTypes.map((eventType, index) => {
          const isSelected = selectedType === eventType.value;
          const animatedValue =
            animatedValues[eventType.value] || new Animated.Value(0);

          return (
            <TouchableOpacity
              key={eventType.value}
              style={styles.optionWrapper}
              onPress={() =>
                handleTypeSelect(eventType.value as PlanningEvent["type"])
              }
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
                      transform: [
                        {
                          rotate: animatedValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0deg", "360deg"],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Animated.View
                    style={{
                      transform: [
                        {
                          scale: animatedValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.2],
                          }),
                        },
                      ],
                    }}
                  >
                    <Ionicons
                      name={eventType.icon as any}
                      size={18}
                      color={
                        isSelected
                          ? currentTheme.colors.primary
                          : currentTheme.colors.textSecondary
                      }
                    />
                  </Animated.View>
                </Animated.View>

                <View style={styles.textContainer}>
                  <UIText
                    size="xs"
                    weight={isSelected ? "bold" : "semibold"}
                    color={
                      isSelected
                        ? currentTheme.colors.primary
                        : currentTheme.colors.text
                    }
                    align="center"
                  >
                    {eventType.label.startsWith("planning.")
                      ? t(eventType.label, eventType.value)
                      : eventType.label}
                  </UIText>
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
                        size={14}
                        color={currentTheme.colors.primary}
                      />
                    </Animated.View>
                  )}
                </View>
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
                size={18}
                color={currentTheme.colors.primary}
              />
            </View>
            <UIText
              size="xs"
              weight="semibold"
              color={currentTheme.colors.primary}
            >
              {t("planning.events.customTypes.addType", "Ajouter")}
            </UIText>
          </View>
        </TouchableOpacity>
      </View>

      {renderCreateModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
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
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  optionWrapper: {
    width: "31%",
  },
  optionButton: {
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    overflow: "hidden",
    position: "relative",
    minHeight: 60,
  },
  addButton: {
    borderWidth: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  textContainer: {
    alignItems: "center",
    gap: 2,
  },
  selectedIndicator: {
    position: "absolute",
    top: -4,
    right: -4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  createModalContainer: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  inputSection: {
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    // fontSize supprimé - géré par useCentralizedFont
  },
  iconsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  iconOption: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  createButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
});
