/**
 * Utilitaire pour migrer les composants Text vers Typography
 * 
 * Ce fichier contient des patterns et des fonctions d'aide pour
 * identifier et remplacer les composants Text par nos nouveaux
 * composants Typography dans toute l'application.
 */

// Patterns de remplacement courants
export const TYPOGRAPHY_PATTERNS = {
  // Titres
  HEADING_PATTERNS: [
    // H1 - Titres principaux
    {
      pattern: /text-(2xl|3xl|4xl).*font-(bold|semibold)/,
      replacement: 'H1',
      size: 32
    },
    // H2 - Sous-titres
    {
      pattern: /text-xl.*font-(bold|semibold)/,
      replacement: 'H2',
      size: 28
    },
    // H3 - Titres de section
    {
      pattern: /text-lg.*font-(bold|semibold|medium)/,
      replacement: 'H3',
      size: 24
    },
  ],

  // Texte d'interface
  UI_PATTERNS: [
    {
      pattern: /text-(sm|base).*font-(medium|semibold)/,
      replacement: 'UIText',
      size: 14
    },
    {
      pattern: /text-xs/,
      replacement: 'UIText',
      size: 12
    },
  ],

  // Contenu
  CONTENT_PATTERNS: [
    {
      pattern: /text-base(?!.*font-(bold|semibold|medium))/,
      replacement: 'ContentText',
      size: 16
    },
    {
      pattern: /text-sm(?!.*font-(bold|semibold|medium))/,
      replacement: 'ContentText',
      size: 14
    },
  ],

  // Couleurs communes
  COLOR_PATTERNS: [
    {
      pattern: /text-white/,
      color: 'white'
    },
    {
      pattern: /text-gray-(\d+)/,
      color: 'currentTheme.colors.textSecondary'
    },
  ]
};

// Fonctions d'aide pour l'analyse
export const analyzeTextComponent = (textContent: string) => {
  const results = {
    suggestedComponent: 'UIText',
    props: {} as any,
    confidence: 0
  };

  // Analyser les patterns de titre
  for (const pattern of TYPOGRAPHY_PATTERNS.HEADING_PATTERNS) {
    if (pattern.pattern.test(textContent)) {
      results.suggestedComponent = pattern.replacement;
      results.props.size = pattern.size;
      results.confidence = 0.9;
      break;
    }
  }

  // Analyser les patterns d'interface
  if (results.confidence < 0.5) {
    for (const pattern of TYPOGRAPHY_PATTERNS.UI_PATTERNS) {
      if (pattern.pattern.test(textContent)) {
        results.suggestedComponent = pattern.replacement;
        results.props.size = pattern.size;
        results.confidence = 0.7;
        break;
      }
    }
  }

  // Analyser les patterns de contenu
  if (results.confidence < 0.5) {
    for (const pattern of TYPOGRAPHY_PATTERNS.CONTENT_PATTERNS) {
      if (pattern.pattern.test(textContent)) {
        results.suggestedComponent = pattern.replacement;
        results.props.size = pattern.size;
        results.confidence = 0.6;
        break;
      }
    }
  }

  // Analyser les couleurs
  for (const pattern of TYPOGRAPHY_PATTERNS.COLOR_PATTERNS) {
    if (pattern.pattern.test(textContent)) {
      results.props.color = pattern.color;
      break;
    }
  }

  return results;
};

// Mapping des classes Tailwind vers les props
export const TAILWIND_TO_PROPS = {
  // Tailles
  'text-xs': { size: 12 },
  'text-sm': { size: 14 },
  'text-base': { size: 16 },
  'text-lg': { size: 18 },
  'text-xl': { size: 20 },
  'text-2xl': { size: 24 },
  'text-3xl': { size: 30 },
  'text-4xl': { size: 36 },

  // Poids
  'font-normal': { weight: 'normal' },
  'font-medium': { weight: '500' },
  'font-semibold': { weight: '600' },
  'font-bold': { weight: 'bold' },

  // Alignement
  'text-left': { align: 'left' },
  'text-center': { align: 'center' },
  'text-right': { align: 'right' },

  // Couleurs
  'text-white': { color: 'white' },
  'text-black': { color: 'black' },
};

// Génération de code de remplacement
export const generateReplacementCode = (
  originalText: string,
  analysis: ReturnType<typeof analyzeTextComponent>,
  children: string
) => {
  const { suggestedComponent, props } = analysis;
  
  let propsString = '';
  if (Object.keys(props).length > 0) {
    propsString = Object.entries(props)
      .map(([key, value]) => {
        if (typeof value === 'string' && !value.startsWith('currentTheme')) {
          return `${key}="${value}"`;
        }
        return `${key}={${value}}`;
      })
      .join(' ');
  }

  return `<${suggestedComponent}${propsString ? ' ' + propsString : ''}>${children}</${suggestedComponent}>`;
};

// Exemples de migration
export const MIGRATION_EXAMPLES = [
  {
    before: '<Text style={tw`text-2xl font-bold text-white`}>Titre</Text>',
    after: '<H1 color="white">Titre</H1>',
    component: 'H1'
  },
  {
    before: '<Text style={tw`text-base text-gray-500`}>Description</Text>',
    after: '<ContentText color={currentTheme.colors.textSecondary}>Description</ContentText>',
    component: 'ContentText'
  },
  {
    before: '<Text style={tw`text-sm font-medium`}>Bouton</Text>',
    after: '<UIText size={14} weight="500">Bouton</UIText>',
    component: 'UIText'
  },
];

// Log des suggestions de migration
export const logMigrationSuggestion = (filePath: string, line: number, suggestion: string) => {}; 