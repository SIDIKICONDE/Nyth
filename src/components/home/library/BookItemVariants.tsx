import React from 'react';
import { View } from 'react-native';
import { BookItem } from './BookItem';
import { Script } from '../../../types';
import { InfoTooltip, GestureTooltip } from '../../ui/Tooltip';
import { LoadingIndicator } from '../../ui/ProgressIndicators';
import { SkeletonBookItem } from '../../ui/SkeletonLoading';
import tw from 'twrnc';

interface BookItemVariantsProps {
  script: Script;
  onPress: () => void;
  onLongPress: () => void;
  isSelected: boolean;
  onToggleSelection?: () => void;
  isSelectionModeActive: boolean;
  index: number;
  onScriptShare?: (scriptId: string) => void;
  onScriptDuplicate?: (scriptId: string) => void;
  onScriptExport?: (scriptId: string) => void;
  onScriptDelete?: (scriptId: string) => void;
  onToggleFavorite?: (scriptId: string) => void;
}

// Variante compacte pour les grilles denses
export const CompactBookItem: React.FC<BookItemVariantsProps> = (props) => {
  return (
    <View style={tw`scale-75`}>
      <BookItem {...props} />
    </View>
  );
};

// Variante avec tooltips informatifs
export const InteractiveBookItem: React.FC<BookItemVariantsProps> = (props) => {
  return (
    <GestureTooltip gesture="longPress" customMessage="Appuyez longuement pour sélectionner plusieurs scripts">
      <View>
        <BookItem {...props} />
      </View>
    </GestureTooltip>
  );
};

// Variante avec indicateurs de chargement
export const LoadingBookItem: React.FC<{
  script: Script;
  isLoading: boolean;
  loadingMessage?: string;
}> = ({ script, isLoading, loadingMessage = "Chargement..." }) => {
  if (isLoading) {
    return (
      <View style={tw`relative`}>
        <SkeletonBookItem />
        <View style={tw`absolute inset-0 items-center justify-center`}>
          <LoadingIndicator
            size="small"
            message={loadingMessage}
            type="spinner"
          />
        </View>
      </View>
    );
  }

  return null; // Ce composant ne gère que l'état de chargement
};

// Variante pour la vue liste (horizontal)
export const ListBookItem: React.FC<BookItemVariantsProps> = (props) => {
  return (
    <View style={tw`flex-row items-center p-4 rounded-lg bg-surface-10 mb-2`}>
      <View style={tw`flex-1`}>
        <BookItem {...props} />
      </View>
    </View>
  );
};

// Variante pour la vue carte (plus d'informations)
export const CardBookItem: React.FC<BookItemVariantsProps & {
  showDetails?: boolean;
}> = ({ showDetails = true, ...props }) => {
  return (
    <View style={tw`p-4 rounded-xl bg-surface-20 mb-4`}>
      <BookItem {...props} />

      {showDetails && (
        <View style={tw`mt-4 p-3 rounded-lg bg-surface-10`}>
          <InfoTooltip
            info="Informations détaillées du script"
            position="bottom"
          >
            <View>
              {/* Détails supplémentaires */}
            </View>
          </InfoTooltip>
        </View>
      )}
    </View>
  );
};

// Variante pour la vue miniature (très compacte)
export const MiniBookItem: React.FC<BookItemVariantsProps> = (props) => {
  return (
    <View style={tw`scale-50`}>
      <BookItem {...props} />
    </View>
  );
};

// Variante avec actions contextuelles
export const ActionableBookItem: React.FC<BookItemVariantsProps & {
  showQuickActions?: boolean;
}> = ({ showQuickActions = true, ...props }) => {
  return (
    <View style={tw`relative`}>
      <BookItem {...props} />

      {showQuickActions && props.onScriptShare && (
        <View style={tw`absolute top-2 right-2 flex-row`}>
          <InfoTooltip
            info="Partager ce script"
            position="left"
          >
            <View style={tw`w-8 h-8 rounded-full bg-primary-20 items-center justify-center mr-2`}>
              {/* Icône de partage */}
            </View>
          </InfoTooltip>

          {props.onToggleFavorite && (
            <InfoTooltip
              info="Ajouter aux favoris"
              position="left"
            >
              <View style={tw`w-8 h-8 rounded-full bg-secondary-20 items-center justify-center`}>
                {/* Icône de favori */}
              </View>
            </InfoTooltip>
          )}
        </View>
      )}
    </View>
  );
};

// Variante pour les favoris (mise en avant)
export const FavoriteBookItem: React.FC<BookItemVariantsProps> = (props) => {
  const isFavorite = props.script.isFavorite;

  return (
    <View style={tw`relative`}>
      <BookItem {...props} />

      {isFavorite && (
        <View style={tw`absolute -top-2 -right-2`}>
          <InfoTooltip
            info="Script favori"
            position="bottom"
          >
            <View style={tw`w-6 h-6 rounded-full bg-warning items-center justify-center`}>
              {/* Badge de favori */}
            </View>
          </InfoTooltip>
        </View>
      )}
    </View>
  );
};

// Variante pour les nouveaux scripts
export const NewBookItem: React.FC<BookItemVariantsProps & {
  isNew?: boolean;
}> = ({ isNew, ...props }) => {
  return (
    <View style={tw`relative`}>
      <BookItem {...props} />

      {isNew && (
        <View style={tw`absolute -top-3 left-1/2 -ml-8`}>
          <InfoTooltip
            info="Nouveau script ajouté récemment"
            position="top"
          >
            <View style={tw`px-3 py-1 rounded-full bg-success`}>
              {/* Badge NEW */}
            </View>
          </InfoTooltip>
        </View>
      )}
    </View>
  );
};

// Variante pour les scripts en cours d'édition
export const EditingBookItem: React.FC<BookItemVariantsProps & {
  isEditing?: boolean;
}> = ({ isEditing, ...props }) => {
  return (
    <View style={tw`relative`}>
      <BookItem {...props} />

      {isEditing && (
        <View style={tw`absolute inset-0 rounded-lg bg-primary-10 border-2 border-primary`}>
          <View style={tw`absolute top-2 right-2`}>
            <LoadingIndicator
              size="small"
              type="pulse"
              message="Modification en cours..."
            />
          </View>
        </View>
      )}
    </View>
  );
};

// Factory pour créer la variante appropriée
export const createBookItemVariant = (
  variant: 'compact' | 'interactive' | 'list' | 'card' | 'mini' | 'actionable' | 'favorite' | 'new' | 'editing' | 'default' = 'default',
  props: BookItemVariantsProps & any
) => {
  switch (variant) {
    case 'compact':
      return <CompactBookItem {...props} />;
    case 'interactive':
      return <InteractiveBookItem {...props} />;
    case 'list':
      return <ListBookItem {...props} />;
    case 'card':
      return <CardBookItem {...props} />;
    case 'mini':
      return <MiniBookItem {...props} />;
    case 'actionable':
      return <ActionableBookItem {...props} />;
    case 'favorite':
      return <FavoriteBookItem {...props} />;
    case 'new':
      return <NewBookItem {...props} />;
    case 'editing':
      return <EditingBookItem {...props} />;
    default:
      return <BookItem {...props} />;
  }
};

// Hook pour déterminer la variante appropriée selon le contexte
export const useBookItemVariant = (context: 'grid' | 'list' | 'search' | 'favorites' | 'recent') => {
  switch (context) {
    case 'grid':
      return 'interactive';
    case 'list':
      return 'list';
    case 'search':
      return 'card';
    case 'favorites':
      return 'favorite';
    case 'recent':
      return 'new';
    default:
      return 'default';
  }
};
