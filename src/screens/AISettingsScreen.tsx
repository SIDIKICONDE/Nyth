// Fichier AISettingsScreen refactorisé et internationalisé
import { useNavigation } from "@react-navigation/native";
import * as React from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Divider } from "react-native-paper";
import tw from "twrnc";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { AI_PROVIDERS } from "../config/aiConfig";
import { useTheme } from "../contexts/ThemeContext";
import { useAISettings } from "../hooks/useAISettings";
import { useDefaultKeyListener } from "../hooks/useDefaultKeyListener";
import { useTranslation } from "../hooks/useTranslation";
import {
  checkHasAnyApiKey,
  checkHasAnyApiKeyFromSettings,
} from "../utils/checkApiKeys";

import { createOptimizedLogger } from "../utils/optimizedLogger";
const logger = createOptimizedLogger("AISettingsScreen");

// Composants refactorisés
import ApiCard from "../components/ai/ApiCard";

import SaveButton from "../components/ai/SaveButton";
import SettingsSection from "../components/ai/SettingsSection";
import { ApiSecurityStatus } from "../components/ai/api-security";
import { CustomHeader } from "../components/common";

import SettingRow from "../components/settings/SettingRow";
import { InstantSwitch } from "../components/common/InstantSwitch";
import { testCryptoOnSimulator, testCryptoPerformance } from "../utils/testCrypto";


