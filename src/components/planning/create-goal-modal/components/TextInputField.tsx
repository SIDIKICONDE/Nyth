import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View, Animated } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { TextInputFieldProps } from "../types";

export const TextInputField: React.FC<TextInputFieldProps> = React.memo(
  ({
    label,
    required = false,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    multiline = false,
    numberOfLines = 1,
  }) => {
    const { currentTheme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const animatedBorder = React.useRef(new Animated.Value(0)).current;

    const handleFocus = () => {
      setIsFocused(true);
      Animated.spring(animatedBorder, {
        toValue: 1,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();
    };

    const handleBlur = () => {
      setIsFocused(false);
      Animated.spring(animatedBorder, {
        toValue: 0,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();
    };

    const borderColor = animatedBorder.interpolate({
      inputRange: [0, 1],
      outputRange: [currentTheme.colors.border, currentTheme.colors.primary],
    });

    const hasValue = value && value.length > 0;

    return (
      <View style={styles.fieldContainer}>
        <Text
          style={[
            styles.fieldLabel,
            {
              color: isFocused
                ? currentTheme.colors.primary
                : currentTheme.colors.textSecondary,
            },
          ]}
        >
          {label}
          {required && (
            <Text
              style={[
                styles.required,
                { color: currentTheme.colors.error || "#EF4444" },
              ]}
            >
              {" *"}
            </Text>
          )}
        </Text>

        <Animated.View
          style={[
            styles.inputContainer,
            {
              backgroundColor: currentTheme.colors.background,
              borderColor,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              multiline && styles.textArea,
              {
                color: currentTheme.colors.text,
                minHeight: multiline ? numberOfLines * 20 + 16 : 44,
              },
            ]}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            placeholderTextColor={currentTheme.colors.textSecondary}
            keyboardType={keyboardType}
            multiline={multiline}
            numberOfLines={numberOfLines}
            textAlignVertical={multiline ? "top" : "center"}
            returnKeyType={multiline ? "default" : "next"}
            autoCorrect={keyboardType !== "numeric"}
            autoCapitalize={keyboardType === "numeric" ? "none" : "sentences"}
            blurOnSubmit={!multiline}
            enablesReturnKeyAutomatically={true}
            maxLength={multiline ? 200 : 50}
          />
        </Animated.View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  required: {
    fontSize: 14,
    fontWeight: "600",
  },
  inputContainer: {
    borderWidth: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 20,
  },
  textArea: {
    paddingTop: 12,
    paddingBottom: 12,
  },
});
