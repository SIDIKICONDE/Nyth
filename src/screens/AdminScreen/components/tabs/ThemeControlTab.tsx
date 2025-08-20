/**
 * Onglet de contrôle des thèmes
 * Permet aux administrateurs de gérer les thèmes globaux de l'application
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
  FlatList,
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
  updateDoc,
  deleteDoc,
} from "@react-native-firebase/firestore";

const logger = createLogger("ThemeControlTab");

interface GlobalTheme {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    error: string;
    warning: string;
    success: string;
    info: string;
    border: string;
    shadow: string;
  };
  typography: {
    fontSize: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
    fontWeight: {
      light: string;
      regular: string;
      medium: string;
      semibold: string;
      bold: string;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

interface ThemeStats {
  totalThemes: number;
  activeThemes: number;
  defaultTheme: string;
  totalCustomThemes: number;
  themesLastUpdated: string;
}

const DEFAULT_THEME: Omit<GlobalTheme, 'id' | 'createdAt' | 'updatedAt'> = {
  name: "Thème par défaut",
  description: "Thème par défaut de l'application",
  isActive: true,
  isDefault: true,
  colors: {
    primary: "#007bff",
    secondary: "#6c757d",
    background: "#ffffff",
    surface: "#f8f9fa",
    text: "#212529",
    textSecondary: "#6c757d",
    error: "#dc3545",
    warning: "#ffc107",
    success: "#28a745",
    info: "#17a2b8",
    border: "#dee2e6",
    shadow: "rgba(0, 0, 0, 0.1)",
  },
  typography: {
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
    },
    fontWeight: {
      light: "300",
      regular: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  },
};

export function ThemeControlTab() {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;

  const [themes, setThemes] = useState<GlobalTheme[]>([]);
  const [currentThemeData, setCurrentThemeData] = useState<GlobalTheme | null>(null);
  const [stats, setStats] = useState<ThemeStats>({
    totalThemes: 0,
    activeThemes: 0,
    defaultTheme: "",
    totalCustomThemes: 0,
    themesLastUpdated: "",
  });
  const [loading, setLoading] = useState(false);
  const [editingTheme, setEditingTheme] = useState<GlobalTheme | null>(null);

  useEffect(() => {
    loadThemes();
    loadStats();
  }, []);

  const loadThemes = async () => {
    try {
      const db = getFirestore(getApp());
      const themesQuery = query(
        collection(db, "admin", "themes", "global_themes"),
        orderBy("updatedAt", "desc")
      );
      const querySnapshot = await getDocs(themesQuery);
      const themesData: GlobalTheme[] = [];

      querySnapshot.forEach((doc) => {
        const docData = doc.data() as Omit<GlobalTheme, 'id'>;
        themesData.push({ id: doc.id, ...docData });
      });

      // Si aucun thème, créer le thème par défaut
      if (themesData.length === 0) {
        await createDefaultTheme();
        return loadThemes();
      }

      setThemes(themesData);
      const activeTheme = themesData.find(t => t.isActive);
      setCurrentThemeData(activeTheme || themesData[0]);
    } catch (error) {
      logger.error("Erreur lors du chargement des thèmes:", error);
    }
  };

  const createDefaultTheme = async () => {
    try {
      const db = getFirestore(getApp());
      const now = new Date().toISOString();
      const defaultTheme: Omit<GlobalTheme, 'id'> = {
        ...DEFAULT_THEME,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, "admin", "themes", "global_themes", "default"), defaultTheme);
      logger.info("Thème par défaut créé");
    } catch (error) {
      logger.error("Erreur lors de la création du thème par défaut:", error);
    }
  };

  const loadStats = async () => {
    try {
      const db = getFirestore(getApp());
      
      // Compter les thèmes globaux
      const themesQuery = query(collection(db, "admin", "themes", "global_themes"));
      const themesSnapshot = await getDocs(themesQuery);
      const totalThemes = themesSnapshot.size;
      const activeThemes = themesSnapshot.docs.filter(doc => doc.data().isActive).length;
      const defaultTheme = themesSnapshot.docs.find(doc => doc.data().isDefault)?.data().name || "Aucun";
      
      // Compter les thèmes utilisateur personnalisés
      const customThemesQuery = query(collection(db, "customThemes"));
      const customThemesSnapshot = await getDocs(customThemesQuery);
      const totalCustomThemes = customThemesSnapshot.size;

      const statsData: ThemeStats = {
        totalThemes,
        activeThemes,
        defaultTheme,
        totalCustomThemes,
        themesLastUpdated: new Date().toLocaleDateString(),
      };
      setStats(statsData);
    } catch (error) {
      logger.error("Erreur lors du chargement des statistiques:", error);
      // Fallback stats en cas d'erreur
      setStats({
        totalThemes: 0,
        activeThemes: 0,
        defaultTheme: "Erreur",
        totalCustomThemes: 0,
        themesLastUpdated: "Erreur",
      });
    }
  };

  const saveTheme = async (theme: GlobalTheme) => {
    setLoading(true);
    try {
      const db = getFirestore(getApp());
      const themeData = {
        ...theme,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "admin", "themes", "global_themes", theme.id), themeData);
      Alert.alert("Succès", "Thème sauvegardé avec succès");
      logger.info("Thème sauvegardé:", theme.name);
      await loadThemes();
      setEditingTheme(null);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder le thème");
      logger.error("Erreur lors de la sauvegarde du thème:", error);
    } finally {
      setLoading(false);
    }
  };

  const createNewTheme = () => {
    const newTheme: GlobalTheme = {
      id: `theme_${Date.now()}`,
      name: "Nouveau thème",
      description: "Description du thème",
      isActive: false,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      colors: { ...DEFAULT_THEME.colors },
      typography: { ...DEFAULT_THEME.typography },
      spacing: { ...DEFAULT_THEME.spacing },
      borderRadius: { ...DEFAULT_THEME.borderRadius },
      shadows: { ...DEFAULT_THEME.shadows },
    };
    setEditingTheme(newTheme);
  };

  const setActiveTheme = async (themeId: string) => {
    setLoading(true);
    try {
      const db = getFirestore(getApp());

      // Désactiver tous les thèmes
      for (const theme of themes) {
        await updateDoc(doc(db, "admin", "themes", "global_themes", theme.id), {
          isActive: false,
          updatedAt: new Date().toISOString(),
        });
      }

      // Activer le thème sélectionné
      await updateDoc(doc(db, "admin", "themes", "global_themes", themeId), {
        isActive: true,
        updatedAt: new Date().toISOString(),
      });

      Alert.alert("Succès", "Thème activé avec succès");
      logger.info("Thème activé:", themeId);
      await loadThemes();
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'activer le thème");
      logger.error("Erreur lors de l'activation du thème:", error);
    } finally {
      setLoading(false);
    }
  };

  const setDefaultTheme = async (themeId: string) => {
    setLoading(true);
    try {
      const db = getFirestore(getApp());

      // Retirer le statut par défaut de tous les thèmes
      for (const theme of themes) {
        await updateDoc(doc(db, "admin", "themes", "global_themes", theme.id), {
          isDefault: false,
          updatedAt: new Date().toISOString(),
        });
      }

      // Définir le thème par défaut
      await updateDoc(doc(db, "admin", "themes", "global_themes", themeId), {
        isDefault: true,
        updatedAt: new Date().toISOString(),
      });

      Alert.alert("Succès", "Thème défini par défaut");
      logger.info("Thème par défaut défini:", themeId);
      await loadThemes();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de définir le thème par défaut");
      logger.error("Erreur lors de la définition du thème par défaut:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTheme = async (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;

    if (theme.isDefault) {
      Alert.alert("Erreur", "Impossible de supprimer le thème par défaut");
      return;
    }

    Alert.alert(
      "Confirmation",
      `Êtes-vous sûr de vouloir supprimer le thème "${theme.name}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const db = getFirestore(getApp());
              await deleteDoc(doc(db, "admin", "themes", "global_themes", themeId));
              Alert.alert("Succès", "Thème supprimé");
              logger.info("Thème supprimé:", themeId);
              await loadThemes();
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer le thème");
              logger.error("Erreur lors de la suppression du thème:", error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const duplicateTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;

    const duplicatedTheme: GlobalTheme = {
      ...theme,
      id: `theme_${Date.now()}`,
      name: `${theme.name} (Copie)`,
      isActive: false,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingTheme(duplicatedTheme);
  };

  const renderThemeEditor = () => {
    if (!editingTheme) return null;

    return (
      <View style={[styles.editorContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.editorTitle, { color: colors.text }]}>
          Éditeur de thème: {editingTheme.name}
        </Text>

        <ScrollView style={styles.editorScroll}>
          {/* Informations de base */}
          <View style={styles.editorSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations de base</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              value={editingTheme.name}
              onChangeText={(value) => setEditingTheme({ ...editingTheme, name: value })}
              placeholder="Nom du thème"
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              value={editingTheme.description}
              onChangeText={(value) => setEditingTheme({ ...editingTheme, description: value })}
              placeholder="Description"
              multiline
            />
          </View>

          {/* Couleurs */}
          <View style={styles.editorSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Couleurs principales</Text>
            <View style={styles.colorGrid}>
              {(Object.entries(editingTheme.colors) as [string, string][]).map(([key, value]) => (
                <View key={key} style={styles.colorItem}>
                  <Text style={[styles.colorLabel, { color: colors.text }]}>{key}</Text>
                  <View style={styles.colorInputContainer}>
                    <TextInput
                      style={[styles.colorInput, { backgroundColor: colors.background, color: colors.text }]}
                      value={value}
                      onChangeText={(newValue) =>
                        setEditingTheme({
                          ...editingTheme,
                          colors: { ...editingTheme.colors, [key]: newValue },
                        })
                      }
                    />
                    <View style={[styles.colorPreview, { backgroundColor: value }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.editorActions}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setEditingTheme(null)}
          >
            <Text style={styles.buttonText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => saveTheme(editingTheme)}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Sauvegarder</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* En-tête avec statistiques */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>🎨 Contrôle des Thèmes</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalThemes}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Thèmes totaux</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.activeThemes}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Thèmes actifs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalCustomThemes}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Thèmes utilisateur</Text>
          </View>
        </View>
      </View>

      {editingTheme ? (
        renderThemeEditor()
      ) : (
        <ScrollView style={styles.content}>
          {/* Actions principales */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions principales</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={createNewTheme}
              >
                <Text style={[styles.actionButtonText, { color: colors.background }]}>
                  🆕 Nouveau thème
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Liste des thèmes */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Thèmes disponibles</Text>
            <FlatList
              data={themes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={[styles.themeCard, { backgroundColor: colors.background }]}>
                  <View style={styles.themeHeader}>
                    <View>
                      <Text style={[styles.themeName, { color: colors.text }]}>
                        {item.name}
                        {item.isDefault && <Text style={{ color: colors.primary }}> ⭐</Text>}
                        {item.isActive && <Text style={{ color: colors.success }}> ✅</Text>}
                      </Text>
                      <Text style={[styles.themeDescription, { color: colors.textSecondary }]}>
                        {item.description}
                      </Text>
                    </View>
                    <View style={styles.themeBadges}>
                      {item.isDefault && (
                        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                          <Text style={[styles.badgeText, { color: colors.background }]}>Défaut</Text>
                        </View>
                      )}
                      {item.isActive && (
                        <View style={[styles.badge, { backgroundColor: colors.success }]}>
                          <Text style={[styles.badgeText, { color: colors.background }]}>Actif</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.themeActions}>
                    {!item.isActive && (
                      <TouchableOpacity
                        style={[styles.themeButton, { backgroundColor: colors.success }]}
                        onPress={() => setActiveTheme(item.id)}
                      >
                        <Text style={[styles.themeButtonText, { color: colors.background }]}>
                          Activer
                        </Text>
                      </TouchableOpacity>
                    )}

                    {!item.isDefault && (
                      <TouchableOpacity
                        style={[styles.themeButton, { backgroundColor: colors.warning }]}
                        onPress={() => setDefaultTheme(item.id)}
                      >
                        <Text style={[styles.themeButtonText, { color: colors.background }]}>
                          Défaut
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[styles.themeButton, { backgroundColor: colors.primary }]}
                      onPress={() => setEditingTheme(item)}
                    >
                      <Text style={[styles.themeButtonText, { color: colors.background }]}>
                        Éditer
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.themeButton, { backgroundColor: colors.info }]}
                      onPress={() => duplicateTheme(item.id)}
                    >
                      <Text style={[styles.themeButtonText, { color: colors.background }]}>
                        Dupliquer
                      </Text>
                    </TouchableOpacity>

                    {!item.isDefault && (
                      <TouchableOpacity
                        style={[styles.themeButton, { backgroundColor: colors.error }]}
                        onPress={() => deleteTheme(item.id)}
                      >
                        <Text style={[styles.themeButtonText, { color: colors.background }]}>
                          Supprimer
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
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
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  themeCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  themeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  themeName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 14,
  },
  themeBadges: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  themeActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  themeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  themeButtonText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  editorContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  editorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  editorScroll: {
    flex: 1,
  },
  editorSection: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  colorGrid: {
    gap: 12,
  },
  colorItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  colorLabel: {
    fontSize: 14,
    flex: 1,
  },
  colorInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  colorInput: {
    width: 100,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  editorActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#007bff",
  },
  secondaryButton: {
    backgroundColor: "#6c757d",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
});
