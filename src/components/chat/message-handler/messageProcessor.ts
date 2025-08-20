/**
 * @fileoverview Processeur principal des messages du chat
 * Gère l'envoi des messages à l'IA et le traitement des réponses
 */

import { AIService } from "@/services/ai/AIService";
import { createLogger } from "@/utils/optimizedLogger";
import { buildContextualPrompt } from "./context/contextBuilder";
import { handleMessageProcessingError } from "./errorHandler";
import { processFunctionCalls } from "./functionCallHandler";
import { hasThemeIntent, needsFunctionCalling } from "./intentAnalyzer";
import { analyzeWithAIDecision } from "./memory/aiDecisionAnalyzer";
import {
  cleanCorruptedMemory,
  handleBatchMemoryAnalysis,
} from "./memory/batchMemoryAnalyzer";
import { analyzeForMemoryAsync, Language } from "./memory/messageFilter";
import type { SemanticIntentScorer } from "./memory/transformers";
import { ProcessMessageOptions } from "./types";
import { sanitizeContent } from "./utils/sanitizer";
import { getWelcomePromptByLanguage } from "./welcomeHandler";

const logger = createLogger("MessageProcessor");

let semanticIntentScorer: SemanticIntentScorer | null = null;

// Variable pour éviter le nettoyage multiple
const memoryCleanedForUsers = new Set<string>();

function isPureGreeting(text: string): boolean {
  const normalized = (text || "")
    .trim()
    .toLowerCase()
    .replace(/[!?.…]+$/g, "")
    .replace(/[,;:]+$/g, "")
    .trim();
  const patterns = [
    "salut",
    "bonjour",
    "bonsoir",
    "hello",
    "hi",
    "hey",
    "coucou",
  ];
  return patterns.includes(normalized);
}

/**
 * Construit le contexte complet pour un message
 */
async function buildMessageContext(
  user: any,
  scripts: any[],
  message: string
): Promise<string> {
  try {
    const fullContext = await buildContextualPrompt(user, scripts, message);
    const contextualMessage = `${fullContext}\n\nMESSAGE UTILISATEUR: ${message}`;

    return contextualMessage;
  } catch (contextError) {
    // Utiliser le message simple en cas d'erreur
    return message;
  }
}

