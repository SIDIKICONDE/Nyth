import React, { useEffect, useState } from "react";
import { View, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "../hooks/useTranslation";
import { UIText } from "../components/ui/Typography";
import { useUnifiedMemory } from "../hooks/useUnifiedMemory";
import { useNavigation } from "@react-navigation/native";

const MemorySourcesScreen: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { getCitationUsageReport } = useUnifiedMemory();

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<
    | {
        totalUsages: number;
        mostUsedMemories: Array<{ memoryId: string; title: string; usageCount: number }>;
        recentUsages: any[];
        citationStats: {
          totalCitationsRequired: number;
          totalCitationsMade: number;
          complianceRate: number;
        };
      }
    | null
  >(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await getCitationUsageReport();
      setReport(r);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={tw`flex-1`}>
      <View style={tw`px-6 py-4 border-b border-gray-200 dark:border-gray-700`}>
        <View style={tw`flex-row items-center`}>
          <TouchableOpacity onPress={() => (navigation as any).goBack()} style={tw`mr-3`}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={currentTheme.colors.text} />
          </TouchableOpacity>
          <MaterialCommunityIcons name="format-quote-close" size={22} color={currentTheme.colors.primary} style={tw`mr-2`} />
          <UIText size="lg" weight="bold" color={currentTheme.colors.text}>
            {t("aiMemory.citations.title", "Mémoire et sources")}
          </UIText>
        </View>
      </View>

      <ScrollView
        style={tw`flex-1`}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={tw`pb-8`}
      >
        {report ? (
          <View style={tw`px-6 pt-4`}>
            <View
              style={[
                tw`p-4 rounded-xl mb-4`,
                { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.border, borderWidth: 1 },
              ]}
            >
              <UIText weight="semibold" color={currentTheme.colors.text} style={tw`mb-2`}>
                {t("aiMemory.citations.compliance", "Taux de conformité")} : {report.citationStats.complianceRate}%
              </UIText>
              <UIText color={currentTheme.colors.textSecondary}>
                {t("aiMemory.citations.required", "Citations requises")}: {report.citationStats.totalCitationsRequired} · {t("aiMemory.citations.made", "Citations faites")}: {report.citationStats.totalCitationsMade}
              </UIText>
            </View>

            {report.mostUsedMemories.length > 0 && (
              <View style={tw`mb-4`}>
                <UIText weight="semibold" color={currentTheme.colors.text} style={tw`mb-2`}>
                  {t("aiMemory.citations.top", "Sources les plus utilisées")}
                </UIText>
                {report.mostUsedMemories.map((m) => (
                  <View
                    key={m.memoryId}
                    style={[
                      tw`flex-row items-center justify-between p-3 rounded-lg mb-2`,
                      { backgroundColor: currentTheme.colors.background, borderColor: currentTheme.colors.border, borderWidth: 1 },
                    ]}
                  >
                    <UIText color={currentTheme.colors.text} style={tw`flex-1 mr-3`} numberOfLines={1}>
                      {m.title}
                    </UIText>
                    <View style={tw`flex-row items-center`}>
                      <MaterialCommunityIcons name="counter" size={16} color={currentTheme.colors.textSecondary} style={tw`mr-1`} />
                      <UIText color={currentTheme.colors.textSecondary}>{m.usageCount}</UIText>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {report.recentUsages.length > 0 && (
              <View>
                <UIText weight="semibold" color={currentTheme.colors.text} style={tw`mb-2`}>
                  {t("aiMemory.citations.recent", "Utilisations récentes")}
                </UIText>
                {report.recentUsages.map((u, idx) => (
                  <View
                    key={idx}
                    style={[
                      tw`p-3 rounded-lg mb-2`,
                      { backgroundColor: currentTheme.colors.background, borderColor: currentTheme.colors.border, borderWidth: 1 },
                    ]}
                  >
                    <UIText color={currentTheme.colors.text} style={tw`mb-1`} numberOfLines={1}>
                      {u.memoryTitle}
                    </UIText>
                    <UIText size="xs" color={currentTheme.colors.textSecondary}>
                      {new Date(u.timestamp).toLocaleString()} · {u.usageContext}
                    </UIText>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={tw`flex-1 items-center justify-center py-16`}>
            <MaterialCommunityIcons name="history" size={40} color={currentTheme.colors.textSecondary} style={tw`mb-3`} />
            <UIText color={currentTheme.colors.textSecondary}>
              {t("aiMemory.citations.empty", "Aucune source utilisée récemment")}
            </UIText>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default MemorySourcesScreen;