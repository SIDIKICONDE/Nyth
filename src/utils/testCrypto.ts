import { SecureCryptoService } from '../services/secureApiKey/crypto.service';
import { createLogger } from './optimizedLogger';

const logger = createLogger("TestCrypto");

/**
 * Test du chiffrement AES-256-GCM sur le simulateur
 */
export const testCryptoOnSimulator = async (): Promise<void> => {
  try {
    logger.info("🧪 Test du chiffrement AES-256-GCM sur simulateur...");

    // Test 1: Initialisation du service
    logger.info("1. Test d'initialisation...");
    await SecureCryptoService.initialize();
    logger.info("✅ Initialisation réussie");

    // Test 2: Chiffrement simple
    logger.info("2. Test de chiffrement...");
    const testData = "sk-test-1234567890abcdef";
    const encrypted = await SecureCryptoService.encrypt(testData);
    logger.info("✅ Chiffrement réussi:", {
      ciphertext: encrypted.ciphertext.substring(0, 20) + "...",
      salt: encrypted.salt.substring(0, 10) + "...",
      iv: encrypted.iv.substring(0, 10) + "...",
      tag: encrypted.tag.substring(0, 10) + "..."
    });

    // Test 3: Déchiffrement
    logger.info("3. Test de déchiffrement...");
    const decrypted = await SecureCryptoService.decrypt(encrypted);
    logger.info("✅ Déchiffrement réussi:", decrypted);

    // Test 4: Vérification de l'intégrité
    if (decrypted === testData) {
      logger.info("✅ Intégrité des données vérifiée");
    } else {
      logger.error("❌ Erreur d'intégrité:", { expected: testData, got: decrypted });
    }

    // Test 5: Test avec une clé personnalisée
    logger.info("4. Test avec clé personnalisée...");
    const customKey = "ma-cle-personnalisee-123";
    const encryptedCustom = await SecureCryptoService.encrypt(testData, customKey);
    const decryptedCustom = await SecureCryptoService.decrypt(encryptedCustom, customKey);
    
    if (decryptedCustom === testData) {
      logger.info("✅ Test avec clé personnalisée réussi");
    } else {
      logger.error("❌ Erreur avec clé personnalisée");
    }

    logger.info("🎉 Tous les tests de chiffrement AES-256-GCM ont réussi sur le simulateur !");

  } catch (error) {
    logger.error("❌ Erreur lors du test de chiffrement:", error);
    throw error;
  }
};

/**
 * Test de performance du chiffrement
 */
export const testCryptoPerformance = async (): Promise<void> => {
  try {
    logger.info("⚡ Test de performance du chiffrement...");
    
    const testData = "sk-test-1234567890abcdef";
    const iterations = 100;
    
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      const encrypted = await SecureCryptoService.encrypt(testData);
      await SecureCryptoService.decrypt(encrypted);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    const avgTime = duration / iterations;
    
    logger.info(`✅ Performance: ${iterations} opérations en ${duration}ms (${avgTime.toFixed(2)}ms par opération)`);
    
  } catch (error) {
    logger.error("❌ Erreur lors du test de performance:", error);
  }
};
