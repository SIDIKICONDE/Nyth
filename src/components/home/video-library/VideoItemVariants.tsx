import React from 'react';
import { View } from 'react-native';
import { VideoItem } from './VideoItem';
import { Recording, Script } from '../../../types';
import { InfoTooltip, GestureTooltip } from '../../ui/Tooltip';
import { LoadingIndicator, StatusIndicator } from '../../ui/ProgressIndicators';
import { SkeletonVideoItem } from '../../ui/SkeletonLoading';
import tw from 'twrnc';

interface VideoItemVariantsProps {
  recording: Recording;
  scripts: Script[];
  onPress: () => void;
  onLongPress: () => void;
  isSelected: boolean;
  onToggleSelection?: () => void;
  isSelectionModeActive: boolean;
  index: number;
}

// Variante compacte pour les grilles denses
export const CompactVideoItem: React.FC<VideoItemVariantsProps> = (props) => {
  return (
    <View style={tw`scale-75`}>
      <VideoItem {...props} />
    </View>
  );
};

// Variante avec tooltips informatifs
export const InteractiveVideoItem: React.FC<VideoItemVariantsProps> = (props) => {
  return (
    <GestureTooltip
      gesture="tap"
      customMessage="Appuyez pour lire cette vidéo"
    >
      <View>
        <VideoItem {...props} />
      </View>
    </GestureTooltip>
  );
};

// Variante avec indicateurs de chargement
export const LoadingVideoItem: React.FC<{
  recording: Recording;
  scripts: Script[];
  isLoading: boolean;
  loadingMessage?: string;
}> = ({ recording, scripts, isLoading, loadingMessage = "Chargement de la vidéo..." }) => {
  if (isLoading) {
    return (
      <View style={tw`relative`}>
        <SkeletonVideoItem />
        <View style={tw`absolute inset-0 items-center justify-center bg-black bg-opacity-50 rounded`}>
          <LoadingIndicator
            size="small"
            message={loadingMessage}
            type="spinner"
          />
        </View>
      </View>
    );
  }

  return <VideoItem recording={recording} scripts={scripts} onPress={() => {}} onLongPress={() => {}} isSelected={false} isSelectionModeActive={false} index={0} />;
};

// Variante pour la vue liste (détails horizontaux)
export const ListVideoItem: React.FC<VideoItemVariantsProps & {
  showDetails?: boolean;
}> = ({ showDetails = true, ...props }) => {
  return (
    <View style={tw`flex-row items-center p-3 rounded-lg bg-surface-10 mb-2`}>
      <View style={tw`mr-3`}>
        <VideoItem {...props} />
      </View>

      {showDetails && (
        <View style={tw`flex-1`}>
          <InfoTooltip
            info={`Durée: ${props.recording.duration}s - Qualité: ${props.recording.quality}`}
            position="top"
          >
            <View>
              {/* Détails de la vidéo */}
            </View>
          </InfoTooltip>
        </View>
      )}
    </View>
  );
};

// Variante pour la vue carte (plus d'informations)
export const CardVideoItem: React.FC<VideoItemVariantsProps & {
  showMetadata?: boolean;
}> = ({ showMetadata = true, ...props }) => {
  return (
    <View style={tw`p-4 rounded-xl bg-surface-20 mb-4`}>
      <VideoItem {...props} />

      {showMetadata && (
        <View style={tw`mt-4 p-3 rounded-lg bg-surface-10`}>
          <InfoTooltip
            info="Métadonnées de la vidéo"
            position="bottom"
          >
            <View>
              {/* Métadonnées supplémentaires */}
            </View>
          </InfoTooltip>
        </View>
      )}
    </View>
  );
};

// Variante pour la vue miniature
export const MiniVideoItem: React.FC<VideoItemVariantsProps> = (props) => {
  return (
    <View style={tw`scale-50`}>
      <VideoItem {...props} />
    </View>
  );
};

// Variante avec actions contextuelles
export const ActionableVideoItem: React.FC<VideoItemVariantsProps & {
  showQuickActions?: boolean;
}> = ({ showQuickActions = true, ...props }) => {
  return (
    <View style={tw`relative`}>
      <VideoItem {...props} />

      {showQuickActions && (
        <View style={tw`absolute top-2 right-2 flex-row`}>
          <InfoTooltip
            info="Sauvegarder dans la galerie"
            position="left"
          >
            <View style={tw`w-8 h-8 rounded-full bg-success-20 items-center justify-center mr-2`}>
              {/* Icône de sauvegarde */}
            </View>
          </InfoTooltip>

          <InfoTooltip
            info="Partager cette vidéo"
            position="left"
          >
            <View style={tw`w-8 h-8 rounded-full bg-primary-20 items-center justify-center`}>
              {/* Icône de partage */}
            </View>
          </InfoTooltip>
        </View>
      )}
    </View>
  );
};

