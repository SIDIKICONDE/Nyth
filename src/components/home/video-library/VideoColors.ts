// Couleur uniforme pour toutes les cassettes VHS - Bleu foncé classique
export const VIDEO_COLORS = [
  ["#2C3E50", "#34495E"], // Bleu foncé classique VHS
];

export const getVideoColor = (index: number): [string, string] => {
  // Retourne toujours la même couleur pour toutes les cassettes
  return VIDEO_COLORS[0] as [string, string];
};
