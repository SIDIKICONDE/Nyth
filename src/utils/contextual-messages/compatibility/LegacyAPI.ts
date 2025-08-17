import { ContextAnalyzer } from "../analyzers/ContextAnalyzer";
import { ContextualMessageSystem } from "../core/ContextualMessageSystem";
import { UserContext } from "../types";

/**
 * API de compatibilité avec l'ancienne interface
 * Permet une transition en douceur vers la nouvelle architecture
 */
export class ContextualMessageGenerator {
  /**
   * Génère un message de bienvenue contextuel avec l'IA
   */
  static async generateContextualWelcomeMessage(
    context: UserContext
  ): Promise<string> {
    const system = ContextualMessageSystem.getInstance();

    const message = await system.generateOptimalMessage(
      null, // user, scripts et recordings sont inutiles car le contexte est fourni
      [],
      [],
      { preferAI: true, context: context }
    );

    return message.message;
  }

  /**
   * Construit le contexte utilisateur
   */
  static async buildUserContext(
    user: any,
    scripts: any[],
    recordings: any[],
    isFirstLogin: boolean
  ): Promise<UserContext> {
    const analyzer = ContextAnalyzer.getInstance();
    return analyzer.buildUserContext(user, scripts, recordings);
  }

  /**
   * Génère un message informatif
   */
  static async generateInfoMessage(
    context: UserContext
  ): Promise<{ message: string } | null> {
    const system = ContextualMessageSystem.getInstance();

    const user = {
      id: context.userId,
      name: context.userName,
      email: context.email,
      photoURL: context.profilePictureUrl,
    };

    const scripts = Array(context.scriptsCount).fill({
      content: "dummy",
      createdAt: new Date().toISOString(),
    });

    const recordings = Array(context.recordingsCount).fill({
      createdAt: new Date().toISOString(),
    });

    const message = await system.generateOptimalMessage(
      user,
      scripts,
      recordings,
      {
        preferAI: true,
        messageType: "tip", // Message informatif
      }
    );

    return {
      message: message.message,
    };
  }

  /**
   * Génère un message de bienvenue (fallback sans IA)
   */
  static async generateWelcomeMessage(
    context: UserContext
  ): Promise<{ message: string }> {
    const system = ContextualMessageSystem.getInstance();

    const user = {
      id: context.userId,
      name: context.userName,
      email: context.email,
      photoURL: context.profilePictureUrl,
    };

    const scripts = Array(context.scriptsCount).fill({
      content: "dummy",
      createdAt: new Date().toISOString(),
    });

    const recordings = Array(context.recordingsCount).fill({
      createdAt: new Date().toISOString(),
    });

    const message = await system.generateOptimalMessage(
      user,
      scripts,
      recordings,
      {
        preferAI: false, // Utiliser les templates pour le fallback
        messageType: "welcome",
      }
    );

    return {
      message: message.message,
    };
  }
}
