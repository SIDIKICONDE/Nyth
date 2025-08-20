import { Lang } from "./types";

export const MESSAGES: Record<string, Record<Lang, string>> = {
  EVENT_CREATED: {
    fr: '✅ Événement "{title}" créé avec succès !',
    en: '✅ Event "{title}" successfully created!',
    es: '✅ ¡Evento "{title}" creado con éxito!',
    de: '✅ Ereignis "{title}" erfolgreich erstellt!',
    it: '✅ Evento "{title}" creato con successo!',
    pt: '✅ Evento "{title}" criado com sucesso!',
  },
  EVENT_UPDATED: {
    fr: '✅ Événement "{title}" modifié avec succès !',
    en: '✅ Event "{title}" successfully updated!',
    es: '✅ ¡Evento "{title}" modificado con éxito!',
    de: '✅ Ereignis "{title}" erfolgreich aktualisiert!',
    it: '✅ Evento "{title}" aggiornato con successo!',
    pt: '✅ Evento "{title}" atualizado com sucesso!',
  },
  EVENT_DELETED: {
    fr: '✅ Événement "{title}" supprimé avec succès !',
    en: '✅ Event "{title}" successfully deleted!',
    es: '✅ ¡Evento "{title}" eliminado con éxito!',
    de: '✅ Ereignis "{title}" erfolgreich gelöscht!',
    it: '✅ Evento "{title}" eliminato con successo!',
    pt: '✅ Evento "{title}" excluído com sucesso!',
  },
  GOAL_CREATED: {
    fr: '🎯 Objectif "{title}" créé avec succès !',
    en: '🎯 Goal "{title}" successfully created!',
    es: '🎯 ¡Objetivo "{title}" creado con éxito!',
    de: '🎯 Ziel "{title}" erfolgreich erstellt!',
    it: '🎯 Obiettivo "{title}" creato con successo!',
    pt: '🎯 Objetivo "{title}" criado com sucesso!',
  },
  ERROR_GENERIC: {
    fr: "❌ Une erreur est survenue. Veuillez réessayer.",
    en: "❌ An error occurred. Please try again.",
    es: "❌ Ocurrió un error. Por favor, inténtalo de nuevo.",
    de: "❌ Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    it: "❌ Si è verificato un errore. Riprova, per favore.",
    pt: "❌ Ocorreu um erro. Por favor, tente novamente.",
  },
  EVENT_NOT_FOUND: {
    fr: '❌ Aucun événement trouvé correspondant à "{criteria}".',
    en: '❌ No event found matching "{criteria}".',
    es: '❌ No se encontró ningún evento que coincida con "{criteria}".',
    de: '❌ Kein Ereignis gefunden, das "{criteria}" entspricht.',
    it: '❌ Nessun evento trovato corrispondente a "{criteria}".',
    pt: '❌ Nenhum evento encontrado correspondente a "{criteria}".',
  },
};

export function t(
  key: keyof typeof MESSAGES,
  lang: string,
  params: Record<string, string> = {}
): string {
  const l = (lang || "fr").substring(0, 2) as Lang;
  let template = MESSAGES[key][l] || MESSAGES[key].fr;
  Object.entries(params).forEach(([k, v]) => {
    template = template.replace(`{${k}}`, v);
  });
  return template;
}
