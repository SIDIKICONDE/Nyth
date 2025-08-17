/**
 * Formate un nombre de secondes en chaîne de caractères au format mm:ss
 * @param seconds Nombre de secondes à formater
 * @returns Chaîne formatée (ex: "01:45")
 */
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Formate un nombre de secondes en chaîne de caractères incluant les heures si nécessaire
 * @param seconds Nombre de secondes à formater
 * @returns Chaîne formatée (ex: "01:45:30" ou "12:05")
 */
export const formatDurationLong = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Convertit une durée en millisecondes en chaîne lisible (ex: 1h 30m 15s)
 * @param ms Durée en millisecondes
 * @returns Chaîne formatée
 */
export const formatMillisToReadable = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  const remainingSeconds = seconds % 60;
  const remainingMinutes = minutes % 60;
  
  let result = '';
  
  if (hours > 0) {
    result += `${hours}h `;
  }
  
  if (remainingMinutes > 0 || hours > 0) {
    result += `${remainingMinutes}m `;
  }
  
  result += `${remainingSeconds}s`;
  
  return result;
}; 