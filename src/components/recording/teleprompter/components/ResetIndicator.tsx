import React from "react";
import { Text, View } from "react-native";
import tw from "twrnc";
import { useTranslation } from "../../../../hooks/useTranslation";

interface ResetIndicatorProps {
  showResetIndicator: boolean;
}

export const ResetIndicator: React.FC<ResetIndicatorProps> = ({
  showResetIndicator,
}) => {
  const { t } = useTranslation();

  if (!showResetIndicator) return null;

  return (
    <View
      style={[
        tw`absolute inset-0 bg-black/50 justify-center items-center rounded-xl`,
        { zIndex: 3 },
      ]}
    >
      <View
        style={[
          tw`bg-green-500 px-4 py-2 rounded-lg flex-row items-center`,
          {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          },
        ]}
      >
        <View style={tw`w-3 h-3 bg-white rounded-full mr-2`} />
        <Text style={tw`text-white font-bold text-sm`}>
          {t("recording.teleprompter.positionReset")}
        </Text>
      </View>
    </View>
  );
};
