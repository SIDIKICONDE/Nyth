// Fonction pour extraire le nom d'utilisateur d'une URL
export const extractUsername = (url: string, baseUrl: string): string => {
  if (!url) return '';
  
  // Si c'est déjà juste un nom d'utilisateur, le retourner
  if (!url.includes('://') && !url.includes('/')) {
    return url.replace('@', ''); // Enlever @ s'il existe
  }
  
  // Extraire le nom d'utilisateur de l'URL
  const cleanUrl = url.replace(baseUrl, '').replace('https://', '').replace('http://', '');
  const username = cleanUrl.split('/')[0].split('?')[0].replace('@', '');
  return username;
};

// Fonction pour construire l'URL complète
export const buildSocialUrl = (username: string, baseUrl: string): string => {
  if (!username) return '';
  const cleanUsername = username.replace('@', '').trim();
  return `${baseUrl}${cleanUsername}`;
}; 