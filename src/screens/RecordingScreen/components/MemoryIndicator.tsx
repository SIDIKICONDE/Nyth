import React from "react";
import { View, TouchableOpacity, Animated } from "react-native";
import tw from "twrnc";
import { UIText } from "@/components/ui/Typography";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";

interface MemoryStats {
  used: number;
  total: number;
  available: number;
  percentage: number;
  trend: "stable" | "increasing" | "decreasing";
}

interface MemoryIndicatorProps {
  memoryStats: MemoryStats;
  memoryStatus: "good" | "warning" | "critical";
  isVisible: boolean;
  onOptimize?: () => void;
  formatMemorySize: (bytes: number) => string;
  compact?: boolean;
}

export function MemoryIndicator({
  memoryStats,
  memoryStatus,
  isVisible,
  onOptimize,
  formatMemorySize,
  compact = false,
}: MemoryIndicatorProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  if (!isVisible) return null;

  // Couleurs selon le statut
  const getStatusColor = () => {
    switch (memoryStatus) {
      case "good":
        return "#10B981"; // Vert
      case "warning":
        return "#F59E0B"; // Orange
      case "critical":
        return "#EF4444"; // Rouge
      default:
        return "#6B7280"; // Gris
    }
  };

  // Icône selon le statut
  const getStatusIcon = () => {
    switch (memoryStatus) {
      case "good":
        return "💚";
      case "warning":
        return "⚠️";
      case "critical":
        return "🚨";
      default:
        return "📊";
    }
  };

  // Icône de tendance
  const getTrendIcon = () => {
    switch (memoryStats.trend) {
      case "increasing":
        return "📈";
      case "decreasing":
        return "📉";
      case "stable":
        return "➡️";
      default:
        return "";
    }
  };

  const statusColor = getStatusColor();
  const statusIcon = getStatusIcon();
  const trendIcon = getTrendIcon();

  if (compact) {
    return (
      <View
        style={[
          tw`absolute top-4 right-4 bg-black bg-opacity-60 rounded-lg px-3 py-2 flex-row items-center`,
          { borderLeftWidth: 3, borderLeftColor: statusColor },
        ]}
      >
        <UIText size="xs" style={tw`text-white font-mono`}>
          {statusIcon} {memoryStats.percentage.toFixed(0)}% {trendIcon}
        </UIText>

        {memoryStatus !== "good" && onOptimize && (
          <TouchableOpacity
            onPress={onOptimize}
            style={[
              tw`ml-2 px-2 py-1 rounded`,
              { backgroundColor: statusColor },
            ]}
          >
            <UIText size="xs" style={tw`text-white font-semibold`}>
              {t("recording.memory.optimize", "OPT")}
            </UIText>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        tw`absolute top-4 right-4 bg-black bg-opacity-80 rounded-lg p-4 min-w-48`,
        { borderLeftWidth: 4, borderLeftColor: statusColor },
      ]}
    >
      {/* En-tête */}
      <View style={tw`flex-row items-center justify-between mb-2`}>
        <View style={tw`flex-row items-center`}>
          <UIText size="sm" style={tw`text-white font-semibold mr-2`}>
            {statusIcon}
          </UIText>
          <UIText size="sm" style={tw`text-white font-semibold`}>
            {t("recording.memory.title", "Mémoire")}
          </UIText>
        </View>
        <UIText size="xs" style={tw`text-gray-300`}>
          {trendIcon}
        </UIText>
      </View>

      {/* Barre de progression */}
      <View style={tw`bg-gray-700 h-2 rounded-full mb-2 overflow-hidden`}>
        <Animated.View
          style={[
            tw`h-full rounded-full`,
            {
              backgroundColor: statusColor,
              width: `${Math.min(memoryStats.percentage, 100)}%`,
            },
          ]}
        />
      </View>

      {/* Statistiques */}
      <View style={tw`flex-row justify-between items-center mb-2`}>
        <UIText size="xs" style={tw`text-gray-300 font-mono`}>
          {memoryStats.percentage.toFixed(1)}%
        </UIText>
        <UIText size="xs" style={tw`text-gray-300 font-mono`}>
          {formatMemorySize(memoryStats.used)} /{" "}
          {formatMemorySize(memoryStats.total)}
        </UIText>
      </View>

      {/* Message de statut */}
      <UIText size="xs" style={[tw`text-center mb-2`, { color: statusColor }]}>
        {getStatusMessage()}
      </UIText>

      {/* Bouton d'optimisation si nécessaire */}
      {memoryStatus !== "good" && onOptimize && (
        <TouchableOpacity
          onPress={onOptimize}
          style={[tw`py-2 px-4 rounded-full`, { backgroundColor: statusColor }]}
        >
          <UIText size="xs" style={tw`text-white font-semibold text-center`}>
            {memoryStatus === "critical"
              ? t("recording.memory.optimizeNow", "Optimiser Maintenant")
              : t("recording.memory.optimize", "Optimiser")}
          </UIText>
        </TouchableOpacity>
      )}

      {/* Informations de debug en mode développement */}
      {__DEV__ && (
        <View style={tw`mt-2 pt-2 border-t border-gray-600`}>
          <UIText size="xs" style={tw`text-gray-400 text-center`}>
            Debug: {formatMemorySize(memoryStats.available)} libre
          </UIText>
        </View>
      )}
    </View>
  );

  function getStatusMessage(): string {
    switch (memoryStatus) {
      case "good":
        return t("recording.memory.status.good", "Mémoire OK");
      case "warning":
        return t("recording.memory.status.warning", "Mémoire faible");
      case "critical":
        return t("recording.memory.status.critical", "Mémoire critique");
      default:
        return t("recording.memory.status.unknown", "État inconnu");
    }
  }
}
