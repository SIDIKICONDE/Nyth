import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  FlatList,
  Platform,
  TouchableOpacity,
  Modal,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import {
  UIText,
} from "../components/ui/Typography";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { RootStackParamList } from "../types";
import { useTheme } from "../contexts/ThemeContext";
import { useOrientation } from "../hooks/useOrientation";
import { useThemeManagement } from "../hooks/useThemeManagement";
import { useTranslation } from "../hooks/useTranslation";
import { useTranslatedThemes } from "../hooks/useTranslatedThemes";
import { CustomHeader, CustomButton } from "../components/common";
import { ThemeCard, ThemeCreationModal } from "../components/theme";
import AndroidThemePreview from "../components/theme/AndroidThemePreview";
import { CustomAlert } from "../components/ui/CustomAlert";
import { ThemeGenerationService } from "../services/ai/theme/ThemeGenerationService";

import { createOptimizedLogger } from '../utils/optimizedLogger';
const logger = createOptimizedLogger('ThemeScreen');

type ThemeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Theme"
>;

export default function ThemeScreen() {
  const navigation = useNavigation<ThemeScreenNavigationProp>();
  const { t } = useTranslation();
  const {
    currentTheme,
    setTheme,
    customThemes,
    addCustomTheme,
    deleteCustomTheme,
  } = useTheme();
  const orientation = useOrientation();
  const translatedPresetThemes = useTranslatedThemes();
  const [showAndroidPreview, setShowAndroidPreview] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiDescription, setAIDescription] = useState<string>("");
  const [aiLoading, setAILoading] = useState(false);

  // Hook personnalisé pour la gestion des thèmes
  const {
    // États
    isCreateModalVisible,
    newThemeName,
    customColors,
    showErrorAlert,
    showSuccessAlert,
    showDeleteAlert,

    // Actions
    setIsCreateModalVisible,
    setNewThemeName,
    setShowErrorAlert,
    setShowSuccessAlert,
    handleThemeSelect,
    handleCreateTheme,
    closeCreateModal,
    handleDeleteTheme,
    confirmDeleteTheme,
    cancelDeleteTheme,
    updateCustomColors,
    toggleDarkMode,
  } = useThemeManagement({
    currentTheme,
    customThemes,
    setTheme,
    addCustomTheme,
    deleteCustomTheme,
  });

  // Combiner les thèmes traduits avec les thèmes personnalisés
  const allThemes = useMemo(() => [...translatedPresetThemes, ...customThemes], [translatedPresetThemes, customThemes]);

  // Debug: logger les thèmes disponibles
  useEffect(() => {
    logger.debug(`🖼️ ThemeScreen: ${allThemes.length} thèmes disponibles`);
    allThemes.forEach((theme, index) => {
      logger.debug(`  ${index + 1}. ${theme.name} (${theme.id})`);
    });
  }, [allThemes]);

  // Calculer le nombre de colonnes selon l'orientation
  const getNumColumns = () => {
    if (orientation.isTablet) {
      return orientation.isLandscape ? 4 : 3;
    }
    return orientation.isLandscape ? 3 : 2;
  };

  const numColumns = getNumColumns();

  // Rendu d'une carte de thème
  const renderThemeCard = ({
    item: theme,
    index,
  }: {
    item: any;
    index: number;
  }) => (
    <ThemeCard
      theme={theme}
      isSelected={currentTheme.id === theme.id}
      numColumns={numColumns}
      index={index}
      onSelect={handleThemeSelect}
      onDelete={handleDeleteTheme}
    />
  );

  return (
    <View
      style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}
    >
      {/* Header custom */}
      <CustomHeader
        title={t("theme.screen.title")}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          Platform.OS === "android" ? (
            <TouchableOpacity
              onPress={() => setShowAndroidPreview(true)}
              style={[
                tw`p-2 rounded-lg`,
                { backgroundColor: currentTheme.colors.surface },
              ]}
            >
              <MaterialCommunityIcons
                name="android"
                size={20}
                color={currentTheme.colors.primary}
              />
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Liste des thèmes */}
      <FlatList
        data={allThemes}
        keyExtractor={(item) => item.id}
        renderItem={renderThemeCard}
        numColumns={numColumns}
        key={numColumns}
        contentContainerStyle={tw`pt-2 pb-24 px-3`}
        columnWrapperStyle={numColumns > 1 ? tw`justify-start` : undefined}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={tw`mb-2`}>
            <UIText
              size={12}
              align="center"
              color={currentTheme.colors.textSecondary}
            >
              {t("theme.screen.subtitle")}
            </UIText>
          </View>
        }
      />

      {/* Bouton flottant pour créer un thème */}
      <View
        style={[
          tw`absolute bottom-6 right-0 left-0 flex-row items-center justify-center`,
          {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 8,
          },
        ]}
      >
        <CustomButton
          title={t("theme.screen.createNewTheme")}
          variant="outline"
          color={currentTheme.colors.accent}
          icon="palette-outline"
          iconPosition="left"
          onPress={() => setIsCreateModalVisible(true)}
          rounded={true}
          size="xs"
          style={tw`px-3 py-1.5`}
        />
        <View style={tw`ml-2`}>
          <CustomButton
            title={t("theme.screen.createWithAI", "Créer avec IA")}
            variant="outline"
            icon="robot-excited-outline"
            iconPosition="left"
            onPress={() => setShowAIModal(true)}
            rounded={true}
            size="xs"
            style={tw`px-3 py-1.5`}
          />
        </View>
      </View>

      {/* Modal de création de thème */}
      <ThemeCreationModal
        visible={isCreateModalVisible}
        currentTheme={currentTheme}
        newThemeName={newThemeName}
        customColors={customColors}
        onClose={closeCreateModal}
        onCreateTheme={handleCreateTheme}
        onThemeNameChange={setNewThemeName}
        onColorChange={updateCustomColors}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Alertes */}
      <CustomAlert
        visible={showSuccessAlert}
        title={t("theme.alerts.themeCreated.title")}
        message={t("theme.alerts.themeCreated.message")}
        buttons={[
          {
            text: t("theme.alerts.themeCreated.button"),
            onPress: () => setShowSuccessAlert(false),
            style: "default",
          },
        ]}
        onDismiss={() => setShowSuccessAlert(false)}
      />

      <CustomAlert
        visible={showDeleteAlert}
        title={t("theme.alerts.deleteTheme.title")}
        message={t("theme.alerts.deleteTheme.message")}
        buttons={[
          {
            text: t("theme.alerts.deleteTheme.cancel"),
            onPress: cancelDeleteTheme,
            style: "cancel",
          },
          {
            text: t("theme.alerts.deleteTheme.delete"),
            onPress: confirmDeleteTheme,
            style: "destructive",
          },
        ]}
        onDismiss={cancelDeleteTheme}
      />

      <CustomAlert
        visible={showErrorAlert}
        title={t("theme.alerts.error.title")}
        message={t("theme.alerts.error.message")}
        buttons={[
          {
            text: t("theme.alerts.error.button"),
            onPress: () => setShowErrorAlert(false),
            style: "default",
          },
        ]}
        onDismiss={() => setShowErrorAlert(false)}
      />

      {/* Modal Android Preview */}
      {Platform.OS === "android" && (
        <AndroidThemePreview
          visible={showAndroidPreview}
          onClose={() => setShowAndroidPreview(false)}
        />
      )}

      <Modal
        visible={showAIModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !aiLoading && setShowAIModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            style={[
              tw`flex-1 justify-start items-center pt-30`,
              { backgroundColor: "rgba(0,0,0,0.5)" },
            ]}
          >
            <View
              style={[
                tw`m-4 p-6 rounded-xl w-80`,
                { backgroundColor: currentTheme.colors.surface },
              ]}
            >
              <UIText
                size="lg"
                weight="bold"
                style={[tw`mb-4`, { color: currentTheme.colors.text }]}
              >
                {t("theme.ai.createTitle", "Créer un thème avec l'IA")}
              </UIText>

              <UIText
                size="sm"
                style={[tw`mb-2`, { color: currentTheme.colors.textSecondary }]}
              >
                {t(
                  "theme.ai.descriptionLabel",
                  "Décrivez le style (ex: néon sombre, pastel doux, pro bleu)."
                )}
              </UIText>

              <TextInput
                style={[
                  tw`border rounded-lg p-3 mb-4 text-sm`,
                  {
                    borderColor: currentTheme.colors.border,
                    backgroundColor: currentTheme.colors.background,
                    color: currentTheme.colors.text,
                    minHeight: 80,
                  },
                ]}
                placeholder={t(
                  "theme.ai.placeholder",
                  "Ex: Sombre futuriste néon violet/bleu, textes lisibles"
                )}
                placeholderTextColor={currentTheme.colors.textSecondary}
                value={aiDescription}
                onChangeText={setAIDescription}
                multiline
                textAlignVertical="top"
                editable={!aiLoading}
              />

              <View style={tw`flex-row gap-3`}>
                <View style={tw`flex-1`}>
                  <CustomButton
                    title={t("theme.creation.cancel", "Annuler")}
                    variant="outline"
                    icon="close"
                    onPress={() => {
                      if (aiLoading) return;
                      Keyboard.dismiss();
                      setShowAIModal(false);
                    }}
                    rounded={true}
                    size="md"
                    disabled={aiLoading}
                  />
                </View>
                <View style={tw`flex-1`}>
                  <CustomButton
                    title={
                      aiLoading
                        ? t("common.loading", "Chargement…")
                        : t("common.generate", "Générer")
                    }
                    variant="primary"
                    icon={aiLoading ? "progress-clock" : "robot-love-outline"}
                    onPress={async () => {
                      Keyboard.dismiss();
                      if (aiLoading) return;
                      if (aiDescription.trim().length === 0) {
                        setShowErrorAlert(true);
                        return;
                      }
                      setAILoading(true);
                      try {
                        const theme =
                          await ThemeGenerationService.generateThemeFromDescription(
                            aiDescription,
                            undefined,
                            undefined
                          );
                        await addCustomTheme(theme);
                        await setTheme(theme);
                        setShowAIModal(false);
                        setAIDescription("");
                        setShowSuccessAlert(true);
                      } catch (e) {
                        setShowErrorAlert(true);
                      } finally {
                        setAILoading(false);
                      }
                    }}
                    rounded={true}
                    size="md"
                    loading={aiLoading}
                  />
                </View>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
