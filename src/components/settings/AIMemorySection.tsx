import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";
import { loadAIMemoryConfig } from "../../config/aiMemoryConfig";
import { useTheme } from "../../contexts/ThemeContext";
import { useUnifiedMemory } from "../../hooks/useUnifiedMemory";
import { useCentralizedFont } from "../../hooks/useCentralizedFont";
import { useTranslation } from "../../hooks/useTranslation";
import { useContrastOptimization } from "../../hooks/useContrastOptimization";
import { UIText } from "../ui/Typography";
import AIMemoryToggle from "./AIMemoryToggle";
import { useNavigation } from "@react-navigation/native";

const AIMemorySection: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui: textInputFont } = useCentralizedFont();
  const { getOptimizedButtonColors } = useContrastOptimization();
  const {
    memories: memoires,
    isLoading,
    refreshMemory: loadMemory,
    deleteMemory: removeMemoryEntry,
    clearAllMemory: clearMemory,
    stats: memoryStats,
    addMemory: addMemoryEntry,
    getCitationUsageReport,
  } = useUnifiedMemory();
  const navigation = useNavigation<any>();

  const [refreshing, setRefreshing] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [newEntry, setNewEntry] = useState({
    contenu: "",
    categorie: "preference" as
      | "preference"
      | "fait"
      | "regle"
      | "contexte"
      | "correction",
    importance: "moyenne" as "haute" | "moyenne" | "basse",
  });

  useEffect(() => {
    // Charger la configuration de la mémoire
    loadAIMemoryConfig().then((config) => {
      setMemoryEnabled(config.enabled);
      if (config.enabled) {
        loadMemory();
      }
    });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMemory();
    setRefreshing(false);
  };

  const handleDeleteEntry = (id: string, contenu: string) => {
    Alert.alert(
      t("aiMemory.confirmations.delete.title"),
      t("aiMemory.confirmations.delete.message", {
        content: contenu.substring(0, 50),
      }),
      [
        {
          text: t("aiMemory.actions.cancel"),
          style: "cancel",
        },
        {
          text: t("aiMemory.actions.delete"),
          style: "destructive",
          onPress: () => removeMemoryEntry(id),
        },
      ]
    );
  };

  const handleClearAllMemory = () => {
    Alert.alert(
      t("aiMemory.confirmations.deleteAll.title"),
      t("aiMemory.confirmations.deleteAll.message"),
      [
        {
          text: t("aiMemory.actions.cancel"),
          style: "cancel",
        },
        {
          text: t("aiMemory.actions.deleteAll"),
          style: "destructive",
          onPress: clearMemory,
        },
      ]
    );
  };

  const handleAddEntry = async () => {
    if (!newEntry.contenu.trim()) {
      Alert.alert(
        t("aiMemory.add.error.title"),
        t("aiMemory.add.error.emptyContent")
      );
      return;
    }

    await addMemoryEntry({
      title: `Entrée ${newEntry.categorie}`,
      content: newEntry.contenu.trim(),
      category: mapCategorieToCategory(newEntry.categorie),
      importance: mapImportanceToUnified(newEntry.importance),
      citationRequired: false,
    });

    // Réinitialiser le formulaire
    setNewEntry({
      contenu: "",
      categorie: "preference",
      importance: "moyenne",
    });
    setShowAddModal(false);

    // Recharger la mémoire
    loadMemory();
  };

  const getTypeIcon = (
    categorie: "preference" | "fait" | "regle" | "contexte" | "correction"
  ) => {
    switch (categorie) {
      case "preference":
        return "heart";
      case "fait":
        return "account";
      case "regle":
        return "cog";
      case "contexte":
        return "information";
      case "correction":
        return "pencil";
      default:
        return "circle";
    }
  };

  const getTypeColor = (
    categorie: "preference" | "fait" | "regle" | "contexte" | "correction"
  ) => {
    switch (categorie) {
      case "preference":
        return currentTheme.isDark ? "#10b981" : "#10B981"; // Vert
      case "fait":
        return currentTheme.isDark ? "#60a5fa" : "#3B82F6"; // Bleu
      case "regle":
        return currentTheme.isDark ? "#fbbf24" : "#F59E0B"; // Orange
      case "contexte":
        return currentTheme.isDark ? "#a78bfa" : "#8B5CF6"; // Violet
      case "correction":
        return currentTheme.isDark ? "#f59e0b" : "#D97706"; // Jaune
      default:
        return currentTheme.colors.textSecondary;
    }
  };

  const getImportanceColor = (importance: "haute" | "moyenne" | "basse") => {
    switch (importance) {
      case "haute":
        return currentTheme.isDark ? "#f87171" : "#EF4444"; // Rouge
      case "moyenne":
        return currentTheme.isDark ? "#fbbf24" : "#F59E0B"; // Orange
      case "basse":
        return currentTheme.isDark ? "#9ca3af" : "#6B7280"; // Gris
      default:
        return currentTheme.colors.textSecondary;
    }
  };

  const getTypeLabel = (
    categorie: "preference" | "fait" | "regle" | "contexte" | "correction"
  ) => {
    return t(`aiMemory.types.${categorie}`);
  };

  const getImportanceLabel = (importance: "haute" | "moyenne" | "basse") => {
    return t(`aiMemory.importance.${importance}`);
  };

  const stats = memoryStats;

  return (
    <View style={tw`flex-1`}>
      {/* Toggle de la mémoire IA */}
      <AIMemoryToggle
        onConfigChange={(config) => {
          setMemoryEnabled(config.enabled);
          if (config.enabled) {
            loadMemory();
          }
        }}
      />

      {/* En-tête */}
      <View style={tw`px-6 py-4 border-b border-gray-200 dark:border-gray-700`}>
        <View style={tw`items-center justify-center`}>
          <View style={tw`flex-row items-center justify-center mb-3`}>
            <MaterialCommunityIcons
              name="brain"
              size={28}
              color={
                memoryEnabled
                  ? currentTheme.colors.primary
                  : currentTheme.colors.textSecondary
              }
              style={tw`mr-3`}
            />
            <UIText
              size="xl"
              weight="bold"
              color={currentTheme.colors.text}
              style={tw`text-center`}
            >
              {t("aiMemory.title")}
            </UIText>
          </View>

          {memoryEnabled && stats && (
            <UIText
              size="sm"
              color={currentTheme.colors.textSecondary}
              style={tw`text-center`}
            >
              {t("aiMemory.stats.totalEntries", { count: stats.totalEntries })}
            </UIText>
          )}
        </View>
      </View>

      {/* Contenu conditionnel selon l'état de la mémoire */}
      {!memoryEnabled ? (
        <View style={tw`flex-1 justify-center items-center px-8`}>
          <View style={tw`items-center`}>
            <MaterialCommunityIcons
              name="brain"
              size={80}
              color={currentTheme.colors.textSecondary}
              style={tw`opacity-30 mb-6`}
            />
            <UIText
              size="xl"
              weight="bold"
              align="center"
              color={currentTheme.colors.text}
              style={tw`mb-3 text-center`}
            >
              {t("aiMemory.toggle.disabledDescription")}
            </UIText>
            <UIText
              size="base"
              align="center"
              color={currentTheme.colors.textSecondary}
              style={tw`text-center px-4`}
            >
              {t("aiMemory.disable.message")}
            </UIText>
          </View>
        </View>
      ) : (
        <>
          {/* Statistiques */}
          {stats && stats.totalEntries > 0 && (
            <View style={tw`px-6 py-4 bg-gray-50 dark:bg-gray-800`}>
              <View style={tw`flex-row justify-between`}>
                {Object.entries(stats.byImportance).map(
                  ([importance, count]) => (
                    <View key={importance} style={tw`items-center`}>
                      <View
                        style={[
                          tw`w-3 h-3 rounded-full mb-1`,
                          {
                            backgroundColor: getImportanceColor(
                              importance as any
                            ),
                          },
                        ]}
                      />
                      <UIText
                        size="xs"
                        weight="medium"
                        color={currentTheme.colors.text}
                      >
                        {count}
                      </UIText>
                      <UIText
                        size="xs"
                        color={currentTheme.colors.textSecondary}
                      >
                        {getImportanceLabel(importance as any)}
                      </UIText>
                    </View>
                  )
                )}
              </View>
            </View>
          )}

          {/* Liste des entrées */}
          <ScrollView
            style={tw`flex-1`}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
          >
            {isLoading ? (
              <View style={tw`flex-1 justify-center items-center py-12`}>
                <MaterialCommunityIcons
                  name="loading"
                  size={32}
                  color={currentTheme.colors.primary}
                />
                <UIText
                  align="center"
                  color={currentTheme.colors.textSecondary}
                  style={tw`mt-2`}
                >
                  {t("aiMemory.loading")}
                </UIText>
              </View>
            ) : !memoires || memoires.length === 0 ? (
              <View style={tw`flex-1 justify-center items-center py-12`}>
                <MaterialCommunityIcons
                  name="brain"
                  size={64}
                  color={currentTheme.colors.textSecondary}
                  style={tw`opacity-50`}
                />
                <UIText
                  size="lg"
                  weight="medium"
                  align="center"
                  color={currentTheme.colors.text}
                  style={tw`mt-4 mb-2`}
                >
                  {t("aiMemory.empty.title")}
                </UIText>
                <UIText
                  align="center"
                  color={currentTheme.colors.textSecondary}
                  style={tw`px-8`}
                >
                  {t("aiMemory.empty.description")}
                </UIText>
              </View>
            ) : (
              <View style={tw`px-6 py-4`}>
                {memoires.map((entry, index) => (
                  <TouchableOpacity
                    key={entry.id}
                    style={[
                      tw`mb-3 p-4 rounded-xl border`,
                      {
                        backgroundColor: currentTheme.colors.surface,
                        borderColor: currentTheme.colors.border,
                      },
                    ]}
                    onPress={() =>
                      setExpandedEntry(
                        expandedEntry === entry.id ? null : entry.id
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <View style={tw`flex-row items-start justify-between`}>
                      <View style={tw`flex-1 mr-3`}>
                        {/* Type et importance */}
                        <View style={tw`flex-row items-center mb-2`}>
                          <MaterialCommunityIcons
                            name={getTypeIcon(
                              mapCategoryToCategorie(entry.category)
                            )}
                            size={16}
                            color={getTypeColor(
                              mapCategoryToCategorie(entry.category)
                            )}
                            style={tw`mr-2`}
                          />
                          <UIText
                            size="xs"
                            weight="medium"
                            color={getTypeColor(
                              mapCategoryToCategorie(entry.category)
                            )}
                            style={[
                              tw`px-2 py-1 rounded`,
                              {
                                backgroundColor:
                                  getTypeColor(
                                    mapCategoryToCategorie(entry.category)
                                  ) + "20",
                              },
                            ]}
                          >
                            {getTypeLabel(
                              mapCategoryToCategorie(entry.category)
                            )}
                          </UIText>
                          <View
                            style={[
                              tw`w-2 h-2 rounded-full ml-2`,
                              {
                                backgroundColor: getImportanceColor(
                                  mapImportanceToFr(entry.importance)
                                ),
                              },
                            ]}
                          />
                        </View>

                        {/* Contenu */}
                        <UIText
                          size="sm"
                          color={currentTheme.colors.text}
                          numberOfLines={
                            expandedEntry === entry.id ? undefined : 2
                          }
                        >
                          {entry.content}
                        </UIText>

                        {/* Date */}
                        <UIText
                          size="xs"
                          color={currentTheme.colors.textSecondary}
                          style={tw`mt-2`}
                        >
                          {new Date(entry.timestamp).toLocaleDateString()}{" "}
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </UIText>
                      </View>

                      {/* Actions */}
                      <TouchableOpacity
                        onPress={() =>
                          handleDeleteEntry(entry.id, entry.content)
                        }
                        style={tw`p-2`}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <MaterialCommunityIcons
                          name="delete-outline"
                          size={20}
                          color={currentTheme.colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Bouton effacer tout */}
          {memoires && memoires.length > 0 && (
            <View
              style={tw`px-6 py-4 border-t border-gray-200 dark:border-gray-700`}
            >
              <TouchableOpacity
                onPress={async () => {
                  navigation.navigate("MemorySources");
                }}
                style={[
                  tw`flex-row items-center justify-center py-3 px-4 rounded-xl mb-3`,
                  {
                    backgroundColor: currentTheme.isDark
                      ? "#60a5fa"
                      : currentTheme.colors.primary + "20",
                  },
                ]}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="file-document"
                  size={20}
                  color={currentTheme.isDark ? "#60a5fa" : currentTheme.colors.primary}
                  style={tw`mr-2`}
                />
                <UIText
                  weight="medium"
                  color={currentTheme.isDark ? "#60a5fa" : currentTheme.colors.primary}
                >
                  {t("aiMemory.citations.open", "Mémoire et sources")}
                </UIText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClearAllMemory}
                style={[
                  tw`flex-row items-center justify-center py-3 px-4 rounded-xl`,
                  {
                    backgroundColor: currentTheme.isDark
                      ? "#f87171"
                      : currentTheme.colors.error + "20",
                  },
                ]}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="delete-sweep"
                  size={20}
                  color={
                    currentTheme.isDark ? "#f87171" : currentTheme.colors.error
                  }
                  style={tw`mr-2`}
                />
                <UIText
                  weight="medium"
                  color={
                    currentTheme.isDark ? "#f87171" : currentTheme.colors.error
                  }
                >
                  {t("aiMemory.actions.deleteAll")}
                </UIText>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Bouton flottant d'ajout */}
      {memoryEnabled && (
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={[
            tw`absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center`,
            { backgroundColor: getOptimizedButtonColors().background },
          ]}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="plus"
            size={28}
            color={getOptimizedButtonColors().text}
          />
        </TouchableOpacity>
      )}

      {/* Modal d'ajout */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={tw`flex-1`}
        >
          <TouchableOpacity
            style={tw`flex-1 bg-black bg-opacity-50`}
            activeOpacity={1}
            onPress={() => setShowAddModal(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[
                tw`absolute bottom-0 left-0 right-0 rounded-t-3xl p-6`,
                { backgroundColor: currentTheme.colors.surface },
              ]}
              onPress={() => {}}
            >
              <View style={tw`flex-row items-center justify-between mb-6`}>
                <UIText
                  size="xl"
                  weight="bold"
                  color={currentTheme.colors.text}
                >
                  {t("aiMemory.add.title")}
                </UIText>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={currentTheme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Champ de texte */}
              <TextInput
                style={[
                  tw`p-4 rounded-xl text-base mb-4`,
                  {
                    ...textInputFont,
                    backgroundColor: currentTheme.colors.background,
                    color: currentTheme.colors.text,
                    borderWidth: 1,
                    borderColor: currentTheme.colors.border,
                    minHeight: 100,
                  },
                ]}
                placeholder={t("aiMemory.add.placeholder")}
                placeholderTextColor={currentTheme.colors.textSecondary}
                value={newEntry.contenu}
                onChangeText={(text) =>
                  setNewEntry({ ...newEntry, contenu: text })
                }
                multiline
                textAlignVertical="top"
              />

              {/* Sélection du type */}
              <View style={tw`mb-4`}>
                <UIText
                  size="sm"
                  weight="medium"
                  color={currentTheme.colors.textSecondary}
                  style={tw`mb-2`}
                >
                  {t("aiMemory.add.type")}
                </UIText>
                <View style={tw`flex-row flex-wrap gap-2`}>
                  {(["preference", "fait", "regle", "contexte"] as const).map(
                    (categorie) => (
                      <TouchableOpacity
                        key={categorie}
                        onPress={() => setNewEntry({ ...newEntry, categorie })}
                        style={[
                          tw`px-4 py-2 rounded-full flex-row items-center`,
                          {
                            backgroundColor:
                              newEntry.categorie === categorie
                                ? getTypeColor(categorie) + "30"
                                : currentTheme.colors.surface,
                            borderWidth: 1,
                            borderColor:
                              newEntry.categorie === categorie
                                ? getTypeColor(categorie)
                                : currentTheme.colors.border,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={getTypeIcon(categorie)}
                          size={16}
                          color={getTypeColor(categorie)}
                          style={tw`mr-2`}
                        />
                        <UIText
                          size="sm"
                          color={
                            newEntry.categorie === categorie
                              ? getTypeColor(categorie)
                              : currentTheme.colors.text
                          }
                        >
                          {getTypeLabel(categorie)}
                        </UIText>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>

              {/* Sélection de l'importance */}
              <View style={tw`mb-6`}>
                <UIText
                  size="sm"
                  weight="medium"
                  color={currentTheme.colors.textSecondary}
                  style={tw`mb-2`}
                >
                  {t("aiMemory.add.importance")}
                </UIText>
                <View style={tw`flex-row gap-2`}>
                  {(["haute", "moyenne", "basse"] as const).map(
                    (importance) => (
                      <TouchableOpacity
                        key={importance}
                        onPress={() => setNewEntry({ ...newEntry, importance })}
                        style={[
                          tw`flex-1 py-3 rounded-xl items-center`,
                          {
                            backgroundColor:
                              newEntry.importance === importance
                                ? getImportanceColor(importance) + "30"
                                : currentTheme.colors.surface,
                            borderWidth: 1,
                            borderColor:
                              newEntry.importance === importance
                                ? getImportanceColor(importance)
                                : currentTheme.colors.border,
                          },
                        ]}
                      >
                        <View
                          style={[
                            tw`w-3 h-3 rounded-full mb-1`,
                            { backgroundColor: getImportanceColor(importance) },
                          ]}
                        />
                        <UIText
                          size="xs"
                          color={
                            newEntry.importance === importance
                              ? getImportanceColor(importance)
                              : currentTheme.colors.text
                          }
                        >
                          {getImportanceLabel(importance)}
                        </UIText>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>

              {/* Boutons d'action */}
              <View style={tw`flex-row gap-3`}>
                <TouchableOpacity
                  onPress={() => setShowAddModal(false)}
                  style={[
                    tw`flex-1 py-3 rounded-xl items-center`,
                    {
                      backgroundColor: currentTheme.colors.surface,
                      borderWidth: 1,
                      borderColor: currentTheme.colors.border,
                    },
                  ]}
                >
                  <UIText weight="medium" color={currentTheme.colors.text}>
                    {t("aiMemory.actions.cancel")}
                  </UIText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddEntry}
                  style={[
                    tw`flex-1 py-3 rounded-xl items-center`,
                    { backgroundColor: getOptimizedButtonColors().background },
                  ]}
                >
                  <UIText
                    weight="medium"
                    color={getOptimizedButtonColors().text}
                  >
                    {t("aiMemory.add.save")}
                  </UIText>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default AIMemorySection;

function mapCategorieToCategory(
  cat: "preference" | "fait" | "regle" | "contexte" | "correction"
): "preference" | "context" | "rule" | "fact" | "correction" {
  switch (cat) {
    case "preference":
      return "preference";
    case "regle":
      return "rule";
    case "contexte":
      return "context";
    case "fait":
      return "fact";
    case "correction":
      return "correction";
  }
}

function mapCategoryToCategorie(
  cat: "preference" | "context" | "rule" | "fact" | "correction"
): "preference" | "fait" | "regle" | "contexte" | "correction" {
  switch (cat) {
    case "preference":
      return "preference";
    case "rule":
      return "regle";
    case "context":
      return "contexte";
    case "fact":
      return "fait";
    case "correction":
      return "correction";
  }
}

function mapImportanceToUnified(
  imp: "haute" | "moyenne" | "basse"
): "high" | "medium" | "low" {
  switch (imp) {
    case "haute":
      return "high";
    case "basse":
      return "low";
    default:
      return "medium";
  }
}

function mapImportanceToFr(
  imp: "high" | "medium" | "low"
): "haute" | "moyenne" | "basse" {
  switch (imp) {
    case "high":
      return "haute";
    case "low":
      return "basse";
    default:
      return "moyenne";
  }
}
