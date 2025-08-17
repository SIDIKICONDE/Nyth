import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import React, { useRef, useEffect } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { UIText } from "../../../../../components/ui/Typography";
import { PERIOD_OPTIONS } from "../constants";
import { PeriodType } from "../types";

const { width: screenWidth } = Dimensions.get("window");

interface PeriodSelectorProps {
  selectedPeriod: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  // Animation values pour chaque bouton
  const animatedValues = useRef(
    PERIOD_OPTIONS.reduce((acc, option) => {
      acc[option.key] = {
        scale: new Animated.Value(option.key === selectedPeriod ? 1 : 0.98),
      };
      return acc;
    }, {} as Record<PeriodType, { scale: Animated.Value }>)
  ).current;

  useEffect(() => {
    // Animer tous les boutons quand la sélection change
    PERIOD_OPTIONS.forEach((option) => {
      const isSelected = option.key === selectedPeriod;
      const { scale } = animatedValues[option.key];

      Animated.spring(scale, {
        toValue: isSelected ? 1 : 0.98,
        useNativeDriver: true,
        tension: 300,
        friction: 15,
      }).start();
    });
  }, [selectedPeriod]);

  const handlePeriodPress = (period: PeriodType) => {
    // Animation de feedback tactile rapide
    const { scale } = animatedValues[period];

    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: period === selectedPeriod ? 1 : 0.98,
        useNativeDriver: true,
        tension: 300,
        friction: 15,
      }),
    ]).start();

    onPeriodChange(period);
  };

  const renderPeriodButton = (option: {
    key: PeriodType;
    label: string;
    icon: string;
  }) => {
    const isSelected = selectedPeriod === option.key;
    const { scale } = animatedValues[option.key];

    return (
      <TouchableOpacity
        key={option.key}
        onPress={() => handlePeriodPress(option.key)}
        activeOpacity={0.7}
        style={styles.buttonContainer}
      >
        <Animated.View
          style={[
            styles.periodButton,
            {
              backgroundColor: isSelected
                ? currentTheme.colors.primary
                : currentTheme.colors.surface,
              borderColor: isSelected
                ? currentTheme.colors.primary
                : currentTheme.colors.border,
              transform: [{ scale }],
            },
          ]}
        >
          {/* Icône et texte en ligne */}
          <View style={styles.buttonContent}>
            <Ionicons
              name={option.icon as any}
              size={14}
              color={isSelected ? "#FFFFFF" : currentTheme.colors.primary}
              style={styles.buttonIcon}
            />
            <UIText
              size="xs"
              weight={isSelected ? "bold" : "medium"}
              style={[
                styles.buttonText,
                {
                  color: isSelected ? "#FFFFFF" : currentTheme.colors.text,
                },
              ]}
            >
              {t(`planning.analytics.periods.${option.key}`, option.label)}
            </UIText>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Container des boutons avec scroll horizontal */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        style={styles.scrollView}
        decelerationRate="fast"
      >
        {PERIOD_OPTIONS.map(renderPeriodButton)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  scrollView: {
    marginHorizontal: -2,
  },
  scrollContainer: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  buttonContainer: {
    marginHorizontal: 2,
  },
  periodButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 70,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonText: {
    fontSize: 11,
  },
});
