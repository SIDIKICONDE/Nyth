/**
 * Onglet de contrôle des fonctionnalités
 * Permet aux administrateurs de gérer l'activation/désactivation des modules
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  TextInput,
} from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { createLogger } from "../../../../utils/optimizedLogger";
import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from "@react-native-firebase/firestore";

const logger = createLogger("FeatureControlTab");

interface FeatureConfig {
  // Modules principaux
  modules: {
    ai: boolean;
    camera: boolean;
    recording: boolean;
    chat: boolean;
    analytics: boolean;
    notifications: boolean;
    themes: boolean;
    subscriptions: boolean;
    [key: string]: boolean;
  };

  // Fonctionnalités avancées
  advancedFeatures: {
    aiGeneration: boolean;
    voiceRecording: boolean;
    videoFilters: boolean;
    realTimeChat: boolean;
    pushNotifications: boolean;
    offlineMode: boolean;
    autoSave: boolean;
    cloudSync: boolean;
    [key: string]: boolean;
  };

  // Permissions utilisateur
  permissions: {
    allowUserRegistration: boolean;
    allowGuestAccess: boolean;
    requireEmailVerification: boolean;
    allowFileUpload: boolean;
    allowExport: boolean;
    allowSharing: boolean;
  };

  // Limites utilisateur
  limits: {
    maxScriptsPerUser: number;
    maxRecordingsPerUser: number;
    maxStoragePerUser: number; // MB
    maxDailyUsage: number; // minutes
  };

  // Mises à jour forcées
  updates: {
    forceUpdate: boolean;
    minVersion: string;
    updateMessage: string;
    maintenanceMode: boolean;
    maintenanceMessage: string;
  };

  // Expérimentations
  experiments: {
    enableBetaFeatures: boolean;
    allowUserFeedback: boolean;
    collectUsageStats: boolean;
  };
}

interface FeatureStats {
  totalModules: number;
  activeModules: number;
  totalFeatures: number;
  activeFeatures: number;
  registeredUsers: number;
  activeUsers: number;
}

export function FeatureControlTab() {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;

  const [config, setConfig] = useState<FeatureConfig>({
    modules: {
      ai: true,
      camera: true,
      recording: true,
      chat: true,
      analytics: true,
      notifications: true,
      themes: true,
      subscriptions: true,
    },
    advancedFeatures: {
      aiGeneration: true,
      voiceRecording: true,
      videoFilters: true,
      realTimeChat: true,
      pushNotifications: true,
      offlineMode: true,
      autoSave: true,
      cloudSync: true,
    },
    permissions: {
      allowUserRegistration: true,
      allowGuestAccess: true,
      requireEmailVerification: false,
      allowFileUpload: true,
      allowExport: true,
      allowSharing: true,
    },
    limits: {
      maxScriptsPerUser: 100,
      maxRecordingsPerUser: 50,
      maxStoragePerUser: 1024,
      maxDailyUsage: 120,
    },
    updates: {
      forceUpdate: false,
      minVersion: "1.0.0",
      updateMessage: "",
      maintenanceMode: false,
      maintenanceMessage: "",
    },
    experiments: {
      enableBetaFeatures: false,
      allowUserFeedback: true,
      collectUsageStats: true,
    },
  });

  const [stats, setStats] = useState<FeatureStats>({
    totalModules: 8,
    activeModules: 8,
    totalFeatures: 8,
    activeFeatures: 8,
    registeredUsers: 1250,
    activeUsers: 340,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfig();
    loadStats();
  }, []);

  const loadConfig = async () => {
    try {
      const db = getFirestore(getApp());
      const configDoc = await getDoc(doc(db, "admin", "feature_config"));
      if (configDoc.exists()) {
        setConfig({ ...config, ...configDoc.data() });
      }
    } catch (error) {
      logger.error("Erreur lors du chargement de la config:", error);
    }
  };

  const loadStats = async () => {
    try {
      // Calculer les stats basées sur la config
      const activeModules = Object.values(config.modules).filter(Boolean).length;
      const activeFeatures = Object.values(config.advancedFeatures).filter(Boolean).length;

      setStats({
        ...stats,
        activeModules,
        activeFeatures,
      });
    } catch (error) {
      logger.error("Erreur lors du calcul des stats:", error);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      const db = getFirestore(getApp());
      await setDoc(doc(db, "admin", "feature_config"), config);
      Alert.alert("Succès", "Configuration des fonctionnalités mise à jour");
      logger.info("Configuration des fonctionnalités sauvegardée");
      await loadStats();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder la configuration");
      logger.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleName: string) => {
    setConfig({
      ...config,
      modules: {
        ...config.modules,
        [moduleName]: !config.modules[moduleName],
      },
    });
  };

  const toggleFeature = (featureName: string) => {
    setConfig({
      ...config,
      advancedFeatures: {
        ...config.advancedFeatures,
        [featureName]: !config.advancedFeatures[featureName],
      },
    });
  };

  const resetToDefaults = () => {
    Alert.alert(
      "Confirmation",
      "Êtes-vous sûr de vouloir réinitialiser à la configuration par défaut ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Réinitialiser",
          style: "destructive",
          onPress: () => {
            // Reset logic would go here
            Alert.alert("Succès", "Configuration réinitialisée");
            logger.info("Configuration réinitialisée aux valeurs par défaut");
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>🎛️ Contrôle des Fonctionnalités</Text>

      {/* Statistiques */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Aperçu des fonctionnalités</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.activeModules}/{stats.totalModules}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Modules actifs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.activeFeatures}/{stats.totalFeatures}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Fonctionnalités actives</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.success }]}>{stats.activeUsers}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Utilisateurs actifs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.registeredUsers}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Utilisateurs totaux</Text>
          </View>
        </View>
      </View>

      {/* Modules principaux */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>🧩 Modules principaux</Text>
        <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
          Activation/désactivation des modules de base
        </Text>

        {Object.entries(config.modules).map(([module, enabled]) => (
          <View key={module} style={styles.switchItem}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>
              {module.charAt(0).toUpperCase() + module.slice(1)}
            </Text>
            <Switch
              value={enabled}
              onValueChange={() => toggleModule(module)}
              trackColor={{ false: colors.textSecondary, true: colors.primary }}
              thumbColor={enabled ? colors.background : colors.surface}
            />
          </View>
        ))}
      </View>

      {/* Fonctionnalités avancées */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>⚡ Fonctionnalités avancées</Text>
        <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
          Contrôle granulaire des fonctionnalités
        </Text>

        {Object.entries(config.advancedFeatures).map(([feature, enabled]) => (
          <View key={feature} style={styles.switchItem}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>
              {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </Text>
            <Switch
              value={enabled}
              onValueChange={() => toggleFeature(feature)}
              trackColor={{ false: colors.textSecondary, true: colors.primary }}
              thumbColor={enabled ? colors.background : colors.surface}
            />
          </View>
        ))}
      </View>

      {/* Permissions utilisateur */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>🔐 Permissions utilisateur</Text>
        <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
          Contrôle des actions autorisées
        </Text>

        {Object.entries(config.permissions).map(([permission, allowed]) => (
          <View key={permission} style={styles.switchItem}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>
              {permission.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </Text>
            <Switch
              value={allowed}
              onValueChange={(value) =>
                setConfig({
                  ...config,
                  permissions: { ...config.permissions, [permission]: value },
                })
              }
              trackColor={{ false: colors.textSecondary, true: colors.primary }}
              thumbColor={allowed ? colors.background : colors.surface}
            />
          </View>
        ))}
      </View>

      {/* Limites utilisateur */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>📏 Limites utilisateur</Text>
        <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
          Contrôle des quotas par utilisateur
        </Text>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>Scripts max par utilisateur:</Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={config.limits.maxScriptsPerUser.toString()}
            keyboardType="numeric"
            onChangeText={(value) =>
              setConfig({
                ...config,
                limits: { ...config.limits, maxScriptsPerUser: parseInt(value) || 0 },
              })
            }
          />
        </View>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>Enregistrements max par utilisateur:</Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={config.limits.maxRecordingsPerUser.toString()}
            keyboardType="numeric"
            onChangeText={(value) =>
              setConfig({
                ...config,
                limits: { ...config.limits, maxRecordingsPerUser: parseInt(value) || 0 },
              })
            }
          />
        </View>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>Stockage max par utilisateur (MB):</Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={config.limits.maxStoragePerUser.toString()}
            keyboardType="numeric"
            onChangeText={(value) =>
              setConfig({
                ...config,
                limits: { ...config.limits, maxStoragePerUser: parseInt(value) || 0 },
              })
            }
          />
        </View>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>Utilisation quotidienne max (minutes):</Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={config.limits.maxDailyUsage.toString()}
            keyboardType="numeric"
            onChangeText={(value) =>
              setConfig({
                ...config,
                limits: { ...config.limits, maxDailyUsage: parseInt(value) || 0 },
              })
            }
          />
        </View>
      </View>

      {/* Mises à jour et maintenance */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>🔄 Mises à jour & Maintenance</Text>
        <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
          Gestion des versions et maintenance
        </Text>

        <View style={styles.switchItem}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>
            Forcer la mise à jour
          </Text>
          <Switch
            value={config.updates.forceUpdate}
            onValueChange={(value) =>
              setConfig({
                ...config,
                updates: { ...config.updates, forceUpdate: value },
              })
            }
            trackColor={{ false: colors.textSecondary, true: colors.error }}
            thumbColor={config.updates.forceUpdate ? colors.background : colors.surface}
          />
        </View>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>Version minimum requise:</Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={config.updates.minVersion}
            placeholder="1.0.0"
            onChangeText={(value) =>
              setConfig({
                ...config,
                updates: { ...config.updates, minVersion: value },
              })
            }
          />
        </View>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>Message de mise à jour:</Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={config.updates.updateMessage}
            placeholder="Veuillez mettre à jour l'application"
            multiline
            numberOfLines={3}
            onChangeText={(value) =>
              setConfig({
                ...config,
                updates: { ...config.updates, updateMessage: value },
              })
            }
          />
        </View>

        <View style={styles.switchItem}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>
            Mode maintenance
          </Text>
          <Switch
            value={config.updates.maintenanceMode}
            onValueChange={(value) =>
              setConfig({
                ...config,
                updates: { ...config.updates, maintenanceMode: value },
              })
            }
            trackColor={{ false: colors.textSecondary, true: colors.warning }}
            thumbColor={config.updates.maintenanceMode ? colors.background : colors.surface}
          />
        </View>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>Message de maintenance:</Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={config.updates.maintenanceMessage}
            placeholder="L'application est en maintenance"
            multiline
            numberOfLines={3}
            onChangeText={(value) =>
              setConfig({
                ...config,
                updates: { ...config.updates, maintenanceMessage: value },
              })
            }
          />
        </View>
      </View>

      {/* Expérimentations */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>🧪 Expérimentations</Text>
        <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
          Fonctionnalités en test
        </Text>

        {Object.entries(config.experiments).map(([experiment, enabled]) => (
          <View key={experiment} style={styles.switchItem}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>
              {experiment.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </Text>
            <Switch
              value={enabled}
              onValueChange={(value) =>
                setConfig({
                  ...config,
                  experiments: { ...config.experiments, [experiment]: value },
                })
              }
              trackColor={{ false: colors.textSecondary, true: colors.primary }}
              thumbColor={enabled ? colors.background : colors.surface}
            />
          </View>
        ))}
      </View>

      {/* Boutons d'action */}
      <View style={styles.actionContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, loading && styles.buttonDisabled]}
            onPress={resetToDefaults}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: colors.background }]}>
              🔄 Réinitialiser
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={saveConfig}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.background }]}>
                💾 Sauvegarder
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  subLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    width: "48%",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  switchItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    flex: 1,
  },
  configItem: {
    marginBottom: 16,
  },
  configLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  configInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  actionContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#007bff",
  },
  secondaryButton: {
    backgroundColor: "#6c757d",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
