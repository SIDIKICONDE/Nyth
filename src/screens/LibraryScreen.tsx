import { HomeTabMenu, UnifiedHomeFAB, useHomeData } from "@/components/home";
import { useScripts } from "@/contexts/ScriptsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useDisplayPreferences } from "@/hooks/useDisplayPreferences";
import { useOrientation } from "@/hooks/useOrientation";
import { useTranslation } from "@/hooks/useTranslation";
import { SecureApiKeyManager } from "@/services/ai/SecureApiKeyManager";
import { useCacheTranslation } from "@/utils/cacheManager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Clipboard from "@react-native-clipboard/clipboard";
import LinearGradient from "react-native-linear-gradient";
import React from "react";
import { Alert, Share, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import tw from "twrnc";

import { createOptimizedLogger } from '../utils/optimizedLogger';
const logger = createOptimizedLogger('LibraryScreen');

// Hooks refactorisés
import {
  useCacheManagement,
  useHomeScreenState,
  useNavigationHandlers,
} from "../screens/HomeScreen/hooks";

// Composants refactorisés
import {
  CacheInfo,
  ContentTabs,
  HomeHeader,
} from "../screens/HomeScreen/components";

// Utilitaires
import { getNumColumns } from "../screens/HomeScreen/utils";

export default function LibraryScreen() {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const orientation = useOrientation();
  const { scriptDisplayStyle, isLoaded: displayPrefsLoaded } =
    useDisplayPreferences();
  const { addScript, toggleFavorite } = useScripts();

  // Initialiser les traductions du cache
  useCacheTranslation();

  logger.debug(
    "📚 LibraryScreen - scriptDisplayStyle:",
    scriptDisplayStyle,
    "isLoaded:",
    displayPrefsLoaded
  );

  // Désactiver automatiquement les services sans clés au démarrage
  React.useEffect(() => {
    const cleanupAIConfig = async () => {
      try {
        logger.debug("🧹 Vérification de la configuration AI...");

        // Vérifier chaque service et désactiver s'il n'a pas de clé
        const services = [
          {
            key: "openai",
            enableKey: "use_custom_api",
            name: "OpenAI",
          },
          { key: "gemini", enableKey: "use_gemini", name: "Gemini" },
          { key: "mistral", enableKey: "use_mistral", name: "Mistral" },
          { key: "cohere", enableKey: "use_cohere", name: "Cohere" },
          {
            key: "huggingface",
            enableKey: "use_huggingface",
            name: "HuggingFace",
          },
        ];

        for (const service of services) {
          const apiKey = await SecureApiKeyManager.getApiKey(service.key);
          const isEnabled = await AsyncStorage.getItem(service.enableKey);

          // Si le service est activé mais n'a pas de clé, le désactiver
          if (isEnabled === "true" && (!apiKey || apiKey.trim() === "")) {
            await AsyncStorage.setItem(service.enableKey, "false");
            logger.debug(`⚠️ ${service.name} désactivé (pas de clé API)`);
          }
        }

        // Afficher la configuration finale
        const finalConfig = {
          openai: {
            hasKey: !!(await SecureApiKeyManager.getApiKey("openai")),
            enabled: (await AsyncStorage.getItem("use_custom_api")) === "true",
          },
          gemini: {
            hasKey: !!(await SecureApiKeyManager.getApiKey("gemini")),
            enabled: (await AsyncStorage.getItem("use_gemini")) === "true",
          },
          mistral: {
            hasKey: !!(await SecureApiKeyManager.getApiKey("mistral")),
            enabled: (await AsyncStorage.getItem("use_mistral")) === "true",
          },
          cohere: {
            hasKey: !!(await SecureApiKeyManager.getApiKey("cohere")),
            enabled: (await AsyncStorage.getItem("use_cohere")) === "true",
          },
          huggingface: {
            hasKey: !!(await SecureApiKeyManager.getApiKey("huggingface")),
            enabled: (await AsyncStorage.getItem("use_huggingface")) === "true",
          },
        };

        logger.debug("✅ Configuration AI vérifiée:", finalConfig);
      } catch (error) {
        logger.error(
          "❌ Erreur lors de la vérification de la configuration AI:",
          error
        );
      }
    };

    cleanupAIConfig();
  }, []);

  // État local
  const {
    activeTab,
    isInitialLoad,
    cacheSize,
    isClearingCache,
    setActiveTab,
    setCacheSize,
    setIsClearingCache,
  } = useHomeScreenState();

  // Données des scripts et enregistrements
  const {
    scripts,
    recordings,
    deleteScript,
    deleteRecording,
    selectedScripts,
    selectedRecordings,
    toggleScriptSelection,
    toggleRecordingSelection,
    clearSelection,
    deleteSelectedItems,
    toggleSelectionMode,
    selectionMode,
  } = useHomeData();

  // Gestion du cache
  const {  } = useCacheManagement(
    cacheSize,
    setCacheSize,
    isClearingCache,
    setIsClearingCache
  );

  // Handlers de navigation
  const {
    handleScriptPress,
    handleRecordingPress,
    handleCreateScript,
    handleRecordVideo,
    handleAIGenerate,
    handleAIChat,
    handlePlanning,
    handleTabChange,
    handleSettings,
  } = useNavigationHandlers(selectionMode, clearSelection, scripts);

  // Handlers pour les actions de script
  const handleScriptShare = async (scriptId: string) => {
    logger.debug("📤 Partage du script:", scriptId);

    try {
      // Récupérer le script par son ID
      const script = scripts.find((s) => s.id === scriptId);

      if (!script) {
        logger.debug("❌ Script introuvable:", scriptId);
        Alert.alert("Erreur", "Script introuvable", [{ text: "OK" }]);
        return;
      }

      logger.debug("✅ Script trouvé:", script.title);

      // Créer le contenu du script avec formatage simple
      const scriptContent = `📝 ${script.title}\n\n${script.content}\n\n✨ Créé avec Visions`;

      logger.debug("📄 Contenu préparé, longueur:", scriptContent.length);

      // Essayer d'abord Share natif
      logger.debug("🚀 Tentative de partage avec Share.share()...");

      try {
        const result = await Share.share({
          message: scriptContent,
          title: script.title,
        });

        logger.debug("📤 Résultat du partage:", result);

        if (result.action === Share.sharedAction) {
          logger.debug("✅ Script partagé avec succès");
          Alert.alert(
            t("common.success", "Success"),
            t("planning.success.scriptShared", "Script shared successfully!"),
            [{ text: "OK" }]
          );
        } else if (result.action === Share.dismissedAction) {
          logger.debug("❌ Partage annulé par l'utilisateur");
        }
      } catch (shareError) {
        logger.debug(
          "⚠️ Share.share() a échoué, tentative avec le presse-papiers"
        );
        logger.error("Erreur Share:", shareError);

        // Fallback: copier dans le presse-papiers
        await Clipboard.setString(scriptContent);

        Alert.alert(
          "Partage via presse-papiers",
          "Le script a été copié dans le presse-papiers. Vous pouvez maintenant le coller dans l'application de votre choix.",
          [{ text: "OK" }]
        );

        logger.debug("✅ Script copié dans le presse-papiers");
      }
    } catch (error) {
      logger.error("❌ Erreur générale lors du partage:", error);
      Alert.alert(
        "Erreur de partage",
        `Impossible de partager le script: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`,
        [{ text: "OK" }]
      );
    }
  };

  const handleScriptDuplicate = async (scriptId: string) => {
    logger.debug("📋 Duplication du script:", scriptId);

    try {
      // Récupérer le script par son ID
      const script = scripts.find((s) => s.id === scriptId);

      if (!script) {
        Alert.alert("Erreur", "Script introuvable", [{ text: "OK" }]);
        return;
      }

      // Créer une copie du script avec un nouveau titre
      const duplicatedScriptData = {
        title: `${script.title} (Copie)`,
        content: script.content,
        isFavorite: script.isFavorite,
        estimatedDuration: script.estimatedDuration,
      };

      // Ajouter le script dupliqué
      await addScript(duplicatedScriptData);

      logger.debug("✅ Script dupliqué avec succès");
    } catch (error) {
      logger.error("❌ Erreur lors de la duplication:", error);
      Alert.alert(
        "Erreur de duplication",
        "Impossible de dupliquer le script",
        [{ text: "OK" }]
      );
    }
  };

  const handleScriptExport = async (scriptId: string) => {
    logger.debug("💾 Export du script:", scriptId);

    try {
      // Récupérer le script par son ID
      const script = scripts.find((s) => s.id === scriptId);

      if (!script) {
        logger.debug("❌ Script introuvable pour export:", scriptId);
        Alert.alert("Erreur", "Script introuvable", [{ text: "OK" }]);
        return;
      }

      logger.debug("✅ Script trouvé pour export:", script.title);

      // Préparer le contenu à exporter avec métadonnées
      const wordCount =
        script.content?.split(/\s+/).filter((word) => word.length > 0).length ||
        0;
      const exportContent = [
        `Titre: ${script.title}`,
        `Date de création: ${new Date(script.createdAt).toLocaleDateString(
          "fr-FR"
        )}`,
        `Dernière modification: ${new Date(script.updatedAt).toLocaleDateString(
          "fr-FR"
        )}`,
        `Nombre de mots: ${wordCount}`,
        `Durée estimée: ${
          script.estimatedDuration || Math.ceil(wordCount / 150)
        } min`,
        "",
        "--- CONTENU ---",
        "",
        script.content,
        "",
        "--- FIN ---",
        "",
        "Exporté depuis Visions",
      ].join("\n");

      logger.debug(
        "📄 Contenu d'export préparé, longueur:",
        exportContent.length
      );

      // Utiliser Share natif simple pour l'export
      const result = await Share.share({
        message: exportContent,
        title: `Export: ${script.title}`,
      });

      logger.debug("💾 Résultat de l'export:", result);

      if (result.action === Share.sharedAction) {
        logger.debug("✅ Script exporté avec succès");
        Alert.alert(
          t("common.success", "Success"),
          t("planning.success.scriptExported", "Script exported successfully!"),
          [{ text: "OK" }]
        );
      } else if (result.action === Share.dismissedAction) {
        logger.debug("❌ Export annulé par l'utilisateur");
      }
    } catch (error) {
      logger.error("❌ Erreur lors de l'export:", error);
      Alert.alert(
        "Erreur d'export",
        `Impossible d'exporter le script: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`,
        [{ text: "OK" }]
      );
    }
  };

  // Calcul du nombre de colonnes
  const numColumns = getNumColumns(orientation);

  // Gestion du changement d'onglet avec nettoyage de la sélection
  const onTabChange = (tab: "scripts" | "videos") => {
    handleTabChange(tab);
    setActiveTab(tab);
  };

  // Attendre que les préférences soient chargées
  if (!displayPrefsLoaded) {
    return (
      <View
        style={[
          tw`flex-1 items-center justify-center`,
          { backgroundColor: currentTheme.colors.background },
        ]}
      >
        {/* Optionnel: ajouter un indicateur de chargement ici */}
      </View>
    );
  }

  return (
    <View
      style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}
    >
      <LinearGradient
        colors={[`${currentTheme.colors.accent}10`, "transparent"]}
        style={tw`absolute top-0 left-0 right-0 h-40`}
      />

      {/* Header avec boutons d'action */}
      <HomeHeader
        selectionMode={selectionMode}
        activeTab={activeTab}
        scripts={scripts}
        recordings={recordings}
        selectedScripts={selectedScripts}
        selectedRecordings={selectedRecordings}
        onAIChat={handleAIChat}
        onSettings={handleSettings}
        onClearSelection={clearSelection}
        onToggleScriptSelection={toggleScriptSelection}
        onToggleRecordingSelection={toggleRecordingSelection}
        onTabChange={onTabChange}
      />

      {/* Sélecteur d'onglets */}
      <Animated.View
        entering={
          isInitialLoad ? FadeInDown.delay(100).duration(500) : undefined
        }
      >
        <HomeTabMenu
          activeTab={activeTab}
          scriptsCount={scripts.length}
          recordingsCount={recordings.length}
          onTabChange={onTabChange}
        />
      </Animated.View>

      {/* Contenu des onglets */}
      <ContentTabs
        activeTab={activeTab}
        isInitialLoad={isInitialLoad}
        numColumns={numColumns}
        scripts={scripts}
        recordings={recordings}
        selectedScripts={selectedScripts}
        selectedRecordings={selectedRecordings}
        selectionMode={selectionMode}
        scriptDisplayStyle={scriptDisplayStyle}
        onScriptPress={handleScriptPress}
        onRecordingPress={handleRecordingPress}
        onScriptDelete={deleteScript}
        onRecordingDelete={deleteRecording}
        onToggleScriptSelection={toggleScriptSelection}
        onToggleRecordingSelection={toggleRecordingSelection}
        onDeleteSelected={deleteSelectedItems}
        onToggleSelectionMode={toggleSelectionMode}
        onScriptShare={handleScriptShare}
        onScriptDuplicate={handleScriptDuplicate}
        onScriptExport={handleScriptExport}
        onToggleFavorite={toggleFavorite}
      />

      {/* FAB unifié avec compte invité intégré */}
      {!selectionMode && (
        <UnifiedHomeFAB
          activeTab={activeTab}
          scripts={scripts}
          onCreateScript={handleCreateScript}
          onRecordVideo={handleRecordVideo}
          onAIGenerate={handleAIGenerate}
          onAIChat={handleAIChat}
          onPlanning={handlePlanning}
        />
      )}

      {/* Informations de cache */}
      <CacheInfo cacheSize={cacheSize} />
    </View>
  );
}
