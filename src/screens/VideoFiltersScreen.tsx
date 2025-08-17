import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export const VideoFiltersScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filtres Vidéo en Temps Réel</Text>
        <Text style={styles.subtitle}>
          Testez les filtres de couleurs pour vos vidéos
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.message}>
          Les filtres vidéo sont en cours de développement
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#cccccc",
    textAlign: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  message: {
    fontSize: 18,
    color: "#ffffff",
    textAlign: "center",
  },
});
