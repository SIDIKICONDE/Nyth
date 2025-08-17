/**
 * Trouve le prochain jour de la semaine spécifié
 */
export function getNextWeekday(fromDate: Date, targetDay: number): Date {
  const result = new Date(fromDate);
  const currentDay = result.getDay();

  // Calculer les jours à ajouter pour atteindre le jour cible
  let daysToAdd = targetDay - currentDay;

  // Si c'est le même jour ou un jour passé cette semaine, aller à la semaine suivante
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }

  result.setDate(result.getDate() + daysToAdd);
  return result;
}

/**
 * Parse une heure au format français (14h, 14h30, 14:30, 2pm, etc.)
 */
function parseTime(
  timeString: string
): { hours: number; minutes: number } | null {
  // Nettoyer la chaîne
  const cleanTime = timeString.trim().toLowerCase();

  // Différents patterns pour les heures
  const patterns = [
    // 14h30, 14h, 14:30, 14:00
    /^(\d{1,2})(?:h|:)(\d{2})?$/,
    // 2pm, 2:30pm, 2 pm
    /^(\d{1,2})(?::(\d{2}))?\s*([ap])m?$/,
    // Juste le nombre (ex: "14" pour 14h00)
    /^(\d{1,2})$/,
  ];

  for (const pattern of patterns) {
    const match = cleanTime.match(pattern);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2] || "0", 10);
      const period = match[3]; // 'a' pour AM, 'p' pour PM

      // Gérer AM/PM
      if (period === "p" && hours < 12) {
        hours += 12;
      } else if (period === "a" && hours === 12) {
        hours = 0;
      }

      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return { hours, minutes };
      }
    }
  }

  return null;
}

/**
 * Traite et valide une date en tenant compte de la date actuelle
 */
export function processDate(dateString: string): Date {
  const now = new Date();
  const currentYear = now.getFullYear();

  try {
    // Essayer de parser la date directement
    let parsedDate = new Date(dateString);

    // Si la date est invalide, essayer d'autres formats
    if (isNaN(parsedDate.getTime())) {
      // Traiter les dates relatives en français
      const lowerDateString = dateString.toLowerCase().trim();

      // Extraire l'heure si présente (ex: "demain 14h", "today 2pm", "lundi 9h30")
      let timeInfo: { hours: number; minutes: number } | null = null;
      const timePatterns = [
        /(\d{1,2}h\d{2})/, // 14h30
        /(\d{1,2}h)/, // 14h
        /(\d{1,2}:\d{2})/, // 14:30
        /(\d{1,2}\s*(?:am|pm))/, // 2pm, 2 pm
        /(\d{1,2}:\d{2}\s*(?:am|pm))/, // 2:30pm
      ];

      for (const pattern of timePatterns) {
        const timeMatch = lowerDateString.match(pattern);
        if (timeMatch) {
          timeInfo = parseTime(timeMatch[1]);
          if (timeInfo) break; // Arrêter dès qu'on trouve une heure valide
        }
      }

      if (
        lowerDateString.includes("aujourd'hui") ||
        lowerDateString.includes("today")
      ) {
        parsedDate = new Date(now);
      } else if (
        lowerDateString.includes("demain") ||
        lowerDateString.includes("tomorrow")
      ) {
        parsedDate = new Date(now);
        parsedDate.setDate(parsedDate.getDate() + 1);
      } else if (
        lowerDateString.includes("après-demain") ||
        lowerDateString.includes("day after tomorrow")
      ) {
        parsedDate = new Date(now);
        parsedDate.setDate(parsedDate.getDate() + 2);
      } else if (
        lowerDateString.includes("dans") ||
        lowerDateString.includes("in")
      ) {
        // Gérer "dans X jours", "in X days"
        const daysMatch = lowerDateString.match(
          /(?:dans|in)\s+(\d+)\s+(?:jours?|days?)/
        );
        if (daysMatch) {
          const daysToAdd = parseInt(daysMatch[1]);
          parsedDate = new Date(now);
          parsedDate.setDate(parsedDate.getDate() + daysToAdd);
        }
      } else if (
        lowerDateString.includes("semaine") ||
        lowerDateString.includes("week")
      ) {
        // Gérer "la semaine prochaine", "next week"
        parsedDate = new Date(now);
        parsedDate.setDate(parsedDate.getDate() + 7);
      } else if (
        lowerDateString.includes("lundi") ||
        lowerDateString.includes("monday")
      ) {
        parsedDate = getNextWeekday(now, 1); // Lundi = 1
      } else if (
        lowerDateString.includes("mardi") ||
        lowerDateString.includes("tuesday")
      ) {
        parsedDate = getNextWeekday(now, 2);
      } else if (
        lowerDateString.includes("mercredi") ||
        lowerDateString.includes("wednesday")
      ) {
        parsedDate = getNextWeekday(now, 3);
      } else if (
        lowerDateString.includes("jeudi") ||
        lowerDateString.includes("thursday")
      ) {
        parsedDate = getNextWeekday(now, 4);
      } else if (
        lowerDateString.includes("vendredi") ||
        lowerDateString.includes("friday")
      ) {
        parsedDate = getNextWeekday(now, 5);
      } else if (
        lowerDateString.includes("samedi") ||
        lowerDateString.includes("saturday")
      ) {
        parsedDate = getNextWeekday(now, 6);
      } else if (
        lowerDateString.includes("dimanche") ||
        lowerDateString.includes("sunday")
      ) {
        parsedDate = getNextWeekday(now, 0); // Dimanche = 0
      } else {
        // Essayer de parser avec différents formats
        const formats = [
          // Format ISO
          dateString,
          // Ajouter l'année actuelle si elle manque
          `${dateString} ${currentYear}`,
          // Format français DD/MM/YYYY
          dateString.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, "$3-$2-$1"),
          // Format français DD/MM (ajouter l'année)
          dateString.replace(/(\d{1,2})\/(\d{1,2})$/, `$1/$2/${currentYear}`),
        ];

        for (const format of formats) {
          const testDate = new Date(format);
          if (!isNaN(testDate.getTime())) {
            parsedDate = testDate;
            break;
          }
        }
      }

      // Appliquer l'heure si elle a été extraite
      if (timeInfo && !isNaN(parsedDate.getTime())) {
        parsedDate.setHours(timeInfo.hours, timeInfo.minutes, 0, 0);
      }
    }

    // Si la date est toujours invalide, utiliser demain par défaut
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date(now);
      parsedDate.setDate(parsedDate.getDate() + 1);
    }

    // Si la date est dans le passé (plus de 24h), l'ajuster à l'année actuelle
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    if (parsedDate < oneDayAgo) {
      parsedDate.setFullYear(currentYear);

      // Si c'est encore dans le passé, ajouter un an
      if (parsedDate < oneDayAgo) {
        parsedDate.setFullYear(currentYear + 1);
      }
    }

    return parsedDate;
  } catch (error) {
    // En cas d'erreur, retourner demain
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
}

/**
 * Fonction de test pour vérifier le parsing des dates
 * À supprimer en production
 */
export function testDateParsing() {
  const testCases = [
    "demain 14h",
    "demain 14h30",
    "lundi 9h",
    "today 2pm",
    "tomorrow 2:30pm",
    "vendredi 18h45",
    "aujourd'hui 12h",
  ];

  testCases.forEach((testCase) => {
    const result = processDate(testCase);
  });
}
