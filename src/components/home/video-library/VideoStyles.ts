import { StyleSheet } from "react-native";
import { CASSETTE_DEPTH, VIDEO_HEIGHT, VIDEO_WIDTH } from "./VideoDimensions";

export const videoStyles = StyleSheet.create({
  // Conteneur principal de la cassette
  cassetteContainer: {
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    marginHorizontal: 6,
    marginBottom: 6,
    position: "relative",
  },

  // Corps principal de la cassette
  cassetteBody: {
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    borderRadius: 4,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },

  // Effet 3D - côté droit de la cassette
  cassetteSide: {
    position: "absolute",
    top: -2,
    right: -CASSETTE_DEPTH,
    width: CASSETTE_DEPTH,
    height: VIDEO_HEIGHT + 2,
    transform: [{ skewY: "-15deg" }],
    opacity: 0.7,
  },

  // Effet 3D - dessus de la cassette
  cassetteTop: {
    position: "absolute",
    top: -CASSETTE_DEPTH,
    left: 0,
    width: VIDEO_WIDTH,
    height: CASSETTE_DEPTH,
    transform: [{ skewX: "-15deg" }],
    opacity: 0.8,
  },

  // Étiquette de la cassette
  cassetteLabel: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 2,
    padding: 4,
    justifyContent: "space-between",
  },

  // Titre sur l'étiquette
  cassetteTitle: {
    color: "#2C3E50",
    textAlign: "center",
    lineHeight: 12,
    // fontSize et fontWeight supprimés - gérés par UIText
  },

  // Informations en bas de l'étiquette
  cassetteInfo: {
    alignItems: "center",
    marginTop: 2,
  },

  // Durée de la vidéo
  cassetteDuration: {
    color: "#7F8C8D",
    backgroundColor: "#ECF0F1",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    marginBottom: 2,
    // fontSize et fontWeight supprimés - gérés par UIText
  },

  // Date de création
  cassetteDate: {
    color: "#95A5A6",
    // fontSize et fontWeight supprimés - gérés par UIText
  },

  // Indicateur de qualité (LED)
  qualityIndicator: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },

  // Icône de sélection
  selectionIcon: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },

  // Étagère pour les cassettes
  shelf: {
    marginBottom: 8,
    position: "relative",
  },

  // Conteneur des cassettes sur l'étagère
  rowContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 6,
    justifyContent: "space-around",
    alignItems: "center",
    flexWrap: "nowrap",
  },

  // Planche de l'étagère (effet bois)
  shelfBoard: {
    height: 12,
    marginHorizontal: 4,
    borderRadius: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  // Effet de brillance sur la cassette
  cassetteGloss: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "30%",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  // Trous de la cassette (détail réaliste)
  cassetteHoles: {
    position: "absolute",
    bottom: 6,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  cassetteHole: {
    width: 8,
    height: 4,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 2,
  },

  // Nouveaux styles sophistiqués

  // Effet holographique
  holographicOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
    opacity: 0.15,
  },

  // Badge de statut moderne
  statusBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },

  statusBadgeText: {
    color: "#FFFFFF",
    // fontSize et fontWeight supprimés - gérés par UIText
  },

  // Effet de réflexion
  reflection: {
    position: "absolute",
    bottom: -20,
    left: 0,
    right: 0,
    height: 20,
    opacity: 0.15,
    transform: [{ scaleY: -0.5 }],
  },

  // Indicateur de progression
  progressBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },

  progressFill: {
    height: "100%",
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },

  // Animation de pulsation pour la LED
  pulsingLed: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Effet métallique pour l'étagère
  shelfMetallic: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
    opacity: 0.3,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  // Ombre portée sophistiquée
  advancedShadow: {
    position: "absolute",
    bottom: -10,
    left: 10,
    right: 10,
    height: 10,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 50,
    transform: [{ scaleX: 0.8 }],
  },

  // Badge de nouveauté
  newBadge: {
    position: "absolute",
    top: -5,
    left: -5,
    backgroundColor: "#FF4757",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    transform: [{ rotate: "-15deg" }],
    shadowColor: "#FF4757",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },

  newBadgeText: {
    color: "#FFFFFF",
    textTransform: "uppercase",
    // fontSize et fontWeight supprimés - gérés par UIText
  },

  // Effet de grain de film
  filmGrain: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
  },

  // Indicateur de favoris
  favoriteIcon: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255,215,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
  },
});
