/**
 * Construit le prompt pour corriger le texte
 */
export const buildCorrectionPrompt = (text: string): string => {
  return `Corrige uniquement les fautes d'orthographe, de grammaire et de ponctuation dans ce texte. Ne change pas le style, le sens ou la langue. Retourne seulement le texte corrigé sans explications :\n\n${text}`;
};

/**
 * Construit le prompt pour améliorer le texte
 */
export const buildImprovementPrompt = (text: string): string => {
  return `Améliore ce texte en le rendant plus clair, plus engageant et mieux structuré. Garde le même ton, le même message principal et surtout LA MÊME LANGUE. Retourne uniquement le texte amélioré :\n\n${text}`;
};

/**
 * Construit le prompt pour analyser le texte
 */
export const buildAnalysisPrompt = (text: string, detectedLanguage: string): string => {
  const prompts: Record<string, string> = {
    fr: `Analyse le texte suivant et fournis EN FRANÇAIS :\n1. Le ton utilisé\n2. Les points forts\n3. Les suggestions d'amélioration\n4. Le public cible probable\n\nTexte à analyser :\n\n${text}`,
    en: `Analyze the following text and provide IN ENGLISH:\n1. The tone used\n2. The strong points\n3. Suggestions for improvement\n4. The likely target audience\n\nText to analyze:\n\n${text}`,
    es: `Analiza el siguiente texto y proporciona EN ESPAÑOL:\n1. El tono utilizado\n2. Los puntos fuertes\n3. Sugerencias de mejora\n4. El público objetivo probable\n\nTexto a analizar:\n\n${text}`,
    de: `Analysiere den folgenden Text und gib AUF DEUTSCH an:\n1. Der verwendete Ton\n2. Die Stärken\n3. Verbesserungsvorschläge\n4. Die wahrscheinliche Zielgruppe\n\nZu analysierender Text:\n\n${text}`,
    it: `Analizza il seguente testo e fornisci IN ITALIANO:\n1. Il tono utilizzato\n2. I punti di forza\n3. Suggerimenti per il miglioramento\n4. Il pubblico target probabile\n\nTesto da analizzare:\n\n${text}`,
    pt: `Analise o seguinte texto e forneça EM PORTUGUÊS:\n1. O tom usado\n2. Os pontos fortes\n3. Sugestões de melhoria\n4. O público-alvo provável\n\nTexto a analisar:\n\n${text}`,
  };

  return prompts[detectedLanguage] || 
    `Analyze the following text and provide the analysis in ${detectedLanguage.toUpperCase()} (the same language as the text):\n1. The tone used\n2. The strong points\n3. Suggestions for improvement\n4. The likely target audience\n\nText to analyze:\n\n${text}`;
}; 