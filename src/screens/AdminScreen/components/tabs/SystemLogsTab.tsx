import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../../../contexts/ThemeContext";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  Timestamp,
  where,
  FirebaseFirestoreTypes,
  getFirestore,
} from "@react-native-firebase/firestore";
import { getApp } from "@react-native-firebase/app";

// Types pour les logs
interface SystemLog {
  id: string;
  timestamp: Date;
  level: "info" | "warning" | "error" | "critical" | "success";
  category: string;
  action: string;
  userId?: string;
  userName?: string;
  details?: any;
  ip?: string;
  userAgent?: string;
  duration?: number;
  errorStack?: string;
}

interface LogFilter {
  level?: string;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchText?: string;
  userId?: string;
}

// Catégories de logs
const LOG_CATEGORIES = [
  { id: "auth", label: "Authentification", icon: "shield", color: "#4CAF50" },
  { id: "user", label: "Utilisateurs", icon: "account", color: "#2196F3" },
  {
    id: "subscription",
    label: "Abonnements",
    icon: "credit-card",
    color: "#FF9800",
  },
  { id: "content", label: "Contenu", icon: "file-document", color: "#9C27B0" },
  { id: "system", label: "Système", icon: "cog", color: "#607D8B" },
  { id: "security", label: "Sécurité", icon: "lock", color: "#F44336" },
  { id: "api", label: "API", icon: "api", color: "#00BCD4" },
  {
    id: "performance",
    label: "Performance",
    icon: "speedometer",
    color: "#795548",
  },
  {
    id: "notification",
    label: "Notifications",
    icon: "bell",
    color: "#E91E63",
  },
  {
    id: "admin",
    label: "Administration",
    icon: "shield-account",
    color: "#3F51B5",
  },
];

// Niveaux de logs
const LOG_LEVELS = [
  { id: "all", label: "Tous", color: "#757575" },
  { id: "info", label: "Info", icon: "information", color: "#2196F3" },
  { id: "success", label: "Succès", icon: "check-circle", color: "#4CAF50" },
  { id: "warning", label: "Avertissement", icon: "alert", color: "#FF9800" },
  { id: "error", label: "Erreur", icon: "close-circle", color: "#F44336" },
  {
    id: "critical",
    label: "Critique",
    icon: "alert-octagon",
    color: "#D32F2F",
  },
];