function postProcessAIResponse(raw: string): string {
  let out = (raw || "").trim();
  out = out.replace(
    /^\s*(salut|bonjour|bonsoir|hello|hi|hey|coucou)[\s!,\.:-]+/i,
    ""
  );
  out = out.replace(
    /^\s*(comment\s+puis-je\s+vous\s+aider\s+aujourd'hui\??)\s*/i,
    ""
  );
  out = out.replace(/^\s*(how\s+can\s+i\s+help\s+you\s+today\??)\s*/i, "");
  out = out.replace(
    /(comment\s+puis-je\s+vous\s+aider\s+aujourd'hui\??)/gi,
    ""
  );
  out = out.replace(/(how\s+can\s+i\s+help\s+you\s+today\??)/gi, "");
  out = out.replace(/\n{3,}/g, "\n\n");
  return out.trim().length > 0 ? out.trim() : raw.trim();
}

/**
 * Traite un message avec Function Calling
 */
async function processWithFunctionCalling(
  message: string,
  conversationHistory: any[],
  userId: string,
  userLanguage: string
): Promise<string> {
  const result = await AIService.chatWithTools(message, conversationHistory);

  // Traiter les appels de fonction si présents
  if (result.tool_calls && result.tool_calls.length > 0) {
    const functionResults = await processFunctionCalls(
      result.tool_calls,
      userId,
      userLanguage
    );

    // Combiner la réponse de l'IA avec les résultats des fonctions
    const response =
      (result.content || "") + "\n\n" + functionResults.join("\n");
    return response;
  } else {
    return result.content || "Aucune réponse reçue.";
  }
}

/**
 * Traite un message avec chat simple
 */
async function processWithSimpleChat(
  message: string,
  conversationHistory: any[]
): Promise<string> {
  return await AIService.simpleChatWithAI(message, conversationHistory);
}

/**
 * Processeur principal des messages
 */
export async function processMessage(
  options: ProcessMessageOptions
): Promise<string> {
  const {
    message,
    userId,
    conversationHistory = [],
    onProgress,
    signal,
    userLanguage = "fr",
    user,
    scripts,
    invisibleContext,
    isWelcomeMessage,
  } = options;

  try {
    logger.info("🚀 Traitement du message:", {
      messageLength: message.length,
      userId: userId.substring(0, 8) + "...",
      historyLength: conversationHistory.length,
      isWelcomeMessage,
      hasInvisibleContext: !!invisibleContext,
      isFirstMessage: conversationHistory.length === 0,
    });

    // Gestion spéciale pour les messages de bienvenue avec contexte invisible
    // SEULEMENT pour le tout premier message (historique vide)
    if (
      isWelcomeMessage &&
      invisibleContext &&
      conversationHistory.length === 0
    ) {
      logger.info(
        "🎉 Traitement spécial pour PREMIER message de bienvenue avec contexte invisible"
      );

      const welcomePrompt = await getWelcomePromptByLanguage(message);
      const response = await AIService.simpleChatWithAI(
        welcomePrompt,
        [] // Pas d'historique pour le premier message seulement
      );

      logger.info(
        "✅ Premier message de bienvenue traité avec contexte invisible"
      );
      return response;
    }

    // Nettoyer le contenu
    const cleanMessage = sanitizeContent(message);

    // 🧹 NETTOYAGE AUTOMATIQUE DE LA MÉMOIRE CORROMPUE (une seule fois par utilisateur)
    if (userId && !memoryCleanedForUsers.has(userId)) {
      await cleanCorruptedMemory(userId);
      memoryCleanedForUsers.add(userId);
    }

    // 📝 CONSTRUCTION DU CONTEXTE AVEC MÉMOIRE (toujours en arrière-plan pour ne pas bloquer la réponse)
    let contextualMessage = cleanMessage;
    const deferredBackgroundContextBuild = !!(user && scripts);
    if (user && scripts) {
      try {
        const { AddressingPreferenceService } = await import(
          "@/services/preferences/AddressingPreferenceService"
        );
        const language = (userLanguage || "fr") as "fr" | "en";
        await AddressingPreferenceService.updateFromUtterance(
          userId,
          cleanMessage,
          language
        );
        const firstName = String(user?.name || user?.displayName || "")
          .split(/\s+/)[0]
          .trim();
        const policy = await AddressingPreferenceService.buildPolicyInstruction(
          userId,
          firstName,
          language
        );
        contextualMessage = `${policy}\n\n${contextualMessage}`;
      } catch {}
    }

    // Déterminer si on a besoin du Function Calling
    const useFunctionCalling = hasThemeIntent(cleanMessage)
      ? true
      : needsFunctionCalling(cleanMessage);

    logger.info(
      `Mode sélectionné: ${
        useFunctionCalling ? "Function Calling" : "Chat simple"
      }`
    );

    // Clarification rapide si ambiguïté forte
    try {
      const { detectAmbiguity } = await import("./memory/ambiguity");
      const amb = detectAmbiguity(cleanMessage);
      if (amb.hasAmbiguity && amb.confidence >= 0.7) {
        const clarify =
          userLanguage === "fr"
            ? `Avant d'agir: ${amb.suggestions[0]}`
            : `Before proceeding: ${amb.suggestions[0]}`;
        contextualMessage = `${contextualMessage}\n\n${clarify}`;
      }
    } catch {}

    // RAG FAQ différé pour ne pas bloquer la réponse initiale (lancé après)

    // Réponse immédiate (chat simple) pour ne pas bloquer l'UX
    let response: string = await processWithSimpleChat(
      contextualMessage,
      conversationHistory
    );

    // Déclencher le Function Calling en arrière-plan si nécessaire
    if (useFunctionCalling) {
      (async () => {
        try {
          const fcResponse = await processWithFunctionCalling(
            contextualMessage,
            conversationHistory,
            userId,
            userLanguage
          );
          if (typeof onProgress === "function") {
            onProgress(fcResponse);
          }
        } catch {}
      })();
    }

    if (!isPureGreeting(cleanMessage)) {
      response = postProcessAIResponse(response);
    }

    if (deferredBackgroundContextBuild && user && scripts) {
      try {
        const { buildContextualPrompt } = await import(
          "./context/contextBuilder"
        );
        setTimeout(() => {
          buildContextualPrompt(user, scripts, cleanMessage)
            .then(() => {})
            .catch(() => {});
        }, 0);
      } catch {}
    }

    // Déclencher RAG en arrière-plan (et pousser via onProgress si disponible)
    (async () => {
      try {
        const { KnowledgeService } = await import(
          "@/services/knowledge/KnowledgeService"
        );
        const top = await KnowledgeService.searchTopK(
          cleanMessage,
          2,
          0.4,
          (userLanguage as "fr" | "en") || "fr"
        );
        if (top.length > 0 && typeof onProgress === "function") {
          const ragBlock = top
            .map(
              (x, i) => `${i + 1}. Q: ${x.item.question}\nA: ${x.item.answer}`
            )
            .join("\n\n");
          const ragHeader =
            userLanguage === "fr"
              ? "CONNAISSANCES FAQ PERTINENTES (utiliser si utile, ne pas citer au mot à mot):"
              : "RELEVANT FAQ KNOWLEDGE (use if helpful, do not quote verbatim):";
          onProgress(`\n\n${ragHeader}\n${ragBlock}`);
        }
      } catch {}
    })();

    // Suggestions d'actions contextuelles (planner léger)
    try {
      const lower = cleanMessage.toLowerCase();
      const suggestions: string[] = [];
      if (/rendez-vous|rdv|meeting|événement|event/.test(lower)) {
        suggestions.push(
          userLanguage === "fr"
            ? "➕ Créer un événement dans le planning ?"
            : "➕ Create a calendar event?"
        );
      }
      if (/préférences|param(ètre|etre)s|réglages|settings/.test(lower)) {
        suggestions.push(
          userLanguage === "fr"
            ? "⚙️ Ouvrir les préférences pour ajuster ce point ?"
            : "⚙️ Open settings to adjust this?"
        );
      }
      if (/script|téléprompteur|teleprompter|pitch|idée|idee/.test(lower)) {
        suggestions.push(
          userLanguage === "fr"
            ? "📝 Générer un mini-plan (3 idées) ?"
            : "📝 Generate a mini-outline (3 ideas)?"
        );
      }
      if (suggestions.length > 0) {
        response = `${response}\n\n${suggestions.join("\n")}`;
      }
    } catch {}

    if (userId && user) {
      const isFirst = conversationHistory.length === 0;
      if (!semanticIntentScorer && !isFirst) {
        try {
          const mod = await import("./memory/transformers");
          semanticIntentScorer = await mod.createSemanticIntentScorer();
        } catch (_) {
          semanticIntentScorer = null;
        }
      }

      const filterResult = await analyzeForMemoryAsync(cleanMessage, {
        language: userLanguage as Language,
        semanticIntentScorer:
          !isFirst && semanticIntentScorer
            ? (m, l) => semanticIntentScorer!(m, l)
            : undefined,
      });

      if (filterResult.shouldAnalyze) {
        logger.info(
          `⚡️ Message critique détecté (score: ${filterResult.score}), analyse en arrière-plan...`
        );
        analyzeWithAIDecision(
          userId,
          cleanMessage,
          conversationHistory,
          user
        ).catch(() => {});
      } else {
        logger.info(
          "🕵️ Message standard, ajout à la file d'analyse par lot (arrière-plan)..."
        );
        handleBatchMemoryAnalysis(userId, cleanMessage).catch(() => {});
      }
    }

    // 🧠 ANALYSE DE LA RÉPONSE IA (désactivée)
    /*
    if (userId && user && response) {
      await processMemoryAnalysis(userId, `Réponse IA: ${response}`, user, {
        fallbackToRegex: true,
        minConfidence: 0.5,
        enableDebug: false,
      });
    }
    */

    logger.info("✅ Message traité avec succès");
    return response;
  } catch (error) {
    return handleMessageProcessingError(error as Error | string, {
      userId,
      messageLength: message.length,
      userLanguage,
    });
  }
}
