/*
 * Utilitaire de cache mémoire simple avec expiration (TTL)
 * Permet de stocker des valeurs qui seront rafraîchies après un délai donné.
 */

export interface CacheEntry<T> {
  value: T;
  expiry: number; // Timestamp en ms
}

// Cache global en mémoire (partagé dans l'instance JS)
const cache = new Map<string, CacheEntry<any>>();

/**
 * Récupère une valeur depuis le cache ou utilise la fonction fetchFn pour la récupérer puis la met en cache.
 * @param key Clé unique du cache
 * @param fetchFn Fonction asynchrone pour récupérer la valeur en cas de cache manquant/expiré
 * @param ttlMs Durée de vie en millisecondes (par défaut 5 minutes)
 */
export const getCached = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000
): Promise<T> => {
  const now = Date.now();
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  // Retourner la valeur si elle est encore valide
  if (entry && entry.expiry > now) {
    return entry.value;
  }

  // Sinon, récupérer la nouvelle valeur
  const value = await fetchFn();

  // Sauvegarder dans le cache
  cache.set(key, { value, expiry: now + ttlMs });
  return value;
};

/**
 * Invalide une clé du cache (par exemple après création/suppression d'événement).
 */
export const invalidateCache = (key: string) => {
  cache.delete(key);
};

/**
 * Vide entièrement le cache (debug/testing).
 */
export const clearCache = () => {
  cache.clear();
};
