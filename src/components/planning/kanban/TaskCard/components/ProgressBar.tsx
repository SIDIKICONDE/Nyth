import React from "react";
import { View } from "react-native";
import { styles } from "../styles";
import { ProgressBarProps } from "../types";
import { getProgressPercentage } from "../utils";

export const ProgressBar: React.FC<ProgressBarProps> = ({
  status,
  cardColor,
  themeColors,
}) => {
  const progressPercentage = getProgressPercentage(status);

  return (
    <View style={styles.progressContainer}>
      <View
        style={[styles.progressBar, { backgroundColor: themeColors.border }]}
      >
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: cardColor,
              width: `${progressPercentage}%`,
            },
          ]}
        />
      </View>
    </View>
  );
};
