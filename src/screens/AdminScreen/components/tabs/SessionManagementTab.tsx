/**
 * Onglet de gestion de session dans l'écran Admin
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
} from "react-native";
import { useAuth } from "../../../../contexts/AuthContext";
import { SESSION_CONFIG, SessionConfig } from "../../../../config/sessionConfig";
import { sessionManager } from "../../../../services/SessionManager";
import { createLogger } from "../../../../utils/optimizedLogger";

const logger = createLogger("SessionManagementTab");

interface SessionStats {
  isValid: boolean;
  daysSinceLogin: number;
  hoursSinceActivity: number;
  sessionData: any;
}

export function SessionManagementTab() {
  const { user } = useAuth();
  const [config, setConfig] = useState<SessionConfig>(SESSION_CONFIG);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSessionStats();
  }, []);

  const loadSessionStats = async () => {
    try {
      const sessionStats = await sessionManager.getSessionStats();
      setStats(sessionStats);
    } catch (error) {
      logger.error("Erreur lors du chargement des stats de session:", error);
    }
  };

  const updateConfig = async (newConfig: Partial<SessionConfig>) => {
    setLoading(true);
    try {
      // Ici vous pourriez sauvegarder la configuration dans AsyncStorage
      // ou dans Firestore selon vos besoins

      setConfig({ ...config, ...newConfig });
      Alert.alert("Succès", "Configuration mise à jour");
      logger.info("Configuration de session mise à jour", newConfig);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de mettre à jour la configuration");
      logger.error("Erreur lors de la mise à jour de la configuration:", error);
    } finally {
      setLoading(false);
    }
  };

  const forceSessionRefresh = async () => {
    setLoading(true);
    try {
      const extended = await sessionManager.extendSession();
      if (extended) {
        Alert.alert("Succès", "Session prolongée");
        await loadSessionStats();
      } else {
        Alert.alert("Erreur", "Impossible de prolonger la session");
      }
    } catch (error) {
      Alert.alert("Erreur", "Erreur lors du refresh de session");
      logger.error("Erreur lors du refresh de session:", error);
    } finally {
      setLoading(false);
    }
  };

  const terminateUserSession = async () => {
    Alert.alert(
      "Confirmation",
      "Êtes-vous sûr de vouloir terminer la session de cet utilisateur ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Terminer",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await sessionManager.terminateSession();
              Alert.alert("Succès", "Session terminée");
              await loadSessionStats();
            } catch (error) {
              Alert.alert("Erreur", "Impossible de terminer la session");
              logger.error("Erreur lors de la terminaison de la session:", error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Utilisateur non connecté</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Gestion de Session</Text>

      {/* Statistiques de session */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Statistiques de Session</Text>
        {stats ? (
          <View style={styles.statsContainer}>
            <Text style={styles.statItem}>✅ Session valide: {stats.isValid ? "Oui" : "Non"}</Text>
            <Text style={styles.statItem}>📅 Jours depuis connexion: {stats.daysSinceLogin}</Text>
            <Text style={styles.statItem}>⏰ Heures depuis activité: {stats.hoursSinceActivity}</Text>
            <Text style={styles.statItem}>👤 User ID: {stats.sessionData?.userId || "N/A"}</Text>
          </View>
        ) : (
          <Text style={styles.loadingText}>Chargement des statistiques...</Text>
        )}
      </View>

      {/* Configuration de session */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Configuration de Session</Text>

        <View style={styles.configItem}>
          <Text style={styles.configLabel}>Durée d'expiration (jours):</Text>
          <TextInput
            style={styles.configInput}
            value={config.sessionExpiryDays.toString()}
            keyboardType="numeric"
            onChangeText={(value) => {
              const days = parseInt(value) || 7;
              setConfig({ ...config, sessionExpiryDays: days });
            }}
          />
        </View>

        <View style={styles.configItem}>
          <Text style={styles.configLabel}>Intervalle de vérification (minutes):</Text>
          <TextInput
            style={styles.configInput}
            value={config.sessionCheckIntervalMinutes.toString()}
            keyboardType="numeric"
            onChangeText={(value) => {
              const minutes = parseInt(value) || 15;
              setConfig({ ...config, sessionCheckIntervalMinutes: minutes });
            }}
          />
        </View>

        <View style={styles.configItem}>
          <Text style={styles.configLabel}>Avertissement d'inactivité (minutes):</Text>
          <TextInput
            style={styles.configInput}
            value={config.inactivityWarningMinutes.toString()}
            keyboardType="numeric"
            onChangeText={(value) => {
              const minutes = parseInt(value) || 60;
              setConfig({ ...config, inactivityWarningMinutes: minutes });
            }}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => updateConfig(config)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>💾 Sauvegarder Configuration</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Actions de session */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Actions de Session</Text>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, loading && styles.buttonDisabled]}
          onPress={forceSessionRefresh}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🔄 Forcer Refresh Token</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton, loading && styles.buttonDisabled]}
          onPress={terminateUserSession}
          disabled={loading}
        >
          <Text style={styles.buttonText}>⏹️ Terminer Session</Text>
        </TouchableOpacity>
      </View>

      {/* Informations sur la configuration actuelle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ Configuration Actuelle</Text>
        <Text style={styles.infoText}>
          • Expiration après inactivité: {config.sessionExpiryDays} jours
        </Text>
        <Text style={styles.infoText}>
          • Vérification toutes les: {config.sessionCheckIntervalMinutes} minutes
        </Text>
        <Text style={styles.infoText}>
          • Avertissement après: {config.inactivityWarningMinutes} minutes
        </Text>
        <Text style={styles.infoText}>
          • Prolongation automatique: {config.autoExtendSession ? "Activée" : "Désactivée"}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 24,
    textAlign: "center",
  },
  section: {
    backgroundColor: "white",
    borderRadius: 8,
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
    color: "#333",
    marginBottom: 16,
  },
  statsContainer: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 6,
  },
  statItem: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  configItem: {
    marginBottom: 16,
  },
  configLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  configInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
  },
  button: {
    backgroundColor: "#007bff",
    padding: 14,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: "#28a745",
  },
  dangerButton: {
    backgroundColor: "#dc3545",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 18,
    color: "#dc3545",
    textAlign: "center",
    marginTop: 50,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
});
