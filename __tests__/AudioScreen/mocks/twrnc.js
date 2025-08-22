// Mock complet pour twrnc (Tailwind CSS)
// Simule le comportement réel de twrnc dans les tests

// Mock Platform d'abord
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn(obj => obj.ios || obj.default),
}));

const mockTw = jest.fn(classes => {
  // Simule la conversion des classes Tailwind en styles React Native
  const styles = {};

  // Position et layout
  if (classes.includes('absolute')) styles.position = 'absolute';
  if (classes.includes('relative')) styles.position = 'relative';

  // Dimensions
  if (classes.includes('w-16')) styles.width = 64;
  if (classes.includes('h-16')) styles.height = 64;
  if (classes.includes('h-8')) styles.height = 32;
  if (classes.includes('w-0')) styles.width = 0;
  if (classes.includes('h-0')) styles.height = 0;

  // Positionnement
  if (classes.includes('right-6')) styles.right = 24;
  if (classes.includes('right-20')) styles.right = 80;
  if (classes.includes('top-0')) styles.top = 0;
  if (classes.includes('left-0')) styles.left = 0;
  if (classes.includes('bottom-1')) styles.bottom = 4;
  if (classes.includes('left-full')) styles.left = '100%';
  if (classes.includes('top-3')) styles.top = 12;

  // Flexbox
  if (classes.includes('items-center')) styles.alignItems = 'center';
  if (classes.includes('justify-center')) styles.justifyContent = 'center';
  if (classes.includes('flex-row')) styles.flexDirection = 'row';
  if (classes.includes('flex-1')) styles.flex = 1;

  // Bordures et coins
  if (classes.includes('rounded-full')) styles.borderRadius = 9999;
  if (classes.includes('rounded-lg')) styles.borderRadius = 8;
  if (classes.includes('rounded-t-full')) {
    styles.borderTopLeftRadius = 9999;
    styles.borderTopRightRadius = 9999;
  }

  // Ombres
  if (classes.includes('shadow-lg')) {
    styles.shadowOpacity = 0.2;
    styles.shadowRadius = 8;
    styles.shadowOffset = { width: 0, height: 4 };
  }

  // Couleurs de fond
  if (classes.includes('bg-black/80'))
    styles.backgroundColor = 'rgba(0,0,0,0.8)';

  // Padding
  if (classes.includes('px-3')) styles.paddingHorizontal = 12;
  if (classes.includes('py-2')) styles.paddingVertical = 8;

  // Marges
  if (classes.includes('mx-2')) styles.marginHorizontal = 8;
  if (classes.includes('my-1')) styles.marginVertical = 4;

  // Texte
  if (classes.includes('text-white')) styles.color = '#ffffff';
  if (classes.includes('text-sm')) styles.fontSize = 14;
  if (classes.includes('text-xs')) styles.fontSize = 12;
  if (classes.includes('font-medium')) styles.fontWeight = '500';
  if (classes.includes('font-bold')) styles.fontWeight = 'bold';
  if (classes.includes('text-center')) styles.textAlign = 'center';

  // Inset (position absolue complète)
  if (classes.includes('inset-0')) {
    styles.top = 0;
    styles.left = 0;
    styles.right = 0;
    styles.bottom = 0;
  }

  return styles;
});

// Méthode color pour les couleurs personnalisées
mockTw.color = jest.fn(color => color);

module.exports = mockTw;
