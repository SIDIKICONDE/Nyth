import Ionicons from "react-native-vector-icons/Ionicons";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../../hooks/useCentralizedFont";
import { UIText } from "../../../ui/Typography";
import {
  CATEGORY_SUGGESTED_TAGS,
  COMMON_TAGS,
  TAG_CATEGORIES,
} from "../constants";
import { TagInputProps } from "../types";

export const TagInput: React.FC<TagInputProps> = ({
  value,
  onTagsChange,
  placeholder = "Ajouter des étiquettes",
  error,
  category, // Nouvelle prop pour suggestions contextuelles
}) => {
  const { currentTheme } = useTheme();
  const { ui } = useCentralizedFont();
  const [inputText, setInputText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Obtenir les suggestions basées sur la catégorie de tâche ou catégorie sélectionnée
  const contextualSuggestions = useMemo(() => {
    if (category && CATEGORY_SUGGESTED_TAGS[category]) {
      return CATEGORY_SUGGESTED_TAGS[category];
    }
    if (
      selectedCategory &&
      TAG_CATEGORIES[selectedCategory as keyof typeof TAG_CATEGORIES]
    ) {
      return TAG_CATEGORIES[selectedCategory as keyof typeof TAG_CATEGORIES];
    }
    return COMMON_TAGS.slice(0, 15); // Tags les plus populaires
  }, [category, selectedCategory]);

  // Filtrer les suggestions basées sur l'input
  const suggestions = useMemo(() => {
    if (!inputText.trim()) return [];

    const searchTerm = inputText.toLowerCase();
    const allTags = selectedCategory
      ? TAG_CATEGORIES[selectedCategory as keyof typeof TAG_CATEGORIES] ||
        COMMON_TAGS
      : COMMON_TAGS;

    return allTags
      .filter(
        (tag) =>
          tag.toLowerCase().includes(searchTerm) &&
          !value.some(
            (existingTag) => existingTag.toLowerCase() === tag.toLowerCase()
          )
      )
      .slice(0, 8); // Limiter à 8 suggestions
  }, [inputText, value, selectedCategory]);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (
      trimmedTag &&
      !value.some(
        (existingTag) => existingTag.toLowerCase() === trimmedTag.toLowerCase()
      )
    ) {
      onTagsChange([...value, trimmedTag]);
    }
    setInputText("");
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleInputSubmit = () => {
    if (inputText.trim()) {
      addTag(inputText);
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    setShowSuggestions(text.length > 0);
  };

  const categoryOptions = [
    {
      key: "design",
      label: "Design",
      icon: "color-palette-outline",
      color: "#8B5CF6",
    },
    {
      key: "development",
      label: "Dev",
      icon: "code-slash-outline",
      color: "#3B82F6",
    },
    {
      key: "marketing",
      label: "Marketing",
      icon: "megaphone-outline",
      color: "#F59E0B",
    },
    {
      key: "project",
      label: "Projet",
      icon: "briefcase-outline",
      color: "#10B981",
    },
    { key: "tools", label: "Outils", icon: "build-outline", color: "#6B7280" },
    {
      key: "priority",
      label: "Priorité",
      icon: "flag-outline",
      color: "#EF4444",
    },
  ];

  return (
    <View style={styles.container}>
      <UIText
        size="sm"
        weight="semibold"
        color={currentTheme.colors.text}
        style={styles.label}
      >
        Étiquettes
      </UIText>

      {/* Tags existants */}
      {value.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsContainer}
        >
          {value.map((tag, index) => (
            <View
              key={index}
              style={[
                styles.tag,
                { backgroundColor: currentTheme.colors.primary + "20" },
              ]}
            >
              <UIText
                size="xs"
                weight="medium"
                color={currentTheme.colors.primary}
              >
                {tag}
              </UIText>
              <TouchableOpacity
                onPress={() => removeTag(tag)}
                style={styles.removeButton}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                <Ionicons
                  name="close"
                  size={12}
                  color={currentTheme.colors.primary}
                />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Input pour nouveaux tags */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            ui,
            {
              backgroundColor: currentTheme.colors.surface,
              borderColor: error ? "#EF4444" : currentTheme.colors.border,
              color: currentTheme.colors.text,
            },
          ]}
          value={inputText}
          onChangeText={handleInputChange}
          placeholder={placeholder}
          placeholderTextColor={currentTheme.colors.textSecondary}
          onSubmitEditing={handleInputSubmit}
          onFocus={() => setShowSuggestions(inputText.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          returnKeyType="done"
          autoCapitalize="words"
          autoCorrect={false}
          blurOnSubmit={false}
          enablesReturnKeyAutomatically={true}
          keyboardType="default"
        />

        {inputText.length > 0 && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleInputSubmit}
          >
            <Ionicons
              name="add"
              size={20}
              color={currentTheme.colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Catégories de tags */}
      {!showSuggestions && (
        <View style={styles.categoriesContainer}>
          <UIText
            size="xs"
            weight="medium"
            color={currentTheme.colors.textSecondary}
          >
            Catégories :
          </UIText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categories}
          >
            {categoryOptions.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor:
                      selectedCategory === cat.key
                        ? cat.color + "20"
                        : currentTheme.colors.surface,
                    borderColor:
                      selectedCategory === cat.key
                        ? cat.color
                        : currentTheme.colors.border,
                  },
                ]}
                onPress={() =>
                  setSelectedCategory(
                    selectedCategory === cat.key ? null : cat.key
                  )
                }
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={
                    selectedCategory === cat.key
                      ? cat.color
                      : currentTheme.colors.textSecondary
                  }
                />
                <UIText
                  size="xs"
                  weight="medium"
                  color={
                    selectedCategory === cat.key
                      ? cat.color
                      : currentTheme.colors.textSecondary
                  }
                >
                  {cat.label}
                </UIText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsSection}>
          <UIText
            size="xs"
            weight="medium"
            color={currentTheme.colors.textSecondary}
          >
            Suggestions :
          </UIText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsContainer}
          >
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.suggestion,
                  {
                    backgroundColor: currentTheme.colors.surface,
                    borderColor: currentTheme.colors.border,
                  },
                ]}
                onPress={() => addTag(suggestion)}
              >
                <UIText
                  size="xs"
                  weight="medium"
                  color={currentTheme.colors.text}
                >
                  {suggestion}
                </UIText>
                <Ionicons
                  name="add"
                  size={12}
                  color={currentTheme.colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Tags populaires/contextuels */}
      {!showSuggestions && contextualSuggestions.length > 0 && (
        <View style={styles.popularTagsContainer}>
          <UIText
            size="xs"
            weight="medium"
            color={currentTheme.colors.textSecondary}
          >
            {category
              ? "Suggérés pour cette catégorie :"
              : selectedCategory
              ? `Tags ${selectedCategory} :`
              : "Populaires :"}
          </UIText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularTags}
          >
            {contextualSuggestions
              .filter(
                (tag) =>
                  !value.some(
                    (existingTag) =>
                      existingTag.toLowerCase() === tag.toLowerCase()
                  )
              )
              .slice(0, 10)
              .map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.popularTag,
                    {
                      backgroundColor: currentTheme.colors.surface,
                      borderColor: currentTheme.colors.border,
                    },
                  ]}
                  onPress={() => addTag(tag)}
                >
                  <UIText
                    size="xs"
                    weight="medium"
                    color={currentTheme.colors.text}
                  >
                    {tag}
                  </UIText>
                  <Ionicons
                    name="add-circle-outline"
                    size={14}
                    color={currentTheme.colors.primary}
                  />
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      )}

      {/* Compteur de tags */}
      {value.length > 0 && (
        <UIText
          size="xs"
          weight="medium"
          color={currentTheme.colors.textSecondary}
        >
          {value.length} étiquette{value.length > 1 ? "s" : ""} ajoutée
          {value.length > 1 ? "s" : ""}
        </UIText>
      )}

      {error && (
        <UIText size="xs" color="#EF4444">
          {error}
        </UIText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 4,
  },
  tagsContainer: {
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },

  removeButton: {
    padding: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 40,
  },
  addButton: {
    marginLeft: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  categoriesContainer: {
    marginBottom: 12,
  },
  categoriesLabel: {
    marginBottom: 6,
  },
  categories: {
    gap: 8,
    paddingHorizontal: 2,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  categoryText: {},
  suggestionsSection: {
    marginBottom: 12,
  },
  suggestionsLabel: {
    marginBottom: 6,
  },
  suggestionsContainer: {
    gap: 6,
    paddingHorizontal: 2,
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  suggestionText: {},
  popularTagsContainer: {
    marginBottom: 8,
  },
  popularLabel: {
    marginBottom: 6,
  },
  popularTags: {
    gap: 6,
    paddingHorizontal: 2,
  },
  popularTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  popularTagText: {},
  counter: {
    fontStyle: "italic",
    textAlign: "right",
    marginTop: 4,
  },
  errorText: {
    color: "#EF4444",
    marginTop: 4,
  },
});
