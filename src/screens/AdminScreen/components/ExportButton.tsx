import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";
import RNFS from "react-native-fs";
import Share from "react-native-share";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../../contexts/ThemeContext";

import { createOptimizedLogger } from "../../../utils/optimizedLogger";
const logger = createOptimizedLogger("ExportButton");

interface ExportButtonProps {
  data: any[];
  filename: string;
  headers: { key: string; label: string }[];
  compact?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  filename,
  headers,
  compact,
}) => {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const [exporting, setExporting] = useState(false);

  const convertToCSV = (
    data: any[],
    headers: { key: string; label: string }[]
  ) => {
    // En-têtes CSV
    const csvHeaders = headers.map((h) => h.label).join(",");

    // Lignes de données
    const csvRows = data.map((item) => {
      return headers
        .map((header) => {
          const value = item[header.key];
          // Échapper les virgules et guillemets dans les valeurs
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || "";
        })
        .join(",");
    });

    return [csvHeaders, ...csvRows].join("\n");
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      // Convertir les données en CSV
      const csvContent = convertToCSV(data, headers);

      // Créer le fichier
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `${filename}_${timestamp}.csv`;
      const fileUri = RNFS.DocumentDirectoryPath + fileName;

      // Écrire le fichier
      await RNFS.writeFile(fileUri, csvContent, {
        encoding: "utf8",
      });

      // Utiliser react-native-share directement
      await Share.open({
        url: fileUri,
        type: "text/csv",
        title: "Exporter les données",
      });
    } catch (error) {
      logger.error("Erreur lors de l'export:", error);
      Alert.alert("Erreur", "Impossible d'exporter les données", [
        { text: "OK" },
      ]);
    } finally {
      setExporting(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        compact ? styles.buttonCompact : null,
        { backgroundColor: colors.primary },
      ]}
      onPress={handleExport}
      disabled={exporting || data.length === 0}
    >
      <Ionicons
        name="download-outline"
        size={compact ? 16 : 20}
        color={colors.background}
      />
      <Text
        style={[
          styles.buttonText,
          compact ? styles.buttonTextCompact : null,
          { color: colors.background },
        ]}
      >
        Exporter CSV
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  buttonCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  buttonTextCompact: {
    fontSize: 12,
    fontWeight: "600",
  },
});
