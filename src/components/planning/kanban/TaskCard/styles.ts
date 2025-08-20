import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },

  // Styles pour carte par défaut
  defaultCard: {
    padding: 12,
    borderWidth: 1,
  },

  // Styles pour carte minimaliste
  minimalCard: {
    padding: 10,
  },

  // Styles pour carte détaillée
  detailedCard: {
    overflow: "hidden",
  },
  detailedHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  detailedIcon: {
    color: "white",
  },
  detailedTitle: {
    flex: 1,
    color: "white",
  },
  editButton: {
    padding: 4,
  },
  detailedContent: {
    padding: 12,
  },

  // Styles pour carte créative
  creativeCard: {
    padding: 12,
    borderRadius: 12,
  },
  creativeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  creativeIcon: {
    color: "white",
  },
  creativeInfo: {
    flex: 1,
  },
  creativeTitle: {
    marginBottom: 4,
  },
  creativeStatus: {
    alignSelf: "flex-start",
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeText: {
    color: "white",
    textTransform: "uppercase",
  },
  creativeDescription: {
    marginBottom: 8,
    lineHeight: 16,
  },
  creativeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 2,
  },
  creativeMetrics: {
    flexDirection: "row",
    gap: 6,
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  metricText: {},

  // Styles communs
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  cardIcon: {},
  cardTitle: {
    flex: 1,
  },
  actionButton: {
    padding: 4,
  },
  description: {
    lineHeight: 16,
    marginBottom: 6,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 2,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  priorityIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    textTransform: "capitalize",
  },
  separator: {},
  timeText: {},
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  statusText: {
    textTransform: "capitalize",
  },
  metadata: {
    gap: 6,
    marginBottom: 8,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metadataText: {},
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 3,
    borderRadius: 1.5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 1.5,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    alignItems: "center",
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {},
  moreTagsText: {},
});
