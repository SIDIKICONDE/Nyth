import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hasInternetConnection } from './networkUtils';
import { createLogger } from './optimizedLogger';

const logger = createLogger('ApiUtils');

interface ApiError extends Error {
  code?: string;
  status?: number;
  data?: any;
}

export const ApiUtils = {
  /**
   * Effectue un appel API avec gestion des erreurs et retry
   */
  async makeApiCall<T>(
    url: string,
    options: RequestInit,
    retries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < retries; i++) {
      try {
        // Vérifier la connexion internet
        const hasConnection = await hasInternetConnection();
        if (!hasConnection) {
          throw this.createError(
            'Pas de connexion internet disponible',
            'NETWORK_ERROR'
          );
        }
        
        // Effectuer l'appel API
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
        
        // Vérifier le statut de la réponse
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw this.createError(
            errorData.message || `Erreur HTTP: ${response.status}`,
            'HTTP_ERROR',
            response.status,
            errorData
          );
        }
        
        // Parser la réponse
        const data = await response.json();
        return data as T;
        
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Tentative ${i + 1}/${retries} échouée`, { error });
        
        // Si c'est la dernière tentative, propager l'erreur
        if (i === retries - 1) {
          throw error;
        }
        
        // Attendre avant de réessayer (backoff exponentiel)
        await this.delay(Math.pow(2, i) * 1000);
      }
    }
    
    throw lastError || new Error('Échec de l\'appel API après plusieurs tentatives');
  },
  
  /**
   * Crée une erreur API standardisée
   */
  createError(
    message: string,
    code?: string,
    status?: number,
    data?: any
  ): ApiError {
    const error = new Error(message) as ApiError;
    error.code = code;
    error.status = status;
    error.data = data;
    return error;
  },
  
  /**
   * Vérifie si une erreur est une erreur réseau
   */
  isNetworkError(error: Error): boolean {
    const message = error.message.toLowerCase();
    const networkKeywords = [
      'network',
      'fetch',
      'connection',
      'internet',
      'timeout',
      'réseau',
      'connexion'
    ];
    
    return networkKeywords.some(keyword => message.includes(keyword)) ||
      (error as ApiError).code === 'NETWORK_ERROR' ||
      (error as ApiError).code === 'TIMEOUT';
  },
  
  /**
   * Vérifie si une erreur est une erreur d'authentification
   */
  isAuthError(error: Error): boolean {
    const apiError = error as ApiError;
    return apiError.status === 401 || 
           apiError.status === 403 ||
           apiError.code === 'AUTH_ERROR';
  },
  
  /**
   * Vérifie si une erreur est une erreur de limite de taux
   */
  isRateLimitError(error: Error): boolean {
    const apiError = error as ApiError;
    return apiError.status === 429 ||
           apiError.code === 'RATE_LIMIT' ||
           error.message.toLowerCase().includes('rate limit');
  },
  
  /**
   * Extrait un message d'erreur lisible
   */
  getErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error instanceof Error) {
      // Vérifier si c'est une erreur réseau
      if (this.isNetworkError(error)) {
        return 'Erreur de connexion. Vérifiez votre connexion internet.';
      }
      
      // Vérifier si c'est une erreur d'authentification
      if (this.isAuthError(error)) {
        return 'Erreur d\'authentification. Vérifiez vos clés API.';
      }
      
      // Vérifier si c'est une erreur de limite
      if (this.isRateLimitError(error)) {
        return 'Limite d\'utilisation atteinte. Réessayez plus tard.';
      }
      
      return error.message;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    return 'Une erreur inconnue s\'est produite';
  },
  
  /**
   * Fonction utilitaire pour attendre
   */
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  /**
   * Vérifie si une URL est valide
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  /**
   * Construit une URL avec des paramètres de requête
   */
  buildUrl(baseUrl: string, params?: Record<string, any>): string {
    const url = new URL(baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  },
  
  /**
   * Encode les données pour un formulaire
   */
  encodeFormData(data: Record<string, any>): FormData {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File || value instanceof Blob) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    return formData;
  }
};

// Export des types
export type { ApiError }; 