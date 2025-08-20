/**
 * Script pour générer des images de preview placeholder pour les filtres
 * À exécuter une seule fois pour créer les assets nécessaires
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ASSETS_DIR = path.join(__dirname, '../../../assets/filters');
const IMAGE_SIZE = 300;

// Couleurs pour chaque filtre
const FILTER_COLORS = {
  'preview-none.jpg': { r: 100, g: 100, b: 100 },
  'preview-sepia.jpg': { r: 139, g: 90, b: 43 },
  'preview-noir.jpg': { r: 60, g: 60, b: 60 },
  'preview-monochrome.jpg': { r: 80, g: 80, b: 90 },
  'preview-vintage.jpg': { r: 150, g: 120, b: 90 },
  'preview-cool.jpg': { r: 70, g: 100, b: 130 },
  'preview-warm.jpg': { r: 150, g: 100, b: 70 },
};

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  console.log(`✅ Dossier créé: ${ASSETS_DIR}`);
}

// Fonction pour créer une image placeholder en base64
function createPlaceholderImage(color) {
  // SVG simple avec gradient pour simuler une photo
  const svg = `
    <svg width="${IMAGE_SIZE}" height="${IMAGE_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="grad">
          <stop offset="0%" style="stop-color:rgb(${color.r + 50},${color.g + 50},${color.b + 50});stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(${color.r},${color.g},${color.b});stop-opacity:1" />
        </radialGradient>
      </defs>
      <rect width="${IMAGE_SIZE}" height="${IMAGE_SIZE}" fill="url(#grad)" />
      <circle cx="${IMAGE_SIZE/2}" cy="${IMAGE_SIZE/3}" r="${IMAGE_SIZE/6}" fill="rgba(255,255,255,0.2)" />
      <rect x="${IMAGE_SIZE/4}" y="${IMAGE_SIZE/2}" width="${IMAGE_SIZE/2}" height="${IMAGE_SIZE/4}" fill="rgba(0,0,0,0.2)" rx="10" />
    </svg>
  `;
  
  return Buffer.from(svg).toString('base64');
}

// Instructions pour créer les vraies images
console.log('\n📸 Instructions pour créer les vraies images de preview:\n');
console.log('1. Prenez une photo de référence (portrait ou paysage)');
console.log('2. Appliquez chaque filtre dans un éditeur photo:');
console.log('   - Sépia: Effet sépia classique');
console.log('   - Noir: Conversion noir et blanc');
console.log('   - Monochrome: Noir et blanc avec teinte bleue');
console.log('   - Vintage: Couleurs délavées, grain, vignette');
console.log('   - Cool: Teinte bleue/cyan');
console.log('   - Warm: Teinte orange/jaune');
console.log('3. Exportez en 300x300px JPG dans assets/filters/');
console.log('\n⚠️  Les placeholders SVG ne fonctionneront pas avec React Native!');
console.log('Vous devez créer de vraies images JPG.\n');

// Créer un fichier d'instructions
const instructions = `
# Images de Preview pour les Filtres

Ce dossier doit contenir les images de preview pour chaque filtre.

## Images requises:
- preview-none.jpg (image originale sans filtre)
- preview-sepia.jpg
- preview-noir.jpg
- preview-monochrome.jpg
- preview-vintage.jpg
- preview-cool.jpg
- preview-warm.jpg

## Spécifications:
- Format: JPG
- Dimensions: 300x300px
- Qualité: 80-90%
- Contenu: Photo représentative (portrait ou paysage)

## Comment créer les images:
1. Choisissez une photo de base avec de bonnes couleurs et contrastes
2. Appliquez chaque filtre dans Photoshop, GIMP ou autre
3. Exportez en respectant les noms de fichiers ci-dessus
4. Placez les fichiers dans ce dossier

## Placeholders temporaires:
En attendant les vraies images, vous pouvez utiliser des couleurs unies:
- None: Gris neutre (#646464)
- Sepia: Brun (#8B5A2B)
- Noir: Gris foncé (#3C3C3C)
- Monochrome: Gris bleuté (#50505A)
- Vintage: Beige (#967860)
- Cool: Bleu (#4682B4)
- Warm: Orange (#CD853F)
`;

fs.writeFileSync(path.join(ASSETS_DIR, 'README.md'), instructions);
console.log(`✅ Instructions créées: ${ASSETS_DIR}/README.md`);

// Créer un composant temporaire pour les placeholders
const placeholderComponent = `
// Composant temporaire pour les images de preview
// À remplacer par de vraies images JPG

export const FILTER_PREVIEW_COLORS = ${JSON.stringify(FILTER_COLORS, null, 2)};

// Utiliser avec une View colorée en attendant les vraies images:
// <View style={{ backgroundColor: FILTER_PREVIEW_COLORS['preview-sepia.jpg'] }} />
`;

fs.writeFileSync(
  path.join(__dirname, 'FilterPreviewPlaceholders.ts'), 
  placeholderComponent
);
console.log(`✅ Placeholders créés: FilterPreviewPlaceholders.ts`);