// Variante pour les vidéos récentes
export const RecentVideoItem: React.FC<VideoItemVariantsProps & {
  isRecent?: boolean;
}> = ({ isRecent, ...props }) => {
  return (
    <View style={tw`relative`}>
      <VideoItem {...props} />

      {isRecent && (
        <View style={tw`absolute -top-2 -left-2`}>
          <InfoTooltip
            info="Vidéo ajoutée récemment"
            position="right"
          >
            <View style={tw`px-2 py-1 rounded-full bg-success`}>
              {/* Badge RECENT */}
            </View>
          </InfoTooltip>
        </View>
      )}
    </View>
  );
};

// Variante pour les vidéos en cours de téléchargement
export const DownloadingVideoItem: React.FC<VideoItemVariantsProps & {
  downloadProgress?: number;
  isDownloading?: boolean;
}> = ({ downloadProgress = 0, isDownloading, ...props }) => {
  return (
    <View style={tw`relative`}>
      <VideoItem {...props} />

      {isDownloading && (
        <View style={tw`absolute inset-0 rounded bg-black bg-opacity-70 items-center justify-center`}>
          <StatusIndicator
            status="loading"
            message={`Téléchargement... ${Math.round(downloadProgress * 100)}%`}
          />
        </View>
      )}
    </View>
  );
};

// Variante pour les vidéos avec overlay
export const OverlayVideoItem: React.FC<VideoItemVariantsProps> = (props) => {
  const hasOverlay = props.recording.hasOverlay;

  return (
    <View style={tw`relative`}>
      <VideoItem {...props} />

      {hasOverlay && (
        <View style={tw`absolute top-2 left-2`}>
          <InfoTooltip
            info="Cette vidéo contient un overlay"
            position="right"
          >
            <View style={tw`px-2 py-1 rounded bg-accent`}>
              {/* Badge OVERLAY */}
            </View>
          </InfoTooltip>
        </View>
      )}
    </View>
  );
};

// Variante pour les vidéos de haute qualité
export const PremiumVideoItem: React.FC<VideoItemVariantsProps> = (props) => {
  const isHighQuality = props.recording.quality === 'high';

  return (
    <View style={tw`relative`}>
      <VideoItem {...props} />

      {isHighQuality && (
        <View style={tw`absolute top-2 left-2`}>
          <InfoTooltip
            info="Vidéo haute qualité"
            position="right"
          >
            <View style={tw`px-2 py-1 rounded bg-warning`}>
              {/* Badge HD */}
            </View>
          </InfoTooltip>
        </View>
      )}
    </View>
  );
};

// Factory pour créer la variante appropriée
export const createVideoItemVariant = (
  variant: 'compact' | 'interactive' | 'list' | 'card' | 'mini' | 'actionable' | 'recent' | 'downloading' | 'overlay' | 'premium' | 'default' = 'default',
  props: VideoItemVariantsProps & any
) => {
  switch (variant) {
    case 'compact':
      return <CompactVideoItem {...props} />;
    case 'interactive':
      return <InteractiveVideoItem {...props} />;
    case 'list':
      return <ListVideoItem {...props} />;
    case 'card':
      return <CardVideoItem {...props} />;
    case 'mini':
      return <MiniVideoItem {...props} />;
    case 'actionable':
      return <ActionableVideoItem {...props} />;
    case 'recent':
      return <RecentVideoItem {...props} />;
    case 'downloading':
      return <DownloadingVideoItem {...props} />;
    case 'overlay':
      return <OverlayVideoItem {...props} />;
    case 'premium':
      return <PremiumVideoItem {...props} />;
    default:
      return <VideoItem {...props} />;
  }
};

// Hook pour déterminer la variante appropriée selon le contexte
export const useVideoItemVariant = (context: 'grid' | 'timeline' | 'search' | 'downloads' | 'premium') => {
  switch (context) {
    case 'grid':
      return 'interactive';
    case 'timeline':
      return 'list';
    case 'search':
      return 'card';
    case 'downloads':
      return 'downloading';
    case 'premium':
      return 'premium';
    default:
      return 'default';
  }
};
