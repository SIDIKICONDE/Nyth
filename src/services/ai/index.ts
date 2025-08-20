// Export principal du service AI
export { AIService } from "./AIService";

// Export des services spécialisés
export { FreeChatService } from "./chat/FreeChatService";
export { SpecializedChatService } from "./chat/SpecializedChatService";
export { ScriptGenerationService } from "./script/ScriptGenerationService";

// Export des utilitaires
export { AIUtilsService } from "./utils/AIUtilsService";
export { ApiKeyManager } from "./ApiKeyManager";

// Export des types
export * from "./types";

// Export des services existants (pour compatibilité)
export { CacheManager } from "./CacheManager";
export { PromptBuilder } from "./PromptBuilder";
export { TemplateManager } from "./TemplateManager";
