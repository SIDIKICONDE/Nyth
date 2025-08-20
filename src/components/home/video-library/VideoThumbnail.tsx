import React, { useEffect, useState } from "react";
import { Image, View } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { createThumbnail } from "react-native-video-thumbnail";
import tw from "twrnc";
import { useCentralizedFont } from "../../../hooks/useCentralizedFont";
import { UIText } from "../../ui/Typography";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';
const logger = createOptimizedLogger('VideoThumbnail');

interface VideoThumbnailProps {
  videoUri: string;
  width: number;
  height: number;
  showPlayIcon?: boolean;
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  videoUri,
  width,
  height,
  showPlayIcon = true,
}) => {
  const { ui } = useCentralizedFont();
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Générer une miniature de la vidéo avec approche robuste
  const generateThumbnail = async () => {
    try {
      setIsLoading(true);
      setHasError(false);

      logger.debug("🖼️ Génération miniature pour:", videoUri);

      // Vérifier d'abord que le fichier existe
      const RNFS = require("react-native-fs");
      const fileExists = await RNFS.exists(videoUri);

      if (!fileExists) {
        logger.debug("⚠️ Fichier vidéo introuvable:", videoUri);
        setHasError(true);
        return;
      }

      // Essayer plusieurs configurations pour maximiser les chances de succès
      const configs = [
        { timeStamp: 100, quality: 40 }, // Très tôt, basse qualité
        { timeStamp: 500, quality: 50 }, // 0.5s, qualité moyenne
        { timeStamp: 1000, quality: 60 }, // 1s, qualité correcte
      ];

      for (const config of configs) {
        try {
          logger.debug(
            `🔄 Tentative miniature à ${config.timeStamp}ms, qualité ${config.quality}`
          );

          const response = await createThumbnail({
            url: videoUri,
            timeStamp: config.timeStamp,
            quality: config.quality,
            format: "jpeg",
          });

          if (response && response.path) {
            logger.debug("✅ Miniature générée avec succès:", response.path);
            setThumbnailUri(response.path);
            return; // Succès, on sort de la boucle
          }
        } catch (configError) {
          logger.debug(`⚠️ Échec config ${config.timeStamp}ms:`, configError);
          continue; // Essayer la configuration suivante
        }
      }

      // Toutes les configurations ont échoué
      logger.debug("❌ Toutes les tentatives de génération ont échoué");
      setHasError(true);
    } catch (error) {
      logger.debug("⚠️ Erreur génération miniature:", error);
      logger.debug("📝 Détails erreur:", {
        message: error instanceof Error ? error.message : "Erreur inconnue",
        code:
          typeof error === "object" && error !== null && "code" in error
            ? error.code
            : "N/A",
        videoUri: videoUri,
      });
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateThumbnail();
  }, [videoUri]);

  // Vue de chargement avec animation rétro
  if (isLoading) {
    return (
      <View
        style={[
          tw`items-center justify-center rounded`,
          {
            width,
            height,
            backgroundColor: "rgba(0,0,0,0.1)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
          },
        ]}
      >
        <View style={tw`items-center`}>
          <MaterialCommunityIcons
            name="cassette"
            size={20}
            color="rgba(255,255,255,0.6)"
          />
          <View style={tw`flex-row items-center mt-1`}>
            <MaterialCommunityIcons
              name="loading"
              size={12}
              color="rgba(255,255,255,0.5)"
            />
            <UIText
              size="xs"
              weight="medium"
              style={[ui, tw`ml-1`, { color: "rgba(255,255,255,0.5)" }]}
            >
              ...
            </UIText>
          </View>
        </View>
      </View>
    );
  }

  // Vue d'erreur avec design de cassette VHS rétro élégant
  if (hasError || !thumbnailUri) {
    return (
      <View
        style={[
          tw`items-center justify-center rounded relative overflow-hidden`,
          {
            width,
            height,
            backgroundColor: "rgba(20,20,20,0.8)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.15)",
          },
        ]}
      >
        {/* Fond avec texture VHS */}
        <View
          style={[
            tw`absolute inset-0`,
            {
              backgroundColor: "rgba(10,10,10,0.9)",
            },
          ]}
        />

        {/* Lignes de texture VHS */}
        {[...Array(6)].map((_, i) => (
          <View
            key={i}
            style={[
              tw`absolute w-full opacity-10`,
              {
                height: 1,
                backgroundColor: "#fff",
                top: (height / 6) * i,
              },
            ]}
          />
        ))}

        {/* Contenu principal */}
        <View style={tw`items-center z-10`}>
          <MaterialCommunityIcons
            name="cassette"
            size={Math.min(width * 0.4, 28)}
            color="rgba(255,255,255,0.8)"
          />
          <UIText
            size="xs"
            weight="medium"
            style={[
              ui,
              tw`mt-1 text-center`,
              {
                color: "rgba(255,255,255,0.7)",
                fontSize: Math.min(width * 0.08, 10),
              },
            ]}
          >
            VHS
          </UIText>
        </View>

        {/* Effet de brillance VHS */}
        <View
          style={[
            tw`absolute top-0 left-0 right-0`,
            {
              height: height * 0.3,
              backgroundColor: "rgba(255,255,255,0.03)",
            },
          ]}
        />
      </View>
    );
  }

  // Vue avec miniature générée
  return (
    <View style={[tw`relative rounded overflow-hidden`, { width, height }]}>
      <Image
        source={{ uri: thumbnailUri }}
        style={{ width, height }}
        resizeMode="cover"
        onError={(error) => {
          logger.debug("❌ Erreur chargement miniature générée:", error);
          setHasError(true);
        }}
      />

      {/* Overlay sombre pour améliorer la lisibilité */}
      <View
        style={[tw`absolute inset-0`, { backgroundColor: "rgba(0,0,0,0.1)" }]}
      />

      {/* Icône de lecture avec effet de verre moderne */}
      {showPlayIcon && (
        <View style={tw`absolute inset-0 items-center justify-center`}>
          {/* Effet de flou derrière l'icône */}
          <View
            style={[
              tw`absolute`,
              {
                width: Math.min(width * 0.25, 40),
                height: Math.min(width * 0.25, 40),
                borderRadius: Math.min(width * 0.125, 20),
                backgroundColor: "rgba(0,0,0,0.2)",
                transform: [{ scale: 1.2 }],
              },
            ]}
          />

          {/* Bouton de lecture principal */}
          <View
            style={[
              tw`rounded-full items-center justify-center`,
              {
                backgroundColor: "rgba(255,255,255,0.95)",
                width: Math.min(width * 0.2, 32),
                height: Math.min(width * 0.2, 32),
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.4,
                shadowRadius: 4,
                elevation: 5,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.3)",
              },
            ]}
          >
            <MaterialCommunityIcons
              name="play"
              size={Math.min(width * 0.12, 18)}
              color="#2C3E50"
              style={{ marginLeft: 1 }} // Centrer visuellement l'icône
            />
          </View>
        </View>
      )}

      {/* Effet de pellicule subtil */}
      <View
        style={tw`absolute top-0 left-0 right-0 h-0.5 bg-white opacity-20`}
      />
      <View
        style={tw`absolute bottom-0 left-0 right-0 h-0.5 bg-white opacity-20`}
      />
    </View>
  );
};
