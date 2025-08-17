import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    // La largeur et borderRadius seront fournis par customStyles?.column
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 500,
    height: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    zIndex: 10, // Assure que le header (et donc ColumnMenu) passe au-dessus de la TasksList
  },
  headerLeft: {
    flex: 1,
    marginRight: 6,
  },
  title: {
    // Taille de police gérée par Typography
    // Poids de police géré par Typography
    marginBottom: 0,
  },
  description: {
    // Taille de police gérée par Typography
    lineHeight: 14,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: {
    // Taille de police gérée par Typography
    textAlign: "center",
    // Poids de police géré par Typography
    color: "white",
  },
  columnMenuButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: "rgba(0, 0, 0, 0.05)", // Fond subtil
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)", // Bordure légère
  },
  limitWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginHorizontal: 6,
    borderRadius: 4,
  },
  limitWarningText: {
    // Taille de police gérée par Typography
    // Poids de police géré par Typography
  },
  tasksList: {
    flex: 1,
    maxHeight: 600,
  },
  tasksContent: {
    // Le padding sera fourni par les préférences de layout
  },
  addButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "solid",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    // Taille de police gérée par Typography
    // Poids de police géré par Typography
  },
});
