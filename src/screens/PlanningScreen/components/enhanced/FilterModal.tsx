import React, { useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
} from "react-native";
import { UIText } from "../../../../components/ui/Typography";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import Icon from "react-native-vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";

type FilterOptions = {
  priority: 'all' | 'high' | 'medium' | 'low';
  status: 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom';
  customDateRange?: { start: Date; end: Date };
  categories: string[];
  team?: string;
};

interface FilterModalProps {
  visible: boolean;
  filters: FilterOptions;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  filters,
  onClose,
  onApply,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const priorityOptions = ['all', 'high', 'medium', 'low'];
  const statusOptions = ['all', 'pending', 'in_progress', 'completed', 'cancelled'];
  const dateRangeOptions = ['all', 'today', 'week', 'month', 'custom'];

  const handleReset = () => {
    setLocalFilters({
      priority: 'all',
      status: 'all',
      dateRange: 'all',
      categories: [],
    });
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: currentTheme.colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <UIText variant="h6" style={styles.title}>
              {t("planning.filters.title", "Filters")}
            </UIText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={currentTheme.colors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Priority Filter */}
            <View style={styles.section}>
              <UIText variant="subtitle2" style={styles.sectionTitle}>
                {t("planning.filters.priority", "Priority")}
              </UIText>
              <View style={styles.optionsRow}>
                {priorityOptions.map((option) => (
                  <Pressable
                    key={option}
                    style={[
                      styles.optionButton,
                      localFilters.priority === option && styles.optionButtonActive,
                      { borderColor: currentTheme.colors.border },
                      localFilters.priority === option && { backgroundColor: currentTheme.colors.primary },
                    ]}
                    onPress={() => setLocalFilters({ ...localFilters, priority: option as any })}
                  >
                    <UIText
                      style={[
                        styles.optionText,
                        localFilters.priority === option && { color: currentTheme.colors.background },
                      ]}
                    >
                      {t(`planning.priority.${option}`, option)}
                    </UIText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Status Filter */}
            <View style={styles.section}>
              <UIText variant="subtitle2" style={styles.sectionTitle}>
                {t("planning.filters.status", "Status")}
              </UIText>
              <View style={styles.optionsRow}>
                {statusOptions.map((option) => (
                  <Pressable
                    key={option}
                    style={[
                      styles.optionButton,
                      localFilters.status === option && styles.optionButtonActive,
                      { borderColor: currentTheme.colors.border },
                      localFilters.status === option && { backgroundColor: currentTheme.colors.primary },
                    ]}
                    onPress={() => setLocalFilters({ ...localFilters, status: option as any })}
                  >
                    <UIText
                      style={[
                        styles.optionText,
                        localFilters.status === option && { color: currentTheme.colors.background },
                      ]}
                    >
                      {t(`planning.status.${option}`, option)}
                    </UIText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Date Range Filter */}
            <View style={styles.section}>
              <UIText variant="subtitle2" style={styles.sectionTitle}>
                {t("planning.filters.dateRange", "Date Range")}
              </UIText>
              <View style={styles.optionsRow}>
                {dateRangeOptions.map((option) => (
                  <Pressable
                    key={option}
                    style={[
                      styles.optionButton,
                      localFilters.dateRange === option && styles.optionButtonActive,
                      { borderColor: currentTheme.colors.border },
                      localFilters.dateRange === option && { backgroundColor: currentTheme.colors.primary },
                    ]}
                    onPress={() => setLocalFilters({ ...localFilters, dateRange: option as any })}
                  >
                    <UIText
                      style={[
                        styles.optionText,
                        localFilters.dateRange === option && { color: currentTheme.colors.background },
                      ]}
                    >
                      {t(`planning.dateRange.${option}`, option)}
                    </UIText>
                  </Pressable>
                ))}
              </View>

              {/* Custom Date Range Pickers */}
              {localFilters.dateRange === 'custom' && (
                <View style={styles.customDateRange}>
                  <Pressable
                    style={[styles.dateButton, { backgroundColor: currentTheme.colors.card }]}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Icon name="calendar-outline" size={20} color={currentTheme.colors.text} />
                    <UIText style={styles.dateText}>
                      {localFilters.customDateRange?.start
                        ? localFilters.customDateRange.start.toLocaleDateString()
                        : t("planning.filters.selectStartDate", "Select start date")}
                    </UIText>
                  </Pressable>

                  <Pressable
                    style={[styles.dateButton, { backgroundColor: currentTheme.colors.card }]}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Icon name="calendar-outline" size={20} color={currentTheme.colors.text} />
                    <UIText style={styles.dateText}>
                      {localFilters.customDateRange?.end
                        ? localFilters.customDateRange.end.toLocaleDateString()
                        : t("planning.filters.selectEndDate", "Select end date")}
                    </UIText>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Categories Filter */}
            <View style={styles.section}>
              <UIText variant="subtitle2" style={styles.sectionTitle}>
                {t("planning.filters.categories", "Categories")}
              </UIText>
              <View style={styles.categoriesContainer}>
                {['Work', 'Personal', 'Health', 'Education', 'Finance'].map((category) => (
                  <Pressable
                    key={category}
                    style={[
                      styles.categoryChip,
                      localFilters.categories.includes(category) && styles.categoryChipActive,
                      { borderColor: currentTheme.colors.border },
                      localFilters.categories.includes(category) && { backgroundColor: currentTheme.colors.primary },
                    ]}
                    onPress={() => {
                      const newCategories = localFilters.categories.includes(category)
                        ? localFilters.categories.filter((c) => c !== category)
                        : [...localFilters.categories, category];
                      setLocalFilters({ ...localFilters, categories: newCategories });
                    }}
                  >
                    <UIText
                      style={[
                        styles.categoryText,
                        localFilters.categories.includes(category) && { color: currentTheme.colors.background },
                      ]}
                    >
                      {t(`planning.category.${category.toLowerCase()}`, category)}
                    </UIText>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={[styles.actions, { borderTopColor: currentTheme.colors.border }]}>
            <Pressable
              style={[styles.actionButton, styles.resetButton]}
              onPress={handleReset}
            >
              <UIText style={styles.resetText}>
                {t("planning.filters.reset", "Reset")}
              </UIText>
            </Pressable>

            <Pressable
              style={[styles.actionButton, styles.applyButton, { backgroundColor: currentTheme.colors.primary }]}
              onPress={handleApply}
            >
              <UIText style={[styles.applyText, { color: currentTheme.colors.background }]}>
                {t("planning.filters.apply", "Apply Filters")}
              </UIText>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={localFilters.customDateRange?.start || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowStartDatePicker(false);
            if (date) {
              setLocalFilters({
                ...localFilters,
                customDateRange: {
                  ...localFilters.customDateRange,
                  start: date,
                  end: localFilters.customDateRange?.end || date,
                },
              });
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={localFilters.customDateRange?.end || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEndDatePicker(false);
            if (date) {
              setLocalFilters({
                ...localFilters,
                customDateRange: {
                  ...localFilters.customDateRange,
                  start: localFilters.customDateRange?.start || date,
                  end: date,
                },
              });
            }
          }}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: "600",
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  optionButtonActive: {
    borderWidth: 0,
  },
  optionText: {
    fontSize: 14,
  },
  customDateRange: {
    marginTop: 12,
    gap: 8,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  dateText: {
    flex: 1,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryChipActive: {
    borderWidth: 0,
  },
  categoryText: {
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  resetButton: {
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.2)",
  },
  resetText: {
    fontWeight: "600",
  },
  applyButton: {},
  applyText: {
    fontWeight: "700",
  },
});