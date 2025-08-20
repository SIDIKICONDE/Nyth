export type BookColorPair = [string, string];

export const BOOK_COLORS: BookColorPair[] = [
  ["#2C1810", "#3D2317"], // Noir vintage profond
  ["#8B4513", "#A0522D"], // Brun sépia classique
  ["#556B2F", "#6B8E23"], // Vert olive vintage
  ["#8B0000", "#B22222"], // Rouge bordeaux antique
  ["#2F4F4F", "#3A5F5F"], // Gris ardoise vintage
  ["#CD853F", "#D2691E"], // Sable doré
  ["#483D8B", "#5A4F8B"], // Bleu ardoise vintage
  ["#B8860B", "#DAA520"], // Or antique
  ["#1C1C1C", "#2D2D2D"], // Noir charbon vintage
  ["#8B7355", "#A0826D"], // Cuir marron
  ["#8B008B", "#9932CC"], // Violet vintage
  ["#A0522D", "#CD853F"], // Terre cuite
  ["#2E2E2E", "#3F3F3F"], // Gris anthracite vintage
  ["#D2691E", "#FF8C00"], // Orange rétro
  ["#4B0082", "#6A5ACD"], // Indigo vintage
  ["#8B4513", "#A0522D"], // Brun sépia foncé
  ["#2F4F4F", "#3A5F5F"], // Vert gris vintage
  ["#CD853F", "#D2691E"], // Sable chaud
  ["#1A1A1A", "#2B2B2B"], // Noir profond vintage
  ["#A0522D", "#CD853F"], // Terre cuite claire
  ["#556B2F", "#6B8E23"], // Vert olive foncé
  ["#8B0000", "#B22222"], // Rouge bordeaux
  ["#483D8B", "#5A4F8B"], // Bleu ardoise
  ["#2C1810", "#3D2317"], // Noir vintage
  ["#8B7355", "#A0826D"], // Cuir marron clair
  ["#8B008B", "#9932CC"], // Violet antique
  ["#B8860B", "#DAA520"], // Or doré
  ["#2E2E2E", "#3F3F3F"], // Gris anthracite
  ["#D2691E", "#FF8C00"], // Orange vintage
  ["#4B0082", "#6A5ACD"], // Indigo profond
  ["#1C1C1C", "#2D2D2D"], // Noir charbon
  ["#556B2F", "#6B8E23"], // Vert olive clair
  ["#8B0000", "#B22222"], // Rouge bordeaux clair
];

export const getBookColor = (index: number): BookColorPair => {
  return BOOK_COLORS[index % BOOK_COLORS.length];
};
