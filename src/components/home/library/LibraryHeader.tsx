import React from "react";
import { View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";

interface LibraryHeaderProps {
  scriptsCount: number;
}

export const LibraryHeader: React.FC<LibraryHeaderProps> = ({
  scriptsCount,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={tw`px-4 py-1`}>
      {/* En-tête minimal - juste un espacement */}
    </View>
  );
};
