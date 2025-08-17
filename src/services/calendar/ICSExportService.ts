import RNFS from "react-native-fs";
import Share from "react-native-share";
import { Platform } from "react-native";
import { PlanningEvent, RecurringPattern } from "../../types/planning";

type RRDay = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";

function toPadded(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

function toICSDateUTC(date: Date): string {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = toPadded(d.getUTCMonth() + 1);
  const day = toPadded(d.getUTCDate());
  const hours = toPadded(d.getUTCHours());
  const minutes = toPadded(d.getUTCMinutes());
  const seconds = toPadded(d.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function mapDaysOfWeek(days: number[] | undefined): RRDay[] | undefined {
  if (!days || days.length === 0) return undefined;
  const map: Record<number, RRDay> = {
    0: "SU",
    1: "MO",
    2: "TU",
    3: "WE",
    4: "TH",
    5: "FR",
    6: "SA",
  };
  return days.map((d) => map[d]).filter((v): v is RRDay => Boolean(v));
}

function buildRRule(pattern: RecurringPattern | undefined): string | undefined {
  if (!pattern) return undefined;
  const parts: string[] = [];
  const freq = pattern.frequency.toUpperCase();
  parts.push(`FREQ=${freq}`);
  if (pattern.interval && pattern.interval > 0)
    parts.push(`INTERVAL=${pattern.interval}`);
  const byDays = mapDaysOfWeek(pattern.daysOfWeek);
  if (byDays && byDays.length > 0) parts.push(`BYDAY=${byDays.join(",")}`);
  if (pattern.maxOccurrences && pattern.maxOccurrences > 0)
    parts.push(`COUNT=${pattern.maxOccurrences}`);
  if (pattern.endDate)
    parts.push(`UNTIL=${toICSDateUTC(new Date(pattern.endDate))}`);
  return parts.length > 0 ? `RRULE:${parts.join(";")}` : undefined;
}

function foldLines(input: string): string {
  const lines = input.split("\r\n");
  const folded: string[] = [];
  for (const line of lines) {
    if (line.length <= 75) {
      folded.push(line);
    } else {
      let rest = line;
      folded.push(rest.slice(0, 75));
      rest = rest.slice(75);
      while (rest.length > 0) {
        const chunk = rest.slice(0, 74);
        folded.push(` ${chunk}`);
        rest = rest.slice(74);
      }
    }
  }
  return folded.join("\r\n");
}

function escapeText(value: string | undefined): string {
  if (!value) return "";
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function buildUID(event: PlanningEvent): string {
  const platform = Platform.OS === "ios" ? "ios" : "android";
  return `${event.id}@Naya-${platform}`;
}

function buildEventICS(event: PlanningEvent): string {
  const uid = buildUID(event);
  const dtStart = toICSDateUTC(new Date(event.startDate));
  const dtEnd = toICSDateUTC(new Date(event.endDate));
  const summary = escapeText(event.title);
  const location = escapeText(event.location);
  const description = escapeText(event.description);
  const rrule = buildRRule(event.recurring);

  const parts: string[] = [];
  parts.push("BEGIN:VEVENT");
  parts.push(`UID:${uid}`);
  parts.push(`DTSTART:${dtStart}`);
  parts.push(`DTEND:${dtEnd}`);
  parts.push(`SUMMARY:${summary}`);
  if (location) parts.push(`LOCATION:${location}`);
  if (description) parts.push(`DESCRIPTION:${description}`);
  if (rrule) parts.push(rrule);
  parts.push("END:VEVENT");
  return parts.join("\r\n");
}

export function generateICSForEvent(event: PlanningEvent): string {
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//Naya//Planning//FR");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  lines.push(buildEventICS(event));
  lines.push("END:VCALENDAR");
  const raw = lines.join("\r\n");
  return foldLines(raw);
}

export function generateICSForEvents(events: PlanningEvent[]): string {
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//Naya//Planning//FR");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  for (const e of events) lines.push(buildEventICS(e));
  lines.push("END:VCALENDAR");
  const raw = lines.join("\r\n");
  return foldLines(raw);
}

export async function saveAndShareICS(
  content: string,
  fileName: string
): Promise<string> {
  const dir = RNFS.DocumentDirectoryPath;
  const path = `${dir}/${fileName}`;
  await RNFS.writeFile(path, content, "utf8");
  const url = Platform.OS === "ios" ? path : `file://${path}`;
  try {
    await Share.open({ url, type: "text/calendar", failOnCancel: false });
  } catch {}
  return path;
}
