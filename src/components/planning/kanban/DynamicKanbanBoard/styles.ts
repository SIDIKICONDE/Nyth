import { Platform, StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 0, // Z-index bas pour que les menus contextuels des colonnes passent au-dessus
  },
  addColumnButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: Platform.OS === "ios" ? "solid" : "dashed",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 40,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addColumnIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