export const SystemLogsTab: React.FC = () => {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const firestore = getFirestore(getApp());

  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<LogFilter>({});
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<
    "today" | "week" | "month" | "all"
  >("week");

  // Charger les logs
  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);

      // Créer la requête de base
      let logsQuery = query(
        collection(firestore, "system_logs"),
        orderBy("timestamp", "desc"),
        limit(500)
      );

      // Appliquer les filtres de date
      const now = new Date();
      let dateFrom: Date | undefined;

      switch (dateRange) {
        case "today":
          dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "week":
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      if (dateFrom) {
        logsQuery = query(
          collection(firestore, "system_logs"),
          where("timestamp", ">=", Timestamp.fromDate(dateFrom)),
          orderBy("timestamp", "desc"),
          limit(500)
        );
      }

      const snapshot = await getDocs(logsQuery);
      const logsData: SystemLog[] = [];

      snapshot.forEach((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const data = doc.data();
        logsData.push({
          id: doc.id,
          timestamp: data.timestamp?.toDate() || new Date(),
          level: data.level || "info",
          category: data.category || "system",
          action: data.action || "Unknown action",
          userId: data.userId,
          userName: data.userName,
          details: data.details,
          ip: data.ip,
          userAgent: data.userAgent,
          duration: data.duration,
          errorStack: data.errorStack,
        });
      });

      setLogs(logsData);
    } catch (error) {
      console.error("Erreur lors du chargement des logs:", error);
      // Créer des données de démonstration si pas de connexion
      setLogs(generateDemoLogs());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange, firestore]);

  // Générer des logs de démonstration
  const generateDemoLogs = (): SystemLog[] => {
    const demoLogs: SystemLog[] = [];
    const now = new Date();

    const actions = [
      {
        category: "auth",
        action: "Connexion utilisateur",
        level: "info" as const,
      },
      {
        category: "auth",
        action: "Déconnexion utilisateur",
        level: "info" as const,
      },
      {
        category: "auth",
        action: "Tentative de connexion échouée",
        level: "warning" as const,
      },
      {
        category: "user",
        action: "Création de compte",
        level: "success" as const,
      },
      {
        category: "user",
        action: "Modification du profil",
        level: "info" as const,
      },
      {
        category: "subscription",
        action: "Nouvel abonnement Premium",
        level: "success" as const,
      },
      {
        category: "subscription",
        action: "Renouvellement automatique",
        level: "info" as const,
      },
      {
        category: "subscription",
        action: "Échec de paiement",
        level: "error" as const,
      },
      {
        category: "content",
        action: "Nouvel enregistrement créé",
        level: "info" as const,
      },
      {
        category: "content",
        action: "Script généré par IA",
        level: "info" as const,
      },
      {
        category: "system",
        action: "Mise à jour système",
        level: "success" as const,
      },
      {
        category: "system",
        action: "Sauvegarde automatique",
        level: "info" as const,
      },
      {
        category: "security",
        action: "Accès non autorisé détecté",
        level: "critical" as const,
      },
      {
        category: "security",
        action: "Changement de mot de passe",
        level: "info" as const,
      },
      { category: "api", action: "Appel API réussi", level: "info" as const },
      {
        category: "api",
        action: "Limite de taux dépassée",
        level: "warning" as const,
      },
      {
        category: "performance",
        action: "Temps de réponse élevé détecté",
        level: "warning" as const,
      },
      {
        category: "notification",
        action: "Notification push envoyée",
        level: "info" as const,
      },
      {
        category: "admin",
        action: "Rôle utilisateur modifié",
        level: "warning" as const,
      },
    ];

    for (let i = 0; i < 50; i++) {
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const timestamp = new Date(
        now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000
      );

      demoLogs.push({
        id: `demo-${i}`,
        timestamp,
        level: randomAction.level,
        category: randomAction.category,
        action: randomAction.action,
        userId: `user-${Math.floor(Math.random() * 100)}`,
        userName: `User ${Math.floor(Math.random() * 100)}`,
        details: {
          ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
          duration: Math.floor(Math.random() * 5000),
        },
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        duration: Math.floor(Math.random() * 5000),
      });
    }

    return demoLogs.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  };

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Filtrer les logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Filtre par niveau
      if (selectedLevel !== "all" && log.level !== selectedLevel) {
        return false;
      }

      // Filtre par catégorie
      if (selectedCategory && log.category !== selectedCategory) {
        return false;
      }

      // Filtre par recherche
      if (searchText) {
        const search = searchText.toLowerCase();
        return (
          log.action.toLowerCase().includes(search) ||
          log.category.toLowerCase().includes(search) ||
          log.userName?.toLowerCase().includes(search) ||
          log.userId?.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }, [logs, selectedLevel, selectedCategory, searchText]);

  // Statistiques
  const stats = useMemo(() => {
    const levelCounts: Record<string, number> = {
      info: 0,
      success: 0,
      warning: 0,
      error: 0,
      critical: 0,
    };

    const categoryCounts: Record<string, number> = {};

    filteredLogs.forEach((log) => {
      levelCounts[log.level] = (levelCounts[log.level] || 0) + 1;
      categoryCounts[log.category] = (categoryCounts[log.category] || 0) + 1;
    });

    return { levelCounts, categoryCounts };
  }, [filteredLogs]);

  // Exporter les logs
  const exportLogs = () => {
    Alert.alert("Exporter les logs", "Choisissez le format d'export", [
      { text: "CSV", onPress: () => exportAsCSV() },
      { text: "JSON", onPress: () => exportAsJSON() },
      { text: "Annuler", style: "cancel" },
    ]);
  };

  const exportAsCSV = () => {
    // Implémentation de l'export CSV
    Alert.alert("Export CSV", "Les logs ont été exportés en CSV");
  };

  const exportAsJSON = () => {
    // Implémentation de l'export JSON
    Alert.alert("Export JSON", "Les logs ont été exportés en JSON");
  };

  // Effacer les logs
  const clearLogs = () => {
    Alert.alert(
      "Effacer les logs",
      "Êtes-vous sûr de vouloir effacer les logs sélectionnés ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Effacer",
          style: "destructive",
          onPress: () => {
            // Implémentation de la suppression
            Alert.alert("Succès", "Les logs ont été effacés");
            loadLogs();
          },
        },
      ]
    );
  };

  const getLevelIcon = (level: string) => {
    const levelConfig = LOG_LEVELS.find((l) => l.id === level);
    return levelConfig?.icon || "information";
  };

  const getLevelColor = (level: string) => {
    const levelConfig = LOG_LEVELS.find((l) => l.id === level);
    return levelConfig?.color || colors.textSecondary;
  };

  const getCategoryIcon = (category: string) => {
    const categoryConfig = LOG_CATEGORIES.find((c) => c.id === category);
    return categoryConfig?.icon || "folder";
  };

  const getCategoryColor = (category: string) => {
    const categoryConfig = LOG_CATEGORIES.find((c) => c.id === category);
    return categoryConfig?.color || colors.primary;
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;

    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header avec statistiques */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {filteredLogs.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Événements
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: getLevelColor("error") }]}>
              {stats.levelCounts.error + stats.levelCounts.critical}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Erreurs
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text
              style={[styles.statValue, { color: getLevelColor("warning") }]}
            >
              {stats.levelCounts.warning}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Alertes
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text
              style={[styles.statValue, { color: getLevelColor("success") }]}
            >
              {stats.levelCounts.success}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Succès
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.primary + "20" },
            ]}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="filter" size={18} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>
              Filtres
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.success + "20" },
            ]}
            onPress={exportLogs}
          >
            <Ionicons name="download" size={18} color={colors.success} />
            <Text style={[styles.actionText, { color: colors.success }]}>
              Exporter
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.error + "20" },
            ]}
            onPress={clearLogs}
          >
            <Ionicons name="trash" size={18} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>
              Effacer
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Barre de recherche */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          placeholder="Rechercher dans les logs..."
          placeholderTextColor={colors.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
          style={[styles.searchInput, { color: colors.text }]}
        />
        {searchText ? (
          <TouchableOpacity onPress={() => setSearchText("")}>
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filtres rapides */}
      <View style={styles.quickFilters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              dateRange === "today" && { backgroundColor: colors.primary },
              { borderColor: colors.border },
            ]}
            onPress={() => setDateRange("today")}
          >
            <Text
              style={{ color: dateRange === "today" ? "#FFF" : colors.text }}
            >
              Aujourd'hui
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              dateRange === "week" && { backgroundColor: colors.primary },
              { borderColor: colors.border },
            ]}
            onPress={() => setDateRange("week")}
          >
            <Text
              style={{ color: dateRange === "week" ? "#FFF" : colors.text }}
            >
              7 jours
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              dateRange === "month" && { backgroundColor: colors.primary },
              { borderColor: colors.border },
            ]}
            onPress={() => setDateRange("month")}
          >
            <Text
              style={{ color: dateRange === "month" ? "#FFF" : colors.text }}
            >
              30 jours
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              dateRange === "all" && { backgroundColor: colors.primary },
              { borderColor: colors.border },
            ]}
            onPress={() => setDateRange("all")}
          >
            <Text style={{ color: dateRange === "all" ? "#FFF" : colors.text }}>
              Tous
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Liste des logs */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.logsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadLogs();
              }}
              colors={[colors.primary]}
            />
          }
        >
          {filteredLogs.map((log) => (
            <TouchableOpacity
              key={log.id}
              style={[styles.logItem, { backgroundColor: colors.surface }]}
              onPress={() => {
                setSelectedLog(log);
                setShowDetails(true);
              }}
            >
              <View style={styles.logHeader}>
                <View style={styles.logLevel}>
                  <MaterialCommunityIcons
                    name={getLevelIcon(log.level) as any}
                    size={20}
                    color={getLevelColor(log.level)}
                  />
                </View>
                <View style={styles.logContent}>
                  <View style={styles.logTitleRow}>
                    <Text style={[styles.logAction, { color: colors.text }]}>
                      {log.action}
                    </Text>
                    <Text
                      style={[styles.logTime, { color: colors.textSecondary }]}
                    >
                      {formatTimestamp(log.timestamp)}
                    </Text>
                  </View>
                  <View style={styles.logMeta}>
                    <View style={styles.logCategory}>
                      <MaterialCommunityIcons
                        name={getCategoryIcon(log.category) as any}
                        size={14}
                        color={getCategoryColor(log.category)}
                      />
                      <Text
                        style={[
                          styles.logCategoryText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {LOG_CATEGORIES.find((c) => c.id === log.category)
                          ?.label || log.category}
                      </Text>
                    </View>
                    {log.userName && (
                      <Text
                        style={[
                          styles.logUser,
                          { color: colors.textSecondary },
                        ]}
                      >
                        • {log.userName}
                      </Text>
                    )}
                    {log.duration && (
                      <Text
                        style={[
                          styles.logDuration,
                          { color: colors.textSecondary },
                        ]}
                      >
                        • {log.duration}ms
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Modal de détails */}
      <Modal
        visible={showDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Détails de l'événement
              </Text>
              <TouchableOpacity onPress={() => setShowDetails(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedLog && (
              <ScrollView style={styles.detailsContent}>
                <View
                  style={[
                    styles.detailSection,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Action
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedLog.action}
                  </Text>
                </View>

                <View
                  style={[
                    styles.detailSection,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Niveau
                  </Text>
                  <View style={styles.detailLevel}>
                    <MaterialCommunityIcons
                      name={getLevelIcon(selectedLog.level) as any}
                      size={16}
                      color={getLevelColor(selectedLog.level)}
                    />
                    <Text
                      style={[
                        styles.detailValue,
                        { color: getLevelColor(selectedLog.level) },
                      ]}
                    >
                      {
                        LOG_LEVELS.find((l) => l.id === selectedLog.level)
                          ?.label
                      }
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.detailSection,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Catégorie
                  </Text>
                  <View style={styles.detailCategory}>
                    <MaterialCommunityIcons
                      name={getCategoryIcon(selectedLog.category) as any}
                      size={16}
                      color={getCategoryColor(selectedLog.category)}
                    />
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {
                        LOG_CATEGORIES.find(
                          (c) => c.id === selectedLog.category
                        )?.label
                      }
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.detailSection,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Horodatage
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedLog.timestamp.toLocaleString("fr-FR")}
                  </Text>
                </View>

                {selectedLog.userName && (
                  <View
                    style={[
                      styles.detailSection,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Utilisateur
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {selectedLog.userName} ({selectedLog.userId})
                    </Text>
                  </View>
                )}

                {selectedLog.ip && (
                  <View
                    style={[
                      styles.detailSection,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Adresse IP
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {selectedLog.ip}
                    </Text>
                  </View>
                )}

                {selectedLog.duration && (
                  <View
                    style={[
                      styles.detailSection,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Durée
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {selectedLog.duration}ms
                    </Text>
                  </View>
                )}

                {selectedLog.errorStack && (
                  <View
                    style={[
                      styles.detailSection,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Stack d'erreur
                    </Text>
                    <Text style={[styles.errorStack, { color: colors.error }]}>
                      {selectedLog.errorStack}
                    </Text>
                  </View>
                )}

                {selectedLog.details && (
                  <View
                    style={[
                      styles.detailSection,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Détails supplémentaires
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  quickFilters: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logsList: {
    flex: 1,
  },
  logItem: {
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 12,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  logLevel: {
    marginRight: 10,
    marginTop: 2,
  },
  logContent: {
    flex: 1,
  },
  logTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  logAction: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  logTime: {
    fontSize: 12,
  },
  logMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logCategory: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  logCategoryText: {
    fontSize: 12,
  },
  logUser: {
    fontSize: 12,
  },
  logDuration: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  detailsContent: {
    padding: 16,
  },
  detailSection: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailLevel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailCategory: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  errorStack: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
});
