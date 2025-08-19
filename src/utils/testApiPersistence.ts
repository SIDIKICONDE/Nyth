import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiKeyManager } from '../services/ai/ApiKeyManager';
import { SecureApiKeyManager } from '../services/ai/SecureApiKeyManager';

export async function testApiPersistence() {
  console.log('🧪 Test de persistance des clés API...\n');
  
  // Test 1: Vérifier l'état actuel
  console.log('📋 État actuel des clés:');
  const openaiKey = await ApiKeyManager.getOpenAIKey();
  const geminiKey = await ApiKeyManager.getGeminiKey();
  const claudeKey = await ApiKeyManager.getClaudeKey();
  
  console.log('- OpenAI:', openaiKey ? '✅ Configurée' : '❌ Non configurée');
  console.log('- Gemini:', geminiKey ? '✅ Configurée' : '❌ Non configurée');
  console.log('- Claude:', claudeKey ? '✅ Configurée' : '❌ Non configurée');
  
  // Test 2: Vérifier les préférences
  console.log('\n📊 Préférences activées:');
  const prefs = await ApiKeyManager.getApiPreference();
  console.log('- OpenAI activé:', prefs.useOpenAI);
  console.log('- Gemini activé:', prefs.useGemini);
  console.log('- Claude activé:', prefs.useClaude);
  
  // Test 3: Lister toutes les clés dans AsyncStorage
  console.log('\n🗄️ Clés dans AsyncStorage:');
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const apiKeys = allKeys.filter(key => 
      key.includes('api_key') || 
      key.includes('API_KEY') || 
      key.includes('use_')
    );
    
    for (const key of apiKeys) {
      const value = await AsyncStorage.getItem(key);
      console.log(`- ${key}: ${value ? value.substring(0, 20) + '...' : 'null'}`);
    }
  } catch (error) {
    console.error('Erreur lors de la lecture des clés:', error);
  }
  
  // Test 4: Tester la sauvegarde et le rechargement
  console.log('\n🔄 Test de sauvegarde/rechargement:');
  const testKey = 'test-key-12345';
  
  // Sauvegarder
  await ApiKeyManager.setOpenAIKey(testKey);
  console.log('✅ Clé de test sauvegardée');
  
  // Recharger immédiatement
  const reloadedKey = await ApiKeyManager.getOpenAIKey();
  console.log('🔄 Clé rechargée:', reloadedKey === testKey ? '✅ Identique' : '❌ Différente');
  
  // Nettoyer
  await SecureApiKeyManager.deleteApiKey('openai');
  console.log('🗑️ Clé de test supprimée');
  
  console.log('\n✅ Test terminé');
}

// Fonction pour déboguer l'état complet
export async function debugApiState() {
  console.log('\n🐛 DEBUG - État complet des API:');
  
  const providers = [
    'openai', 'gemini', 'mistral', 'cohere', 'claude', 
    'perplexity', 'together', 'groq', 'fireworks',
    'azureopenai', 'openrouter', 'deepinfra', 'xai', 'deepseek'
  ];
  
  for (const provider of providers) {
    try {
      const key = await ApiKeyManager.getApiKey(provider);
      const hasKey = !!key;
      console.log(`${provider}: ${hasKey ? '✅' : '❌'} ${hasKey ? '(clé présente)' : '(aucune clé)'}`);
    } catch (error) {
      console.log(`${provider}: ⚠️ Erreur lors de la lecture`);
    }
  }
}