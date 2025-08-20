/**
 * Point d'entrée de compatibilité pour AutoSaveService
 * Redirige vers les nouveaux modules refactorisés
 * 
 * @deprecated Utilisez directement les modules spécialisés depuis './autoSave/'
 */

// Réexporte tout depuis le nouveau module refactorisé
export * from './autoSave/index';

// Export par défaut pour maintenir la compatibilité
export { AutoSaveService as default } from './autoSave/index'; 