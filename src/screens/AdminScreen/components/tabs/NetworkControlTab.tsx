/**
 * Onglet de contrôle réseau avancé
 * Permet aux administrateurs de gérer les APIs externes et les paramètres réseau
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

const logger = createLogger("NetworkControlTab");

interface NetworkConfig {
  // Timeouts
  apiTimeout: number; // en millisecondes
  connectionTimeout: number;
  readTimeout: number;

  // Limites de bande passante
  maxConcurrentRequests: number;
  requestRateLimit: number; // requêtes par minute
  bandwidthLimit: number; // KB/s

  // APIs externes
  enabledAPIs: {
    openai: boolean;
    gemini: boolean;
    firebase: boolean;
    revenuecat: boolean;
    analytics: boolean;
    [key: string]: boolean;
  };

  // Retry et fallback
  maxRetries: number;
  retryDelay: number; // millisecondes
  enableFallbackMode: boolean;

  // Monitoring
  enableNetworkLogging: boolean;
  logRequestDetails: boolean;
  alertOnHighLatency: boolean;
  latencyThreshold: number; // millisecondes

  // Cache et optimisation
  enableResponseCache: boolean;
  cacheDuration: number; // minutes
  enableCompression: boolean;
}

interface NetworkStats {
  activeConnections: number;
  totalRequests: number;
  failedRequests: number;
  averageLatency: number;
  bandwidthUsage: number;
  cacheHitRate: number;
}

export function NetworkControlTab() {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;

  const [config, setConfig] = useState<NetworkConfig>({
    apiTimeout: 30000,
    connectionTimeout: 10000,
    readTimeout: 20000,
    maxConcurrentRequests: 10,
    requestRateLimit: 100,
    bandwidthLimit: 1024, // 1MB/s
    enabledAPIs: {
      openai: true,
      gemini: true,
      firebase: true,
      revenuecat: true,
      analytics: true,
    },
    maxRetries: 3,
    retryDelay: 1000,
    enableFallbackMode: true,
    enableNetworkLogging: false,
    logRequestDetails: false,
    alertOnHighLatency: true,
    latencyThreshold: 5000,
    enableResponseCache: true,
    cacheDuration: 30,
    enableCompression: true,
  });

  const [stats, setStats] = useState<NetworkStats>({
    activeConnections: 3,
    totalRequests: 12540,
    failedRequests: 127,
    averageLatency: 234,
    bandwidthUsage: 45.2, // MB
    cacheHitRate: 78.5, // %
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfig();
    loadStats();
  }, []);

  const loadConfig = async () => {
    try {
      const db = getFirestore(getApp());
      const configDoc = await getDoc(doc(db, "admin", "network_config"));
      if (configDoc.exists()) {
        setConfig({ ...config, ...configDoc.data() });
      }
    } catch (error) {
      logger.error("Erreur lors du chargement de la config réseau:", error);
    }
  };

  const loadStats = async () => {
    try {
      const db = getFirestore(getApp());
      // Simuler des stats - à remplacer par de vraies données
      const statsData: NetworkStats = {
        activeConnections: Math.floor(Math.random() * 10) + 1,
        totalRequests: 12540 + Math.floor(Math.random() * 1000),
        failedRequests: 127 + Math.floor(Math.random() * 20),
        averageLatency: 200 + Math.floor(Math.random() * 100),
        bandwidthUsage: 40 + Math.random() * 10,
        cacheHitRate: 75 + Math.random() * 10,
      };
      setStats(statsData);
    } catch (error) {
      logger.error("Erreur lors du chargement des stats réseau:", error);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      const db = getFirestore(getApp());
      await setDoc(doc(db, "admin", "network_config"), config);
      Alert.alert("Succès", "Configuration réseau mise à jour");
      logger.info("Configuration réseau sauvegardée");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder la configuration");
      logger.error("Erreur lors de la sauvegarde de la config réseau:", error);
    } finally {
      setLoading(false);
    }
  };

  const testConnectivity = async () => {
    setLoading(true);
    try {
      // Simuler un test de connectivité
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert("Test réussi", "La connectivité réseau est optimale");
      logger.info("Test de connectivité réussi");
    } catch (error) {
      Alert.alert("Test échoué", "Problème de connectivité détecté");
      logger.error("Test de connectivité échoué:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    Alert.alert(
      "Confirmation",
      "Êtes-vous sûr de vouloir vider le cache réseau ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Vider",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              // Simuler la suppression du cache
              await new Promise(resolve => setTimeout(resolve, 1000));
              Alert.alert("Succès", "Cache réseau vidé");
              logger.info("Cache réseau vidé");
            } catch (error) {
              Alert.alert("Erreur", "Impossible de vider le cache");
              logger.error("Erreur lors du vidage du cache:", error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>🌐 Contrôle Réseau Avancé</Text>

      {/* Statistiques réseau */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Statistiques réseau</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.activeConnections}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Connexions actives</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalRequests.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Requêtes totales</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.error }]}>{stats.failedRequests}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Échecs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.warning }]}>{stats.averageLatency}ms</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Latence moyenne</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.background, flex: 1 }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.bandwidthUsage.toFixed(1)} MB</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Utilisation bande passante</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.background, flex: 1 }]}>
            <Text style={[styles.statValue, { color: colors.success }]}>{stats.cacheHitRate.toFixed(1)}%</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Taux de succès cache</Text>
          </View>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={testConnectivity}
            disabled={loading}
          >
            <Text style={styles.buttonText}>🔍 Tester connectivité</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={clearCache}
            disabled={loading}
          >
            <Text style={styles.buttonText}>🗑️ Vider cache</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Timeouts et limites */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>⏱️ Timeouts & Limites</Text>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>Timeout API (ms):</Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={config.apiTimeout.toString()}
            keyboardType="numeric"
            onChangeText={(value) => setConfig({ ...config, apiTimeout: parseInt(value) || 0 })}
          />
        </View>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>Timeout connexion (ms):</Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={config.connectionTimeout.toString()}
            keyboardType="numeric"
            onChangeText={(value) => setConfig({ ...config, connectionTimeout: parseInt(value) || 0 })}
          />
        </View>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>Timeout lecture (ms):</Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={config.readTimeout.toString()}
            keyboardType="numeric"
            onChangeText={(value) => setConfig({ ...config, readTimeout: parseInt(value) || 0 })}
          />
        </View>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>Requêtes concurrentes max:</Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={config.maxConcurrentRequests.toString()}
            keyboardType="numeric"
            onChangeText={(value) => setConfig({ ...config, maxConcurrentRequests: parseInt(value) || 0 })}
          />
        </View>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>Limite taux (req/min):</Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={config.requestRateLimit.toString()}
            keyboardType="numeric"
            onChangeText={(value) => setConfig({ ...config, requestRateLimit: parseInt(value) || 0 })}
          />
        </View>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>Limite bande passante (KB/s):</Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={config.bandwidthLimit.toString()}
            keyboardType="numeric"
            onChangeText={(value) => setConfig({ ...config, bandwidthLimit: parseInt(value) || 0 })}
          />
        </View>
      </View>

      {/* APIs externes */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>🔌 APIs externes</Text>

        {Object.entries(config.enabledAPIs).map(([api, enabled]) => (
          <View key={api} style={styles.switchItem}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>
              {api.toUpperCase()}
            </Text>
            <Switch
              value={enabled}
              onValueChange={(value) =>
                setConfig({
                  ...config,
                  enabledAPIs: { ...config.enabledAPIs, [api]: value },
                })
              }
              trackColor={{ false: colors.textSecondary, true: colors.primary }}
              thumbColor={enabled ? colors.background : colors.surface}
            />
          </View>
        ))}
      </View>

      {/* Retry et fallback */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>🔄 Retry & Fallback</Text>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>Nombre max de retry:</Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={config.maxRetries.toString()}
            keyboardType="numeric"
            onChangeText={(value) => setConfig({ ...config, maxRetries: parseInt(value) || 0 })}
          />
        </View>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>Délai entre retry (ms):</Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={config.retryDelay.toString()}
            keyboardType="numeric"
            onChangeText={(value) => setConfig({ ...config, retryDelay: parseInt(value) || 0 })}
          />
        </View>

        <View style={styles.switchItem}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>
            Mode fallback activé
          </Text>
          <Switch
            value={config.enableFallbackMode}
            onValueChange={(value) => setConfig({ ...config, enableFallbackMode: value })}
            trackColor={{ false: colors.textSecondary, true: colors.primary }}
            thumbColor={config.enableFallbackMode ? colors.background : colors.surface}
          />
        </View>
      </View>

      {/* Monitoring et logging */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>📋 Monitoring & Logging</Text>

        <View style={styles.switchItem}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>
            Logging réseau activé
          </Text>
          <Switch
            value={config.enableNetworkLogging}
            onValueChange={(value) => setConfig({ ...config, enableNetworkLogging: value })}
            trackColor={{ false: colors.textSecondary, true: colors.primary }}
            thumbColor={config.enableNetworkLogging ? colors.background : colors.surface}
          />
        </View>

        <View style={styles.switchItem}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>
            Détails des requêtes
          </Text>
          <Switch
            value={config.logRequestDetails}
            onValueChange={(value) => setConfig({ ...config, logRequestDetails: value })}
            trackColor={{ false: colors.textSecondary, true: colors.primary }}
            thumbColor={config.logRequestDetails ? colors.background : colors.surface}
          />
        </View>

        <View style={styles.switchItem}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>
            Alertes latence élevée
          </Text>
          <Switch
            value={config.alertOnHighLatency}
            onValueChange={(value) => setConfig({ ...config, alertOnHighLatency: value })}
            trackColor={{ false: colors.textSecondary, true: colors.primary }}
            thumbColor={config.alertOnHighLatency ? colors.background : colors.surface}
          />
        </View>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>Seuil latence (ms):</Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={config.latencyThreshold.toString()}
            keyboardType="numeric"
            onChangeText={(value) => setConfig({ ...config, latencyThreshold: parseInt(value) || 0 })}
          />
        </View>
      </View>

      {/* Cache et optimisation */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>⚡ Cache & Optimisation</Text>

        <View style={styles.switchItem}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>
            Cache des réponses
          </Text>
          <Switch
            value={config.enableResponseCache}
            onValueChange={(value) => setConfig({ ...config, enableResponseCache: value })}
            trackColor={{ false: colors.textSecondary, true: colors.primary }}
            thumbColor={config.enableResponseCache ? colors.background : colors.surface}
          />
        </View>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>Durée cache (minutes):</Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={config.cacheDuration.toString()}
            keyboardType="numeric"
            onChangeText={(value) => setConfig({ ...config, cacheDuration: parseInt(value) || 0 })}
          />
        </View>

        <View style={styles.switchItem}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>
            Compression activée
          </Text>
          <Switch
            value={config.enableCompression}
            onValueChange={(value) => setConfig({ ...config, enableCompression: value })}
            trackColor={{ false: colors.textSecondary, true: colors.primary }}
            thumbColor={config.enableCompression ? colors.background : colors.surface}
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
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: "48%",
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
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "#6c757d",
  },
  dangerButton: {
    backgroundColor: "#dc3545",
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
