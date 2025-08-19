import React, { useState, useCallback, useEffect } from "react";
import {
  Modal,
  View,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { UIText } from "../../../../components/ui/Typography";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import Icon from "react-native-vector-icons/Ionicons";
import { usePlanning } from "../../../../hooks/usePlanning";
import { useTasks } from "../../../../hooks/useTasks";
import { useDebounce } from "../../../../hooks/useDebounce";

interface SearchModalProps {
  visible: boolean;
  query: string;
  onClose: () => void;
  onSearch: (query: string) => void;
  onSelectItem?: (item: any) => void;
}

type SearchResult = {
  id: string;
  type: 'event' | 'goal' | 'task';
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  date?: Date;
  icon: string;
};

export const SearchModal: React.FC<SearchModalProps> = ({
  visible,
  query: initialQuery,
  onClose,
  onSearch,
  onSelectItem,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { events, goals } = usePlanning();
  const { tasks } = useTasks();
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fonction de recherche
  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    // Recherche dans les événements
    events.forEach(event => {
      if (
        event.title.toLowerCase().includes(lowerQuery) ||
        event.description?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          id: event.id,
          type: 'event',
          title: event.title,
          description: event.description,
          status: event.status,
          priority: event.priority,
          date: event.startDate ? new Date(event.startDate) : undefined,
          icon: 'calendar-outline',
        });
      }
    });

    // Recherche dans les objectifs
    goals.forEach(goal => {
      if (
        goal.title.toLowerCase().includes(lowerQuery) ||
        goal.description?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          id: goal.id,
          type: 'goal',
          title: goal.title,
          description: goal.description,
          status: goal.status,
          priority: goal.priority,
          date: goal.targetDate ? new Date(goal.targetDate) : undefined,
          icon: 'flag-outline',
        });
      }
    });

    // Recherche dans les tâches
    tasks.forEach(task => {
      if (
        task.title.toLowerCase().includes(lowerQuery) ||
        task.description?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          id: task.id,
          type: 'task',
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          date: task.dueDate ? new Date(task.dueDate) : undefined,
          icon: 'checkbox-outline',
        });
      }
    });

    // Trier les résultats par pertinence
    results.sort((a, b) => {
      const aRelevance = a.title.toLowerCase().startsWith(lowerQuery) ? 2 : 1;
      const bRelevance = b.title.toLowerCase().startsWith(lowerQuery) ? 2 : 1;
      return bRelevance - aRelevance;
    });

    setSearchResults(results);
    setIsSearching(false);
  }, [events, goals, tasks]);

  // Effet pour la recherche avec debounce
  useEffect(() => {
    performSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery, performSearch]);

  // Charger les recherches récentes
  useEffect(() => {
    // Implémenter la récupération des recherches récentes depuis AsyncStorage
    setRecentSearches(['Project deadline', 'Team meeting', 'Budget review']);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Ajouter aux recherches récentes
      const updatedRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
      setRecentSearches(updatedRecent);
      // Sauvegarder dans AsyncStorage
      
      onSearch(searchQuery);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    onSelectItem?.(result);
    onClose();
  };

  const handleRecentSearch = (search: string) => {
    setSearchQuery(search);
    onSearch(search);
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <Pressable
      style={[styles.resultItem, { backgroundColor: currentTheme.colors.card }]}
      onPress={() => handleSelectResult(item)}
    >
      <View style={[styles.resultIcon, { backgroundColor: currentTheme.colors.primary + '20' }]}>
        <Icon name={item.icon} size={20} color={currentTheme.colors.primary} />
      </View>
      
      <View style={styles.resultContent}>
        <View style={styles.resultHeader}>
          <UIText style={styles.resultTitle} numberOfLines={1}>
            {item.title}
          </UIText>
          <UIText style={[styles.resultType, { color: currentTheme.colors.textSecondary }]}>
            {t(`planning.type.${item.type}`, item.type)}
          </UIText>
        </View>
        
        {item.description && (
          <UIText
            style={[styles.resultDescription, { color: currentTheme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.description}
          </UIText>
        )}
        
        <View style={styles.resultMeta}>
          {item.status && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status, currentTheme) }]}>
              <UIText style={styles.statusText}>{t(`planning.status.${item.status}`, item.status)}</UIText>
            </View>
          )}
          
          {item.date && (
            <UIText style={[styles.dateText, { color: currentTheme.colors.textSecondary }]}>
              {item.date.toLocaleDateString()}
            </UIText>
          )}
        </View>
      </View>
    </Pressable>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      {searchQuery.trim() ? (
        <>
          <Icon name="search-outline" size={48} color={currentTheme.colors.textSecondary} />
          <UIText style={[styles.emptyText, { color: currentTheme.colors.textSecondary }]}>
            {t("planning.search.noResults", "No results found")}
          </UIText>
          <UIText style={[styles.emptySubtext, { color: currentTheme.colors.textSecondary }]}>
            {t("planning.search.tryDifferent", "Try a different search term")}
          </UIText>
        </>
      ) : recentSearches.length > 0 ? (
        <View style={styles.recentSearches}>
          <UIText style={styles.recentTitle}>
            {t("planning.search.recent", "Recent Searches")}
          </UIText>
          {recentSearches.map((search, index) => (
            <Pressable
              key={index}
              style={styles.recentItem}
              onPress={() => handleRecentSearch(search)}
            >
              <Icon name="time-outline" size={16} color={currentTheme.colors.textSecondary} />
              <UIText style={styles.recentText}>{search}</UIText>
            </Pressable>
          ))}
        </View>
      ) : (
        <>
          <Icon name="search-outline" size={48} color={currentTheme.colors.textSecondary} />
          <UIText style={[styles.emptyText, { color: currentTheme.colors.textSecondary }]}>
            {t("planning.search.start", "Start searching")}
          </UIText>
        </>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={[styles.modalContent, { backgroundColor: currentTheme.colors.surface }]}>
          {/* Search Header */}
          <View style={[styles.searchHeader, { borderBottomColor: currentTheme.colors.border }]}>
            <View style={[styles.searchBar, { backgroundColor: currentTheme.colors.card }]}>
              <Icon name="search" size={20} color={currentTheme.colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: currentTheme.colors.text }]}
                placeholder={t("planning.search.placeholder", "Search events, goals, tasks...")}
                placeholderTextColor={currentTheme.colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Icon name="close-circle" size={20} color={currentTheme.colors.textSecondary} />
                </Pressable>
              )}
            </View>
            
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <UIText style={{ color: currentTheme.colors.primary }}>
                {t("common.cancel", "Cancel")}
              </UIText>
            </Pressable>
          </View>

          {/* Search Results */}
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            contentContainerStyle={styles.resultsList}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Helper function pour obtenir la couleur du statut
const getStatusColor = (status: string, theme: any): string => {
  const colors: Record<string, string> = {
    pending: theme.colors.warning,
    in_progress: theme.colors.info,
    completed: theme.colors.success,
    cancelled: theme.colors.error,
    active: theme.colors.primary,
  };
  return colors[status] || theme.colors.textSecondary;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    flex: 1,
    marginTop: Platform.OS === "ios" ? 50 : 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  cancelButton: {
    paddingVertical: 8,
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  resultItem: {
    flexDirection: "row",
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    gap: 12,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  resultContent: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  resultType: {
    fontSize: 12,
    textTransform: "capitalize",
  },
  resultDescription: {
    fontSize: 14,
    marginBottom: 6,
  },
  resultMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    color: "white",
    textTransform: "capitalize",
  },
  dateText: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  recentSearches: {
    width: "100%",
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  recentText: {
    fontSize: 15,
  },
});
