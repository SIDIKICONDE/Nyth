import AsyncStorage from "@react-native-async-storage/async-storage";
import { SecureApiKeyManager } from "../services/ai/SecureApiKeyManager";
import { createOptimizedLogger } from "./optimizedLogger";

const logger = createOptimizedLogger("TestApiPersistence");

export async function testApiPersistence() {
  logger.info("🧪 Test de persistance des clés API");
  
  try {
    // Test 1: Vérifier le stockage direct
    logger.info("\n📝 Test 1: Stockage direct");
    const testKey = "test-key-123";
    await SecureApiKeyManager.saveApiKey("openai", testKey);
    
    const retrievedKey = await SecureApiKeyManager.getApiKey("openai");
    logger.info(`Clé récupérée après sauvegarde: ${retrievedKey ? "✅" : "❌"}`);
    
    // Test 2: Vérifier après un délai
    logger.info("\n⏱️ Test 2: Vérification après délai");
    await new Promise(resolve => setTimeout(resolve, 3000));
    const keyAfterDelay = await SecureApiKeyManager.getApiKey("openai");
    logger.info(`Clé toujours présente après 3s: ${keyAfterDelay ? "✅" : "❌"}`);
    
    // Test 3: Vérifier les métadonnées
    logger.info("\n📊 Test 3: Métadonnées");
    const metadata = await AsyncStorage.getItem("openai_metadata");
    if (metadata) {
      const parsed = JSON.parse(metadata);
      logger.info("Métadonnées:", {
        provider: parsed.provider,
        hasKey: parsed.hasKey,
        createdAt: parsed.createdAt,
        expiresAt: parsed.expiresAt,
        isExpired: new Date(parsed.expiresAt) < new Date()
      });
    }
    
    // Test 4: Vérifier tous les stockages
    logger.info("\n🗄️ Test 4: Tous les stockages");
    const allKeys = await AsyncStorage.getAllKeys();
    const apiRelatedKeys = allKeys.filter(key => 
      key.includes("api") || 
      key.includes("key") || 
      key.includes("openai") ||
      key.includes("secure")
    );
    logger.info("Clés liées aux API trouvées:", apiRelatedKeys);
    
    // Test 5: Vérifier l'expiration
    logger.info("\n⏰ Test 5: Expiration");
    const now = new Date();
    const expirationDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    logger.info(`Date actuelle: ${now.toISOString()}`);
    logger.info(`Date d'expiration théorique: ${expirationDate.toISOString()}`);
    
    return {
      success: !!retrievedKey && !!keyAfterDelay,
      details: {
        immediateRetrieval: !!retrievedKey,
        delayedRetrieval: !!keyAfterDelay,
        metadataPresent: !!metadata,
        relatedKeysCount: apiRelatedKeys.length
      }
    };
    
  } catch (error) {
    logger.error("❌ Erreur pendant le test:", error);
    return { success: false, error };
  }
}

// Fonction pour nettoyer après le test
export async function cleanupTestData() {
  await SecureApiKeyManager.deleteApiKey("openai");
  logger.info("🧹 Données de test nettoyées");
}
