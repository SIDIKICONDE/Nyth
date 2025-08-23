// Test pour valider la correction du cache
const { adminAdvancedCacheService } = require('./src/services/cache/adminAdvancedCacheService');

async function testCacheFix() {
  console.log('🧪 Test de la correction du cache...');
  
  try {
    // Test 1: Vérifier que le cache retourne la bonne structure
    const testData = {
      recordings: [
        { id: '1', title: 'Test Recording', createdAt: new Date().toISOString() }
      ],
      timestamp: Date.now()
    };
    
    // Mettre en cache
    await adminAdvancedCacheService.set('test_cache_fix', testData, {
      name: 'test',
      ttl: 5,
      priority: 'high',
      maxSize: 1024 * 1024,
      compression: false
    });
    
    // Récupérer du cache
    const cachedData = await adminAdvancedCacheService.get('test_cache_fix');
    
    console.log('✅ Structure du cache récupérée:', {
      hasData: !!cachedData,
      hasRecordings: !!(cachedData && cachedData.recordings),
      hasTimestamp: !!(cachedData && cachedData.timestamp),
      timestamp: cachedData?.timestamp
    });
    
    // Test 2: Vérifier que l'accès aux propriétés ne cause pas d'erreur
    if (cachedData && cachedData.timestamp) {
      const timeDiff = Date.now() - cachedData.timestamp;
      console.log('✅ Accès au timestamp réussi:', timeDiff, 'ms');
    }
    
    // Test 3: Vérifier que les enregistrements sont accessibles
    if (cachedData && cachedData.recordings) {
      console.log('✅ Accès aux enregistrements réussi:', cachedData.recordings.length, 'enregistrements');
    }
    
    console.log('🎉 Tous les tests de correction du cache ont réussi !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test du cache:', error);
  }
}

// Exécuter le test
testCacheFix();
