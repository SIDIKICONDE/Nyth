// Test simple de l'import
try {
  const useAudioCapture = require('./src/screens/AudioScreen/hooks/useAudioCapture.ts');
  console.log('✅ Import réussi');
  console.log('Type de useAudioCapture:', typeof useAudioCapture);
} catch (error) {
  console.log('❌ Erreur d\'import:', error.message);
}
