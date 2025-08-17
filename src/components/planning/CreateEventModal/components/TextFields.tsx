import { useTheme } from "@/contexts/ThemeContext";
import { useCentralizedFont } from "@/hooks/useCentralizedFont";
import { useTranslation } from "@/hooks/useTranslation";
import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { Animated, StyleSheet, TextInput, View } from "react-native";
import { UIText } from "../../../ui/Typography";

interface TextFieldsProps {
  title: string;
  setTitle: (title: string) => void;
  location: string;
  setLocation: (location: string) => void;
  tags: string;
  setTags: (tags: string) => void;
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon: string;
  multiline?: boolean;
  required?: boolean;
  maxLength?: number;
}

const AnimatedField: React.FC<FieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  multiline = false,
  required = false,
  maxLength,
}) => {
  const { currentTheme } = useTheme();
  const { ui } = useCentralizedFont();
  const [isFocused, setIsFocused] = React.useState(false);
  const focusAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(focusAnim, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1.02 : 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [currentTheme.colors.border, currentTheme.colors.primary],
  });

  const iconColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      currentTheme.colors.textSecondary,
      currentTheme.colors.primary,
    ],
  });

  return (
    <Animated.View
      style={[
        styles.fieldContainer,
        {
          backgroundColor: currentTheme.colors.surface,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.fieldHeader}>
        <View style={styles.labelContainer}>
          <Animated.View
            style={[
              styles.iconContainer,
              {
                backgroundColor: focusAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [
                    currentTheme.colors.background,
                    currentTheme.colors.primary + "15",
                  ],
                }),
              },
            ]}
          >
            <Animated.Text style={{ color: iconColor }}>
              <Ionicons name={icon as any} size={16} />
            </Animated.Text>
          </Animated.View>
          <UIText
            size="base"
            weight="semibold"
            color={currentTheme.colors.text}
          >
            {label}
            {required && (
              <UIText size="base" weight="bold" color="#EF4444">
                {" *"}
              </UIText>
            )}
          </UIText>
        </View>
        {maxLength && (
          <UIText
            size="xs"
            weight="medium"
            color={currentTheme.colors.textSecondary}
            style={styles.characterCount}
          >
            {value.length}/{maxLength}
          </UIText>
        )}
      </View>

      <Animated.View
        style={[
          styles.inputContainer,
          {
            borderColor,
            backgroundColor: currentTheme.colors.background,
          },
        ]}
      >
        {isFocused && (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: currentTheme.colors.primary + "05" },
            ]}
          />
        )}
        <TextInput
          style={[
            styles.textInput,
            ui,
            multiline && styles.textArea,
            { color: currentTheme.colors.text },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={currentTheme.colors.textSecondary}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={maxLength}
          autoFocus={icon === "document-text"}
        />
      </Animated.View>
    </Animated.View>
  );
};

export const TextFields: React.FC<TextFieldsProps> = ({
  title,
  setTitle,
  location,
  setLocation,
  tags,
  setTags,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <AnimatedField
        label={t("planning.events.titleLabel", "Titre")}
        value={title}
        onChangeText={setTitle}
        placeholder={t(
          "planning.events.titlePlaceholder",
          "Nom de votre événement"
        )}
        icon="document-text"
        required={true}
        maxLength={100}
      />

      <AnimatedField
        label={t("planning.events.locationLabel", "Lieu")}
        value={location}
        onChangeText={setLocation}
        placeholder={t(
          "planning.events.locationPlaceholder",
          "Où aura lieu l'événement ?"
        )}
        icon="location"
        maxLength={200}
      />

      <AnimatedField
        label={t("planning.events.tagsLabel", "Tags")}
        value={tags}
        onChangeText={setTags}
        placeholder={t(
          "planning.events.tagsPlaceholder",
          "travail, important, réunion..."
        )}
        icon="pricetags"
        maxLength={100}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  fieldContainer: {
    borderRadius: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  characterCount: {
    opacity: 0.7,
  },
  inputContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  textInput: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: "top",
    paddingTop: 10,
  },
});
