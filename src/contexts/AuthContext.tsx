// ============================================================================
// FICHIER DE COMPATIBILITÉ - UTILISE LA NOUVELLE STRUCTURE MODULAIRE
// ============================================================================
// Ce fichier maintient la compatibilité avec l'ancien système tout en
// utilisant la nouvelle structure modulaire située dans src/contexts/auth/
// ============================================================================

// Re-exports depuis la nouvelle structure modulaire
export { AuthProvider, useAuth, type AuthContextType, type User } from "./auth";
