/**
 * Onglet de gestion avancée des données
 * Permet aux administrateurs de gérer les exports, imports, backups et nettoyage
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
  TextInput,
} from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { createLogger } from "../../../../utils/optimizedLogger";
import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  limit as limitQuery,
  orderBy,
} from "@react-native-firebase/firestore";

const logger = createLogger("DataManagementTab");

interface DataStats {
  totalUsers: number;
  totalScripts: number;
  totalRecordings: number;
  totalStorageUsed: number; // MB
  lastBackupDate: string;
  databaseSize: number; // MB
}

interface BackupConfig {
  autoBackup: boolean;
  backupFrequency: "daily" | "weekly" | "monthly";
  backupRetention: number; // jours
  includeFiles: boolean;
  compressBackups: boolean;
  encryptBackups: boolean;
}

export function DataManagementTab() {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;

  const [stats, setStats] = useState<DataStats>({
    totalUsers: 0,
    totalScripts: 0,
    totalRecordings: 0,
    totalStorageUsed: 0,
    lastBackupDate: "2024-01-15",
    databaseSize: 0,
  });

  const [backupConfig, setBackupConfig] = useState<BackupConfig>({
    autoBackup: true,
    backupFrequency: "daily",
    backupRetention: 30,
    includeFiles: true,
    compressBackups: true,
    encryptBackups: true,
  });

  const [loading, setLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  useEffect(() => {
    loadDataStats();
    loadBackupConfig();
  }, []);

  const loadDataStats = async () => {
    try {
      const db = getFirestore(getApp());

      // Simuler le chargement des stats - à remplacer par de vraies requêtes
      const statsData: DataStats = {
        totalUsers: 1250,
        totalScripts: 5420,
        totalRecordings: 2890,
        totalStorageUsed: 45.2,
        lastBackupDate: "2024-01-15 14:30",
        databaseSize: 234.8,
      };

      setStats(statsData);
      logger.info("Statistiques de données chargées");
    } catch (error) {
      logger.error("Erreur lors du chargement des statistiques:", error);
    }
  };

  const loadBackupConfig = async () => {
    try {
      // Simuler le chargement de la config - à remplacer par de vraies données
      logger.info("Configuration de backup chargée");
    } catch (error) {
      logger.error("Erreur lors du chargement de la config backup:", error);
    }
  };

  const exportDatabase = async () => {
    Alert.alert(
      "Export de base de données",
      "Êtes-vous sûr de vouloir exporter toute la base de données ? Cette opération peut prendre plusieurs minutes.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Exporter",
          style: "default",
          onPress: async () => {
            setLoading(true);
            setExportProgress(0);

            try {
              // Simuler l'export
              for (let i = 0; i <= 100; i += 10) {
                setExportProgress(i);
                await new Promise(resolve => setTimeout(resolve, 200));
              }

              Alert.alert("Succès", "Base de données exportée avec succès");
              logger.info("Export de base de données terminé");
            } catch (error) {
              Alert.alert("Erreur", "Échec de l'export de la base de données");
              logger.error("Erreur lors de l'export:", error);
            } finally {
              setLoading(false);
              setExportProgress(0);
            }
          },
        },
      ]
    );
  };

  const createBackup = async () => {
    setLoading(true);
    try {
      // Simuler la création d'un backup
      await new Promise(resolve => setTimeout(resolve, 3000));

      const backupDate = new Date().toISOString().split('T')[0];
      Alert.alert("Succès", `Backup créé avec succès le ${backupDate}`);
      logger.info("Backup créé avec succès");

      // Recharger les stats
      await loadDataStats();
    } catch (error) {
      Alert.alert("Erreur", "Échec de la création du backup");
      logger.error("Erreur lors de la création du backup:", error);
    } finally {
      setLoading(false);
    }
  };

  const restoreFromBackup = () => {
    Alert.alert(
      "Restauration de backup",
      "⚠️ Cette action va remplacer toutes les données actuelles. Êtes-vous sûr ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Restaurer",
          style: "destructive",
          onPress: () => {
            // Logique de restauration à implémenter
            Alert.alert("Info", "Fonctionnalité de restauration à implémenter");
          },
        },
      ]
    );
  };

  const cleanOldData = () => {
    Alert.alert(
      "Nettoyage des données",
      "Cela va supprimer les données temporaires et les fichiers inutiles. Continuer ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Nettoyer",
          style: "default",
          onPress: async () => {
            setLoading(true);
            try {
              // Simuler le nettoyage
              await new Promise(resolve => setTimeout(resolve, 2000));

              Alert.alert("Succès", "Données nettoyées avec succès");
              logger.info("Nettoyage des données terminé");

              // Recharger les stats
              await loadDataStats();
            } catch (error) {
              Alert.alert("Erreur", "Erreur lors du nettoyage");
              logger.error("Erreur lors du nettoyage:", error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const anonymizeData = () => {
    Alert.alert(
      "Anonymisation des données",
      "⚠️ Cette action va anonymiser toutes les données utilisateur. Cette action est irréversible !",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Anonymiser",
          style: "destructive",
          onPress: () => {
            // Logique d'anonymisation à implémenter
            Alert.alert("Info", "Fonctionnalité d'anonymisation à implémenter");
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>💾 Gestion des Données</Text>

      {/* Statistiques des données */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Statistiques des données</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalUsers.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Utilisateurs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalScripts.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Scripts</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalRecordings.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Enregistrements</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalStorageUsed.toFixed(1)} MB</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Stockage utilisé</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.databaseSize.toFixed(1)} MB</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Taille DB</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.info }]}>{stats.lastBackupDate}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Dernier backup</Text>
          </View>
        </View>
      </View>

      {/* Export et backup */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>📤 Export & Backup</Text>

        {exportProgress > 0 && (
          <View style={styles.progressContainer}>
            <Text style={[styles.progressText, { color: colors.text }]}>
              Export en cours: {exportProgress}%
            </Text>
            <View style={[styles.progressBar, { backgroundColor: colors.background }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: colors.primary, width: `${exportProgress}%` },
                ]}
              />
            </View>
          </View>
        )}

        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={exportDatabase}
            disabled={loading}
          >
            <Text style={styles.buttonText}>📤 Exporter DB</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.successButton, loading && styles.buttonDisabled]}
            onPress={createBackup}
            disabled={loading}
          >
            <Text style={styles.buttonText}>💾 Créer Backup</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.warningButton]}
            onPress={restoreFromBackup}
          >
            <Text style={styles.buttonText}>🔄 Restaurer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.infoButton]}
            onPress={cleanOldData}
            disabled={loading}
          >
            <Text style={styles.buttonText}>🧹 Nettoyer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Configuration des backups */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>⚙️ Configuration Backup</Text>

        <View style={styles.switchItem}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>
            Backup automatique
          </Text>
          <Text
            style={[
              styles.switchValue,
              { color: backupConfig.autoBackup ? colors.success : colors.error },
            ]}
          >
            {backupConfig.autoBackup ? "Activé" : "Désactivé"}
          </Text>
        </View>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>Fréquence de backup:</Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={backupConfig.backupFrequency}
            onChangeText={(value: any) => setBackupConfig({ ...backupConfig, backupFrequency: value })}
          />
        </View>

        <View style={styles.configItem}>
          <Text style={[styles.configLabel, { color: colors.text }]}>Rétention (jours):</Text>
          <TextInput
            style={[styles.configInput, { backgroundColor: colors.background, color: colors.text }]}
            value={backupConfig.backupRetention.toString()}
            keyboardType="numeric"
            onChangeText={(value) => setBackupConfig({ ...backupConfig, backupRetention: parseInt(value) || 30 })}
          />
        </View>

        <View style={styles.switchItem}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>
            Inclure les fichiers
          </Text>
          <Text
            style={[
              styles.switchValue,
              { color: backupConfig.includeFiles ? colors.success : colors.textSecondary },
            ]}
          >
            {backupConfig.includeFiles ? "Oui" : "Non"}
          </Text>
        </View>

        <View style={styles.switchItem}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>
            Compression activée
          </Text>
          <Text
            style={[
              styles.switchValue,
              { color: backupConfig.compressBackups ? colors.success : colors.textSecondary },
            ]}
          >
            {backupConfig.compressBackups ? "Oui" : "Non"}
          </Text>
        </View>

        <View style={styles.switchItem}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>
            Chiffrement activé
          </Text>
          <Text
            style={[
              styles.switchValue,
              { color: backupConfig.encryptBackups ? colors.success : colors.error },
            ]}
          >
            {backupConfig.encryptBackups ? "Oui" : "Non"}
          </Text>
        </View>
      </View>

      {/* Actions dangereuses */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>⚠️ Actions dangereuses</Text>
        <Text style={[styles.warningText, { color: colors.error }]}>
          Ces actions peuvent causer une perte de données irréversible
        </Text>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={anonymizeData}
        >
          <Text style={styles.buttonText}>🔒 Anonymiser données</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={() => Alert.alert("Info", "Fonctionnalité de suppression complète à implémenter")}
        >
          <Text style={styles.buttonText}>🗑️ Supprimer toutes les données</Text>
        </TouchableOpacity>
      </View>

      {/* Informations système */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>ℹ️ Informations système</Text>

        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: colors.text }]}>Version base de données:</Text>
          <Text style={[styles.infoValue, { color: colors.textSecondary }]}>Firestore v9</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: colors.text }]}>Région:</Text>
          <Text style={[styles.infoValue, { color: colors.textSecondary }]}>europe-west1</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: colors.text }]}>Mode de sauvegarde:</Text>
          <Text style={[styles.infoValue, { color: colors.textSecondary }]}>Automatique</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: colors.text }]}>Dernière optimisation:</Text>
          <Text style={[styles.infoValue, { color: colors.textSecondary }]}>2024-01-15 08:00</Text>
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
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionButton: {
    width: "48%",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#007bff",
  },
  successButton: {
    backgroundColor: "#28a745",
  },
  warningButton: {
    backgroundColor: "#ffc107",
  },
  infoButton: {
    backgroundColor: "#17a2b8",
  },
  dangerButton: {
    backgroundColor: "#dc3545",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: "center",
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
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
  switchValue: {
    fontSize: 14,
    fontWeight: "bold",
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
  warningText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
});
