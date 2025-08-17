import React from "react";
import { View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Slider from "@react-native-community/slider";
import { UIText } from "../../../components/ui/Typography";
import { useTheme } from "../../../contexts/ThemeContext";
import { Task } from "../../../types/planning";
import { styles } from "../styles";

import { TaskStatusSliderProps } from "../types";

import { STATUS_OPTIONS } from "../constants";
import { getStatusIndex, getStatusFromIndex } from "../utils";

const statusOptions = STATUS_OPTIONS;

export const TaskStatusSlider: React.FC<TaskStatusSliderProps> = ({
  task,
  onStatusChange,
}) => {
  const { currentTheme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        },
      ]}
    >
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={statusOptions.length - 1}
          value={getStatusIndex(task.status)}
          step={1}
          minimumTrackTintColor={currentTheme.colors.primary}
          maximumTrackTintColor={currentTheme.colors.border}
          thumbTintColor={currentTheme.colors.primary}
          onValueChange={(value) => {
            const newStatus = getStatusFromIndex(Math.round(value));
            if (newStatus !== task.status) {
              onStatusChange(newStatus);
            }
          }}
        />

        {/* Status Labels */}
        <View style={styles.statusLabels}>
          {statusOptions.map((option) => (
            <View key={option.value} style={styles.statusLabel}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      task.status === option.value
                        ? option.color
                        : currentTheme.colors.border,
                  },
                ]}
              />
              <UIText
                size="xs"
                weight={task.status === option.value ? "semibold" : "normal"}
                color={
                  task.status === option.value
                    ? option.color
                    : currentTheme.colors.textSecondary
                }
                style={styles.statusLabelText}
              >
                {option.label}
              </UIText>
            </View>
          ))}
        </View>

        {/* Current Status Display */}
        <View style={styles.currentStatusContainer}>
          <View
            style={[
              styles.currentStatusBadge,
              {
                backgroundColor:
                  statusOptions[getStatusIndex(task.status)]?.color + "20",
                borderColor: statusOptions[getStatusIndex(task.status)]?.color,
              },
            ]}
          >
            <Ionicons
              name={statusOptions[getStatusIndex(task.status)]?.icon as any}
              size={16}
              color={statusOptions[getStatusIndex(task.status)]?.color}
            />
            <UIText
              size="sm"
              weight="semibold"
              color={statusOptions[getStatusIndex(task.status)]?.color}
              style={styles.currentStatusText}
            >
              {statusOptions[getStatusIndex(task.status)]?.label}
            </UIText>
          </View>
        </View>
      </View>
    </View>
  );
};