export default function AISettingsScreen() {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  // Utilisation du hook personnalisé pour toute la logique métier
  const {
    settings,
    updateSetting,
    isLoading,
    isSaving,
    saveSettings,
    handleServiceToggle,
    loadSettings,
  } = useAISettings();

  // Préférence utilisateur: chiffrement des clés API (activé par défaut)
  const [encryptionEnabled, setEncryptionEnabled] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const pref = await AsyncStorage.getItem("encrypt_api_keys");
        if (pref === null) {
          setEncryptionEnabled(true);
        } else {
          setEncryptionEnabled(pref === "true");
        }
      } catch {}
    })();
  }, []);

  const handleToggleEncryption = async (value: boolean) => {
    try {
      await AsyncStorage.setItem("encrypt_api_keys", value ? "true" : "false");
      setEncryptionEnabled(value);
      
      loadSettings();
    } catch (e) {
      logger.error("Erreur lors du changement de préférence de chiffrement:", e);
    }
  };

  // Écouter les changements de clé par défaut et recharger les paramètres
  useDefaultKeyListener(() => {
    logger.debug(
      "🔄 Rechargement automatique des paramètres après configuration de la clé par défaut"
    );
    loadSettings();
  });

  // Fonction pour gérer la suppression instantanée des clés
  const handleApiKeyChange = async (
    settingKey: keyof typeof settings,
    value: string,
    _storageKey?: string
  ) => {
    // Mettre à jour l'état local
    updateSetting(settingKey, value);

    // Si la valeur est vide, supprimer immédiatement de AsyncStorage
    if (!value || value.trim() === "") {
      try {
        switch (settingKey) {
          case "apiKey":
            try {
              const { SecureApiKeyManager } = await import(
                "../services/ai/SecureApiKeyManager"
              );
              await SecureApiKeyManager.deleteApiKey("openai");
            } catch {}
            logger.debug("🗑️ Clé OpenAI supprimée (sécurisé)");
            break;
          case "geminiKey":
            try {
              const { SecureApiKeyManager } = await import(
                "../services/ai/SecureApiKeyManager"
              );
              await SecureApiKeyManager.deleteApiKey("gemini");
            } catch {}
            logger.debug("🗑️ Clé Gemini supprimée (sécurisé)");
            break;
          case "mistralKey":
            try {
              const { SecureApiKeyManager } = await import(
                "../services/ai/SecureApiKeyManager"
              );
              await SecureApiKeyManager.deleteApiKey("mistral");
            } catch {}
            logger.debug("🗑️ Clé Mistral supprimée (sécurisé)");
            break;
          case "cohereKey":
            try {
              const { SecureApiKeyManager } = await import(
                "../services/ai/SecureApiKeyManager"
              );
              await SecureApiKeyManager.deleteApiKey("cohere");
            } catch {}
            logger.debug("🗑️ Clé Cohere supprimée (sécurisé)");
            break;
          // Nouveaux services premium
          case "claudeKey":
            try {
              const { SecureApiKeyManager } = await import(
                "../services/ai/SecureApiKeyManager"
              );
              await SecureApiKeyManager.deleteApiKey("claude");
            } catch {}
            logger.debug("🗑️ Clé Claude supprimée (sécurisé)");
            break;
          case "perplexityKey":
            try {
              const { SecureApiKeyManager } = await import(
                "../services/ai/SecureApiKeyManager"
              );
              await SecureApiKeyManager.deleteApiKey("perplexity");
            } catch {}
            logger.debug("🗑️ Clé Perplexity supprimée (sécurisé)");
            break;
          case "togetherKey":
            try {
              const { SecureApiKeyManager } = await import(
                "../services/ai/SecureApiKeyManager"
              );
              await SecureApiKeyManager.deleteApiKey("together");
            } catch {}
            logger.debug("🗑️ Clé Together supprimée (sécurisé)");
            break;
          case "groqKey":
            try {
              const { SecureApiKeyManager } = await import(
                "../services/ai/SecureApiKeyManager"
              );
              await SecureApiKeyManager.deleteApiKey("groq");
            } catch {}
            logger.debug("🗑️ Clé Groq supprimée (sécurisé)");
            break;
          case "fireworksKey":
            try {
              const { SecureApiKeyManager } = await import(
                "../services/ai/SecureApiKeyManager"
              );
              await SecureApiKeyManager.deleteApiKey("fireworks");
            } catch {}
            logger.debug("🗑️ Clé Fireworks supprimée (sécurisé)");
            break;
        }
      } catch (error) {
        logger.error("Erreur lors de la suppression de la clé:", error);
      }
    }
  };

  // Vérifier s'il y a des clés API au montage
  React.useEffect(() => {
    const checkKeys = async () => {
      const hasKeys = await checkHasAnyApiKey();
      logger.debug(
        "🔑 Vérification initiale des clés API - Section sécurité:",
        hasKeys ? "affichée" : "masquée"
      );
    };
    checkKeys();
  }, []);

  // Vérifier en temps réel quand les clés changent
  React.useEffect(() => {
    const hasKeys = checkHasAnyApiKeyFromSettings(
      settings as unknown as Record<string, string | undefined>
    );
    logger.debug(
      "🔑 Mise à jour temps réel - Section sécurité:",
      hasKeys ? "affichée" : "masquée"
    );
  }, [settings]);

  const hasKeys = checkHasAnyApiKeyFromSettings(
    settings as unknown as Record<string, string | undefined>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}
    >
      <CustomHeader
        title={t("aiSettings.title")}
        showBackButton={true}
        onBackPress={() => {
          if (!isSaving) {
            navigation.goBack();
          }
        }}
        backButtonDisabled={isSaving}
        rightComponent={
          <SaveButton onPress={saveSettings} isSaving={isSaving} />
        }
      />

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pt-3 pb-8 px-3`}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section APIs Gratuites */}
        <SettingsSection
          title={t("aiSettings.freeApis.title")}
          icon="api"
          delay={100}
        >
          <ApiCard
            title={t("aiSettings.freeApis.cohere.title")}
            description={t("aiSettings.freeApis.cohere.description")}
            apiName="cohere"
            isEnabled={settings.useCohere}
            setEnabled={(value) => {
              updateSetting("useCohere", value);
              handleServiceToggle(AI_PROVIDERS.COHERE, value);
            }}
            apiKey={settings.cohereKey}
            setApiKey={(value) => handleApiKeyChange("cohereKey", value)}
            placeholder={t("aiSettings.freeApis.cohere.placeholder")}
            color="#10b981"
            icon="lightning-bolt"
            isLoading={isLoading}
          />

          <ApiCard
            title={t("aiSettings.freeApis.gemini.title")}
            description={t("aiSettings.freeApis.gemini.description")}
            apiName="gemini"
            isEnabled={settings.useGemini}
            setEnabled={(value) => {
              updateSetting("useGemini", value);
              handleServiceToggle(AI_PROVIDERS.GEMINI, value);
            }}
            apiKey={settings.geminiKey}
            setApiKey={(value) => handleApiKeyChange("geminiKey", value)}
            placeholder={t("aiSettings.freeApis.gemini.placeholder")}
            color="#3b82f6"
            icon="google"
            isLoading={isLoading}
          />

          <ApiCard
            title={t("aiSettings.freeApis.mistral.title")}
            description={t("aiSettings.freeApis.mistral.description")}
            apiName="mistral"
            isEnabled={settings.useMistral}
            setEnabled={(value) => {
              updateSetting("useMistral", value);
              handleServiceToggle(AI_PROVIDERS.MISTRAL, value);
            }}
            apiKey={settings.mistralKey}
            setApiKey={(value) => handleApiKeyChange("mistralKey", value)}
            placeholder={t("aiSettings.freeApis.mistral.placeholder")}
            color="#ef4444"
            icon="weather-windy"
            isLoading={isLoading}
          />
        </SettingsSection>

        <Divider style={tw`my-3 bg-gray-200`} />

        {/* Section APIs Premium */}
        <SettingsSection
          title={t("aiSettings.premium.title")}
          icon="star"
          iconColor="#f59e0b"
          delay={300}
        >
          {/* Azure OpenAI */}
          <ApiCard
            title="Azure OpenAI"
            description={t(
              "aiSettings.premium.azureopenai.description",
              "OpenAI via Azure (compliance, réseaux privés)"
            )}
            apiName="azureopenai"
            isEnabled={settings.useAzureOpenAI}
            setEnabled={(value) => {
              updateSetting("useAzureOpenAI" as any, value as any);
              handleServiceToggle(AI_PROVIDERS.AZUREOPENAI, value);
            }}
            apiKey={settings.azureopenaiKey}
            setApiKey={(value) =>
              updateSetting("azureopenaiKey" as any, value as any)
            }
            placeholder={t(
              "aiSettings.premium.azureopenai.placeholder",
              "AZURE_OPENAI_API_KEY"
            )}
            color="#2563EB"
            icon="microsoft-azure"
            isLoading={isLoading}
          />

          {/* OpenRouter */}
          <ApiCard
            title="OpenRouter"
            description={t(
              "aiSettings.premium.openrouter.description",
              "Accès à de nombreux modèles via une seule API"
            )}
            apiName="openrouter"
            isEnabled={settings.useOpenRouter}
            setEnabled={(value) => {
              updateSetting("useOpenRouter" as any, value as any);
              handleServiceToggle(AI_PROVIDERS.OPENROUTER, value);
            }}
            apiKey={settings.openrouterKey}
            setApiKey={(value) =>
              updateSetting("openrouterKey" as any, value as any)
            }
            placeholder={t(
              "aiSettings.premium.openrouter.placeholder",
              "OPENROUTER_API_KEY"
            )}
            color="#0EA5E9"
            icon="router-wireless"
            isLoading={isLoading}
          />

          {/* DeepInfra */}
          <ApiCard
            title="DeepInfra"
            description={t(
              "aiSettings.premium.deepinfra.description",
              "Hébergement de modèles open-source à coût réduit"
            )}
            apiName="deepinfra"
            isEnabled={settings.useDeepInfra}
            setEnabled={(value) => {
              updateSetting("useDeepInfra" as any, value as any);
              handleServiceToggle(AI_PROVIDERS.DEEPINFRA, value);
            }}
            apiKey={settings.deepinfraKey}
            setApiKey={(value) =>
              updateSetting("deepinfraKey" as any, value as any)
            }
            placeholder={t(
              "aiSettings.premium.deepinfra.placeholder",
              "DEEPINFRA_API_KEY"
            )}
            color="#00A38C"
            icon="server"
            isLoading={isLoading}
          />

          {/* xAI (Grok) */}
          <ApiCard
            title="xAI (Grok)"
            description={t(
              "aiSettings.premium.xai.description",
              "Modèle Grok de xAI, performant en contexte temps réel"
            )}
            apiName="xai"
            isEnabled={settings.useXAI}
            setEnabled={(value) => {
              updateSetting("useXAI" as any, value as any);
              handleServiceToggle(AI_PROVIDERS.XAI, value);
            }}
            apiKey={settings.xaiKey}
            setApiKey={(value) => updateSetting("xaiKey" as any, value as any)}
            placeholder={t("aiSettings.premium.xai.placeholder", "XAI_API_KEY")}
            color="#111827"
            icon="twitter"
            isLoading={isLoading}
          />

          {/* DeepSeek */}
          <ApiCard
            title="DeepSeek"
            description={t(
              "aiSettings.premium.deepseek.description",
              "Modèles efficaces et économiques, bon raisonnement"
            )}
            apiName="deepseek"
            isEnabled={settings.useDeepSeek}
            setEnabled={(value) => {
              updateSetting("useDeepSeek" as any, value as any);
              handleServiceToggle(AI_PROVIDERS.DEEPSEEK, value);
            }}
            apiKey={settings.deepseekKey}
            setApiKey={(value) =>
              updateSetting("deepseekKey" as any, value as any)
            }
            placeholder={t(
              "aiSettings.premium.deepseek.placeholder",
              "DEEPSEEK_API_KEY"
            )}
            color="#06B6D4"
            icon="chip"
            isLoading={isLoading}
          />
          <ApiCard
            title="OpenAI"
            description={t("aiSettings.premium.openai.description")}
            apiName="openai"
            isEnabled={settings.useCustomAPI}
            setEnabled={(value) => {
              updateSetting("useCustomAPI", value);
              handleServiceToggle(AI_PROVIDERS.OPENAI, value);
            }}
            apiKey={settings.apiKey}
            setApiKey={(value) => handleApiKeyChange("apiKey", value)}
            placeholder={t("aiSettings.premium.openai.placeholder")}
            color="#f59e0b"
            icon="robot"
            isLoading={isLoading}
          />

          <ApiCard
            title="Claude (Anthropic)"
            description={t("aiSettings.premium.claude.description")}
            apiName="claude"
            isEnabled={settings.useClaude}
            setEnabled={(value) => {
              updateSetting("useClaude", value);
              handleServiceToggle(AI_PROVIDERS.CLAUDE, value);
            }}
            apiKey={settings.claudeKey}
            setApiKey={(value) => handleApiKeyChange("claudeKey", value)}
            placeholder={t("aiSettings.premium.claude.placeholder")}
            color="#8B5CF6"
            icon="brain"
            isLoading={isLoading}
          />

          <ApiCard
            title="Perplexity AI"
            description={t("aiSettings.premium.perplexity.description")}
            apiName="perplexity"
            isEnabled={settings.usePerplexity}
            setEnabled={(value) => {
              updateSetting("usePerplexity", value);
              handleServiceToggle(AI_PROVIDERS.PERPLEXITY, value);
            }}
            apiKey={settings.perplexityKey}
            setApiKey={(value) => handleApiKeyChange("perplexityKey", value)}
            placeholder={t("aiSettings.premium.perplexity.placeholder")}
            color="#10B981"
            icon="search-web"
            isLoading={isLoading}
          />

          <ApiCard
            title="Groq"
            description={t("aiSettings.premium.groq.description")}
            apiName="groq"
            isEnabled={settings.useGroq}
            setEnabled={(value) => {
              updateSetting("useGroq", value);
              handleServiceToggle(AI_PROVIDERS.GROQ, value);
            }}
            apiKey={settings.groqKey}
            setApiKey={(value) => handleApiKeyChange("groqKey", value)}
            placeholder={t("aiSettings.premium.groq.placeholder")}
            color="#F59E0B"
            icon="flash"
            isLoading={isLoading}
          />

          <ApiCard
            title="Together AI"
            description={t("aiSettings.premium.together.description")}
            apiName="together"
            isEnabled={settings.useTogether}
            setEnabled={(value) => {
              updateSetting("useTogether", value);
              handleServiceToggle(AI_PROVIDERS.TOGETHER, value);
            }}
            apiKey={settings.togetherKey}
            setApiKey={(value) => handleApiKeyChange("togetherKey", value)}
            placeholder={t("aiSettings.premium.together.placeholder")}
            color="#6366F1"
            icon="account-group"
            isLoading={isLoading}
          />

          <ApiCard
            title="Fireworks AI"
            description={t("aiSettings.premium.fireworks.description")}
            apiName="fireworks"
            isEnabled={settings.useFireworks}
            setEnabled={(value) => {
              updateSetting("useFireworks", value);
              handleServiceToggle(AI_PROVIDERS.FIREWORKS, value);
            }}
            apiKey={settings.fireworksKey}
            setApiKey={(value) => handleApiKeyChange("fireworksKey", value)}
            placeholder={t("aiSettings.premium.fireworks.placeholder")}
            color="#EC4899"
            icon="rocket"
            isLoading={isLoading}
          />
        </SettingsSection>

        {/* Section de priorité des API - Supprimée */}
        <Divider style={tw`my-3 bg-gray-200`} />
        
        {/* Toggle chiffrement des clés API */}
        <SettingRow
          icon="lock"
          iconColor="#ffffff"
          iconBgColor={currentTheme.colors.primary}
          title={t(
            "aiSettings.security.encryption.title",
            "Chiffrement des clés API"
          )}
          subtitle={t(
            "aiSettings.security.encryption.subtitle",
            "Stocker les clés de manière chiffrée sur cet appareil"
          )}
          rightElement={
            <InstantSwitch
              value={Boolean(encryptionEnabled)}
              onValueChange={handleToggleEncryption}
              trackColor={{
                false: currentTheme.colors.border,
                true: currentTheme.colors.primary,
              }}
              thumbColor="#ffffff"
            />
          }
        />
        
        {/* Section sécurité des clés - visible seulement quand le chiffrement est activé */}
        {encryptionEnabled && hasKeys && (
          <>
            <Divider style={tw`my-3 bg-gray-200`} />
            <ApiSecurityStatus />
          </>
        )}

        {/* Boutons de test pour le simulateur */}
        {__DEV__ && (
          <>
            <Divider style={tw`my-3 bg-gray-200`} />
            <SettingRow
              icon="test-tube"
              iconColor="#ffffff"
              iconBgColor="#3b82f6"
              title="Test Chiffrement AES-256-GCM"
              subtitle="Tester le chiffrement sur le simulateur"
              onPress={async () => {
                try {
                  await testCryptoOnSimulator();
                } catch (error) {
                  console.error("Erreur test chiffrement:", error);
                }
              }}
            />
            <SettingRow
              icon="speedometer"
              iconColor="#ffffff"
              iconBgColor="#10b981"
              title="Test Performance"
              subtitle="Mesurer les performances du chiffrement"
              onPress={async () => {
                try {
                  await testCryptoPerformance();
                } catch (error) {
                  console.error("Erreur test performance:", error);
                }
              }}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
