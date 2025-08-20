/**
 * Onglet de contrôle avancé de l'IA
 * Permet aux administrateurs de gérer finement l'utilisation de l'IA
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { createLogger } from "../../../../utils/optimizedLogger";
import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  getDocs,
  orderBy,
  limit,
} from "@react-native-firebase/firestore";

const logger = createLogger("AIControlTab");

interface AIControlConfig {
  // Limites d'utilisation
  maxRequestsPerUser: number;
  maxRequestsPerHour: number;
  maxTokensPerRequest: number;

  // Contrôle des prompts
  enablePromptFiltering: boolean;
  blockedKeywords: string[];
  maxPromptLength: number;

  // Services IA
  enabledServices: {
    openai: boolean;
    gemini: boolean;
    claude: boolean;
    mistral: boolean;
    [key: string]: boolean;
  };

  // Monitoring
  enableUsageTracking: boolean;
  enableCostTracking: boolean;
  alertThreshold: number; // pourcentage

  // Sécurité
  enableContentModeration: boolean;
  requireUserVerification: boolean;
}

interface AIUsageStats {
  totalRequests: number;
  totalTokens: number;
  estimatedCost: number;
  activeUsers: number;
  blockedRequests: number;
}

export function AIControlTab() {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;

  const [config, setConfig] = useState<AIControlConfig>({
    maxRequestsPerUser: 100,
    maxRequestsPerHour: 50,
    maxTokensPerRequest: 4000,
    enablePromptFiltering: true,
    blockedKeywords: ["hack", "exploit", "virus", "malware"],
    maxPromptLength: 2000,
    enabledServices: {
      openai: true,
      gemini: true,
      claude: true,
      mistral: true,
    },
    enableUsageTracking: true,
    enableCostTracking: true,
    alertThreshold: 80,
    enableContentModeration: true,
    requireUserVerification: false,
  });

  const [stats, setStats] = useState<AIUsageStats>({
    totalRequests: 0,
    totalTokens: 0,
    estimatedCost: 0,
    activeUsers: 0,
    blockedRequests: 0,
  });

  const [loading, setLoading] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");

  useEffect(() => {
    loadConfig();
    loadStats();
  }, []);

  const loadConfig = async () => {
    try {
      const db = getFirestore(getApp());
      const configDoc = await getDoc(doc(db, "admin", "ai_config"));
      if (configDoc.exists()) {
        setConfig({ ...config, ...configDoc.data() });
      }
    } catch (error) {
      logger.error("Erreur lors du chargement de la config IA:", error);
    }
  };

  const loadStats = async () => {
    try {
      const db = getFirestore(getApp());
      // Simuler des stats - à remplacer par de vraies données
      const statsData: AIUsageStats = {
        totalRequests: 15420,
        totalTokens: 2847500,
        estimatedCost: 42.85,
        activeUsers: 234,
        blockedRequests: 127,
      };
      setStats(statsData);
    } catch (error) {
      logger.error("Erreur lors du chargement des stats IA:", error);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      const db = getFirestore(getApp());
      await setDoc(doc(db, "admin", "ai_config"), config);
      Alert.alert("Succès", "Configuration IA mise à jour");
      logger.info("Configuration IA sauvegardée");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder la configuration");
      logger.error("Erreur lors de la sauvegarde de la config IA:", error);
    } finally {
      setLoading(false);
    }
  };

  const addBlockedKeyword = () => {
    if (!newKeyword.trim()) return;

    if (config.blockedKeywords.includes(newKeyword.trim())) {
      Alert.alert("Erreur", "Ce mot-clé est déjà dans la liste");
      return;
    }

    setConfig({
      ...config,
      blockedKeywords: [...config.blockedKeywords, newKeyword.trim()],
    });
    setNewKeyword("");
  };

  const removeBlockedKeyword = (keyword: string) => {
    setConfig({
      ...config,
      blockedKeywords: config.blockedKeywords.filter(k => k !== keyword),
    });
  };

  const resetStats = () => {
    Alert.alert(
      "Confirmation",
      "Êtes-vous sûr de vouloir réinitialiser les statistiques ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Réinitialiser",
          style: "destructive",
          onPress: () => {
            setStats({
              totalRequests: 0,
              totalTokens: 0,
              estimatedCost: 0,
              activeUsers: 0,
              blockedRequests: 0,
            });
            logger.info("Statistiques IA réinitialisées");
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>🤖 Contrôle IA Avancé</Text>

      {/* Statistiques */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Statistiques d'utilisation</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalRequests.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Requêtes totales</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalTokens.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tokens utilisés</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>${stats.estimatedCost.toFixed(2)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Coût estimé</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.error }]}>{stats.blockedRequests}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Requêtes bloquées</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={resetStats}
        >
          <Text style={styles.buttonText}>🔄 Réinitialiser Stats</Text>
        </TouchableOpacity>
      </View>

      {/* Limites d'utilisation */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>⚙️ Limites d'utilisation</Text>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>Requêtes max par utilisateur:</Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={config.maxRequestsPerUser.toString()}
            keyboardType="numeric"
            onChangeText={(value) => setConfig({ ...config, maxRequestsPerUser: parseInt(value) || 0 })}
          />
        </View>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>Requêtes max par heure:</Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={config.maxRequestsPerHour.toString()}
            keyboardType="numeric"
            onChangeText={(value) => setConfig({ ...config, maxRequestsPerHour: parseInt(value) || 0 })}
          />
        </View>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>Tokens max par requête:</Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={config.maxTokensPerRequest.toString()}
            keyboardType="numeric"
            onChangeText={(value) => setConfig({ ...config, maxTokensPerRequest: parseInt(value) || 0 })}
          />
        </View>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>Longueur max du prompt:</Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={config.maxPromptLength.toString()}
            keyboardType="numeric"
            onChangeText={(value) => setConfig({ ...config, maxPromptLength: parseInt(value) || 0 })}
          />
        </View>
      </View>

      {/* Services IA */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>🔧 Services IA activés</Text>

        {Object.entries(config.enabledServices).map(([service, enabled]) => (
          <View key={service} style={styles.switchItem}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>
              {service.toUpperCase()}
            </Text>
            <Switch
              value={enabled}
              onValueChange={(value) =>
                setConfig({
                  ...config,
                  enabledServices: { ...config.enabledServices, [service]: value },
                })
              }
              trackColor={{ false: colors.textSecondary, true: colors.primary }}
              thumbColor={enabled ? colors.background : colors.surface}
            />
          </View>
        ))}
      </View>

      {/* Filtrage des prompts */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>🚫 Filtrage des prompts</Text>

        <View style={styles.switchItem}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>
            Activer le filtrage des prompts
          </Text>
          <Switch
            value={config.enablePromptFiltering}
            onValueChange={(value) => setConfig({ ...config, enablePromptFiltering: value })}
            trackColor={{ false: colors.textSecondary, true: colors.primary }}
            thumbColor={config.enablePromptFiltering ? colors.background : colors.surface}
          />
        </View>

        {config.enablePromptFiltering && (
          <>
            <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
              Mots-clés bloqués:
            </Text>
            <View style={styles.keywordsContainer}>
              {config.blockedKeywords.map((keyword) => (
                <TouchableOpacity
                  key={keyword}
                  style={[styles.keywordChip, { backgroundColor: colors.error }]}
                  onPress={() => removeBlockedKeyword(keyword)}
                >
                  <Text style={[styles.keywordText, { color: colors.background }]}>
                    {keyword} ✕
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.addKeywordContainer}>
              <TextInput
                style={[styles.keywordInput, { backgroundColor: colors.background, color: colors.text }]}
                value={newKeyword}
                placeholder="Nouveau mot-clé..."
                placeholderTextColor={colors.textSecondary}
                onChangeText={setNewKeyword}
              />
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={addBlockedKeyword}
              >
                <Text style={[styles.addButtonText, { color: colors.background }]}>
                  Ajouter
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Sécurité et monitoring */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>🔒 Sécurité & Monitoring</Text>

        <View style={styles.switchItem}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>
            Suivi d'utilisation
          </Text>
          <Switch
            value={config.enableUsageTracking}
            onValueChange={(value) => setConfig({ ...config, enableUsageTracking: value })}
            trackColor={{ false: colors.textSecondary, true: colors.primary }}
            thumbColor={config.enableUsageTracking ? colors.background : colors.surface}
          />
        </View>

        <View style={styles.switchItem}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>
            Suivi des coûts
          </Text>
          <Switch
            value={config.enableCostTracking}
            onValueChange={(value) => setConfig({ ...config, enableCostTracking: value })}
            trackColor={{ false: colors.textSecondary, true: colors.primary }}
            thumbColor={config.enableCostTracking ? colors.background : colors.surface}
          />
        </View>

        <View style={styles.switchItem}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>
            Modération de contenu
          </Text>
          <Switch
            value={config.enableContentModeration}
            onValueChange={(value) => setConfig({ ...config, enableContentModeration: value })}
            trackColor={{ false: colors.textSecondary, true: colors.primary }}
            thumbColor={config.enableContentModeration ? colors.background : colors.surface}
          />
        </View>

        <View style={styles.switchItem}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>
            Vérification utilisateur requise
          </Text>
          <Switch
            value={config.requireUserVerification}
            onValueChange={(value) => setConfig({ ...config, requireUserVerification: value })}
            trackColor={{ false: colors.textSecondary, true: colors.primary }}
            thumbColor={config.requireUserVerification ? colors.background : colors.surface}
          />
        </View>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>
            Seuil d'alerte (%):
          </Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={config.alertThreshold.toString()}
            keyboardType="numeric"
            onChangeText={(value) => setConfig({ ...config, alertThreshold: parseInt(value) || 80 })}
          />
        </View>
      </View>

      {/* Boutons d'action */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={saveConfig}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.background }]}>
              💾 Sauvegarder Configuration
            </Text>
          )}
        </TouchableOpacity>
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
  subLabel: {
    fontSize: 14,
    marginBottom: 8,
    marginTop: 8,
  },
  keywordsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  keywordChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  keywordText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  addKeywordContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  keywordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  actionContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
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
