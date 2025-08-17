import React from "react";
import { ActivityIndicator, View } from "react-native";
import { styles } from "../styles";

interface LoadingStateProps {
  themeColors: any;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ themeColors }) => {
  return (
    <View
      style={[
        styles.container,
        styles.loadingContainer,
        { backgroundColor: themeColors.background },
      ]}
    >
      <ActivityIndicator size="large" color={themeColors.primary} />
    </View>
  );
};
