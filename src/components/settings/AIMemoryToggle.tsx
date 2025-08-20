import {
  loadAIMemoryConfig,
  toggleAIMemory,
  type AIMemoryConfig,
} from "@/config/aiMemoryConfig";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useCallback, useEffect, useState } from "react";
import { Switch, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { UIText } from "../ui/Typography";
import {
  isMemoryCitationsEnabled,
  setMemoryCitationsEnabled,
} from "@/config/memoryConfig";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('AIMemoryToggle');

const AIMemoryToggle: React.FC<{
  onConfigChange?: (config: AIMemoryConfig) => void;
}> = ({ onConfigChange }) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const [config, setConfig] = useState<AIMemoryConfig>();
  const [citationsEnabled, setCitationsEnabled] = useState(false);

  const loadConfig = async () => {
    try {
      const loadedConfig = await loadAIMemoryConfig();
      setConfig(loadedConfig);
      const c = await isMemoryCitationsEnabled();
      setCitationsEnabled(c);
    } catch (error) {
      logger.error("Erreur chargement config mémoire IA:", error);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleToggle = async (value: boolean) => {
    if (!config) return;
    try {
      await toggleAIMemory(value);
      const newConfig = { ...config, enabled: value };
      setConfig(newConfig);
      onConfigChange?.(newConfig);
    } catch (error) {
      logger.error("Erreur lors de l'activation de la mémoire IA:", error);
    }
  };

  const handleToggleCitations = useCallback(async (value: boolean) => {
    try {
      await setMemoryCitationsEnabled(value);
      setCitationsEnabled(value);
    } catch (error) {
      logger.error("Erreur bascule citations:", error);
    }
  }, []);

  if (!config) return null;

  return (
    <View style={tw`px-6 py-4`}>
      <TouchableOpacity
        onPress={() => handleToggle(!config.enabled)}
        style={tw`flex-row items-center justify-between mb-3`}
        activeOpacity={0.7}
      >
        <View style={tw`flex-row items-center`}>
          <MaterialCommunityIcons
            name="brain"
            size={24}
            color={currentTheme.colors.primary}
            style={tw`mr-3`}
          />
          <UIText weight="semibold" color={currentTheme.colors.text}>
            {t("aiMemory.toggle.title")}
          </UIText>
        </View>
        <Switch
          value={config.enabled}
          onValueChange={handleToggle}
          trackColor={{ true: currentTheme.colors.primary }}
          thumbColor={currentTheme.colors.surface}
        />
      </TouchableOpacity>

      <View style={tw`flex-row items-center justify-between ml-9`}>
        <View style={tw`flex-row items-center`}>
          <MaterialCommunityIcons
            name="format-quote-close"
            size={20}
            color={currentTheme.colors.textSecondary}
            style={tw`mr-3`}
          />
          <UIText color={currentTheme.colors.textSecondary}>
            {t("aiMemory.citations.enable", "Activer citations et sources")}
          </UIText>
        </View>
        <Switch
          value={citationsEnabled}
          onValueChange={handleToggleCitations}
          trackColor={{ true: currentTheme.colors.primary }}
          thumbColor={currentTheme.colors.surface}
        />
      </View>
    </View>
  );
};

export default AIMemoryToggle;
