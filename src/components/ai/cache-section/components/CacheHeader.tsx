import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import * as React from "react";
import { TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";
import tw from "twrnc";

import { UIText } from "../../../ui/Typography";
import { CacheStats } from "../types";

interface CacheHeaderProps {
  cacheStats: CacheStats;
  hasCache: boolean;
  currentTheme: any;
  t: (key: string, defaultValue: string) => string;
  animatedRefreshStyle: any;
  onRefresh: () => void;
}

const CacheHeader: React.FC<CacheHeaderProps> = ({
  cacheStats,
  hasCache,
  currentTheme,
  t,
  animatedRefreshStyle,
  onRefresh,
}) => {
  return (
    <View style={tw`flex-row items-center justify-between mb-3`}>
      <View style={tw`flex-row items-center`}>
        <View
          style={[
            tw`p-2 rounded-full`,
            {
              backgroundColor: hasCache
                ? `${currentTheme.colors.primary}30`
                : `${currentTheme.colors.surface}30`,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="database"
            size={24}
            color={
              hasCache
                ? currentTheme.colors.primary
                : currentTheme.colors.textSecondary
            }
          />
        </View>
        <View style={tw`ml-3`}>
          <UIText
            size="base"
            weight="semibold"
            color={currentTheme.colors.text}
          >
            {t("aiSettings.cache.subtitle", "Optimisez les performances")}
          </UIText>
          <UIText size="xs" color={currentTheme.colors.textSecondary}>
            {hasCache
              ? `${cacheStats.entryCount} ${t(
                  "aiSettings.cache.entriesCount",
                  "entrées"
                )}`
              : t("aiSettings.cache.noCache", "Cache vide")}
          </UIText>
        </View>
      </View>

      <TouchableOpacity
        onPress={onRefresh}
        style={[
          tw`p-2 rounded-full`,
          { backgroundColor: `${currentTheme.colors.primary}10` },
        ]}
      >
        <Animated.View style={animatedRefreshStyle}>
          <MaterialCommunityIcons
            name="refresh"
            size={20}
            color={currentTheme.colors.primary}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

export default CacheHeader;
