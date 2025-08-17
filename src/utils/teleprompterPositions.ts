/**
 * Utilitaire pour gérer les positions du télésouffleur
 * 
 * Ce fichier contient des fonctions pour calculer les différentes positions
 * de départ du télésouffleur en fonction des paramètres de l'utilisateur.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type StartPosition = 'top' | 'center' | 'bottom';

// Clés pour le stockage des positions dans AsyncStorage
export const TELEPROMPTER_POSITION_KEY = 'teleprompter_position';
export const TELEPROMPTER_SCRIPT_POSITIONS_KEY = 'teleprompter_script_positions';

// Interface pour les positions sauvegardées
export interface SavedPosition {
  scriptId: string;
  position: number;
  timestamp: number;
}

/**
 * Calcule la position de départ du télésouffleur
 * 
 * @param startPosition Type de position (haut, centre, bas)
 * @param containerHeight Hauteur du conteneur visible
 * @param textHeight Hauteur totale du texte
 * @param offset Décalage optionnel en pixels
 * @returns Position en pixels
 */
export function calculateStartPosition(
  startPosition: StartPosition,
  containerHeight: number,
  textHeight: number = 0,
  offset: number = 0
): number {
  let position = 0;
  
  switch (startPosition) {
    case 'top':
      // Position en haut - le début du texte est en haut de l'écran
      position = 0 + offset;
      break;
      
    case 'center':
      // Position au centre - le début du texte est au milieu de l'écran
      position = Math.max(0, containerHeight / 2) + offset;
      break;
      
    case 'bottom':
      // Position en bas - le début du texte est en bas de l'écran
      // Laisse un peu d'espace en bas (100px par défaut)
      const bottomOffset = 100;
      position = Math.max(0, containerHeight - bottomOffset) + offset;
      break;
      
    default:
      position = 0 + offset;
  }
  
  return position;
}

/**
 * Sauvegarde la position actuelle du télésouffleur pour un script spécifique
 * 
 * @param scriptId ID du script
 * @param position Position actuelle en pixels
 * @returns Promise résolu quand la sauvegarde est terminée
 */
export async function saveScriptPosition(scriptId: string, position: number): Promise<void> {
  try {
    // Créer l'objet de position à sauvegarder
    const positionData: SavedPosition = {
      scriptId,
      position,
      timestamp: Date.now()
    };

    // Récupérer les positions existantes
    const existingPositionsJSON = await AsyncStorage.getItem(TELEPROMPTER_SCRIPT_POSITIONS_KEY);
    let positions: SavedPosition[] = [];

    if (existingPositionsJSON) {
      positions = JSON.parse(existingPositionsJSON);
      
      // Trouver l'index de la position existante pour ce script
      const existingIndex = positions.findIndex(p => p.scriptId === scriptId);
      
      if (existingIndex >= 0) {
        // Mettre à jour la position existante
        positions[existingIndex] = positionData;
      } else {
        // Ajouter une nouvelle position
        positions.push(positionData);
      }
      
      // Limiter à 20 scripts maximum pour éviter de trop stocker
      if (positions.length > 20) {
        // Trier par date et garder les 20 plus récents
        positions.sort((a, b) => b.timestamp - a.timestamp);
        positions = positions.slice(0, 20);
      }
    } else {
      // Première position à sauvegarder
      positions = [positionData];
    }

    // Sauvegarder les positions mises à jour
    await AsyncStorage.setItem(TELEPROMPTER_SCRIPT_POSITIONS_KEY, JSON.stringify(positions));

    // Sauvegarder également la dernière position utilisée globalement
    await AsyncStorage.setItem(TELEPROMPTER_POSITION_KEY, JSON.stringify(positionData));
  } catch (error) {}
}

/**
 * Récupère la position sauvegardée pour un script spécifique
 * 
 * @param scriptId ID du script
 * @returns Position sauvegardée ou null si aucune n'existe
 */
export async function getSavedScriptPosition(scriptId: string): Promise<number | null> {
  try {
    const positionsJSON = await AsyncStorage.getItem(TELEPROMPTER_SCRIPT_POSITIONS_KEY);

    if (positionsJSON) {
      const positions: SavedPosition[] = JSON.parse(positionsJSON);
      const savedPosition = positions.find(p => p.scriptId === scriptId);
      
      if (savedPosition) {
        return savedPosition.position;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Supprime la position sauvegardée pour un script spécifique
 * 
 * @param scriptId ID du script
 * @returns Promise résolu quand la suppression est terminée
 */
export async function clearSavedScriptPosition(scriptId: string): Promise<void> {
  try {
    const positionsJSON = await AsyncStorage.getItem(TELEPROMPTER_SCRIPT_POSITIONS_KEY);
    
    if (positionsJSON) {
      let positions: SavedPosition[] = JSON.parse(positionsJSON);

      // Filtrer pour supprimer la position du script spécifié
      positions = positions.filter(p => p.scriptId !== scriptId);

      // Sauvegarder les positions mises à jour
      await AsyncStorage.setItem(TELEPROMPTER_SCRIPT_POSITIONS_KEY, JSON.stringify(positions));
    }
  } catch (error) {}
}

/**
 * Calcule la position centrée du texte entier dans le conteneur
 * (Utile pour un affichage statique du texte complet)
 * 
 * @param containerHeight Hauteur du conteneur visible
 * @param textHeight Hauteur totale du texte
 * @returns Position en pixels
 */
export function calculateCenteredTextPosition(
  containerHeight: number,
  textHeight: number
): number {
  // Si le texte est plus petit que le conteneur, le centrer
  if (textHeight < containerHeight) {
    return (containerHeight - textHeight) / 2;
  }
  // Sinon, afficher depuis le début
  return 0;
}

/**
 * Calcule la position pour que le texte soit aligné en bas
 * (Utile pour un affichage statique du texte complet)
 * 
 * @param containerHeight Hauteur du conteneur visible
 * @param textHeight Hauteur totale du texte
 * @returns Position en pixels
 */
export function calculateBottomTextPosition(
  containerHeight: number,
  textHeight: number
): number {
  // Si le texte est plus petit que le conteneur, l'aligner en bas
  if (textHeight < containerHeight) {
    return containerHeight - textHeight;
  }
  // Sinon, afficher depuis le début
  return 0;
} 