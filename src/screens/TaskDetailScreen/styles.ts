import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 100, // Espace pour le footer
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    minHeight: 60,
  },
  cardHeader: {
    marginBottom: 12,
  },
  statusGrid: {
    gap: 8,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  sliderContainer: {
    paddingTop: 8,
    paddingBottom: 4,
    minHeight: 60,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderThumb: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#3B82F6",
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  statusLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 0,
  },
  statusLabel: {
    alignItems: "center",
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusLabelText: {
    textAlign: "center",
  },
  currentStatusContainer: {
    alignItems: "center",
    marginTop: 6,
  },
  currentStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  currentStatusText: {
    textAlign: "center",
  },
  detailRow: {
    marginBottom: 12,
  },
  detailValue: {
    marginTop: 4,
  },
  priorityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  attachmentTypeLabel: {
    marginBottom: 4,
  },
  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    gap: 6,
  },
  attachmentName: {
    flex: 1,
  },
  attachmentsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  attachmentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  menuContainer: {
    position: "absolute",
    top: 80,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 12,
  },
  menuItemText: {
    flex: 1,
  },
  // Styles flottants pour TaskAttachmentsCard
  floatingCard: {
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 4,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingCardHeader: {
    marginBottom: 8,
  },
  floatingAttachmentsContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  floatingAttachmentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    justifyContent: "center",
  },
  // Style pour le footer
  footerCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 16,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  // Styles pour le footer divisé
  footerHeader: {
    marginBottom: 12,
    alignItems: "center",
  },
  footerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeftSection: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-start",
  },
  footerRightSection: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  footerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    justifyContent: "center",
  },
  emptyText: {
    fontStyle: "italic",
    opacity: 0.6,
  },
  footerSection: {
    flex: 1,
    alignItems: "center",
  },
  sectionTitle: {
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Styles modernes pour le header
  modernHeader: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modernBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modernHeaderTitle: {
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
    marginBottom: 4,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "500",
  },
  modernActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  // Styles pour la description sans titre
  descriptionContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  descriptionText: {
    lineHeight: 22,
    textAlign: "justify",
  },
  // Styles pour les sous-tâches (anciens - à garder pour compatibilité)
  subtaskItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  subtaskCheckbox: {
    padding: 4,
  },
  // Nouveaux styles pour la section sous-tâches moderne
  subtasksCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  subtasksHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  subtasksHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  subtasksIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    alignItems: "center",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 16,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
    // transition: "width 0.3s ease", // Non supporté sur React Native
  },
  subtasksList: {
    gap: 0,
  },
  subtaskItemModern: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 12,
  },
  subtaskCheckboxModern: {
    paddingTop: 2,
  },
  subtaskContent: {
    flex: 1,
    gap: 4,
  },
  subtaskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  subtaskSeparator: {
    height: 1,
    marginLeft: 48,
    marginRight: 8,
  },
});
