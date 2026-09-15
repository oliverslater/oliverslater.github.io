export function formatDate(
  date?: Date | string | number | null,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
): string {
  if (!date) return "";
  try {
    const d =
      typeof date === "string" || typeof date === "number"
        ? new Date(date)
        : date;
    if (isNaN(d.getTime())) return typeof date === "string" ? date : "";
    return new Intl.DateTimeFormat("en-GB", options).format(d);
  } catch {
    return typeof date === "string" ? date : "";
  }
}

/**
 * Formats a date into "Month Year" (e.g. "Nov 2023"), commonly used for credentials and milestones.
 */
export function formatMonthYear(date?: Date | string | number | null): string {
  return formatDate(date, { month: "short", year: "numeric" });
}

const MONTH_NAMES: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function parseRoleDate(str: string, isEndDate: boolean): Date {
  if (!str || str.toLowerCase() === "present") return new Date();
  const parts = str.trim().split(/\s+/);
  if (parts.length === 2) {
    const month = MONTH_NAMES[parts[0].toLowerCase().slice(0, 3)];
    const year = parseInt(parts[1], 10);
    if (month !== undefined && !Number.isNaN(year)) {
      // If end date, count up to the end of the month (start of next month)
      return isEndDate
        ? new Date(Date.UTC(year, month + 1, 1))
        : new Date(Date.UTC(year, month, 1));
    }
  }
  return new Date(str);
}

export function calculateTotalExperienceYears(
  roles: Array<{ startDate: string; endDate: string }>,
): number {
  if (!roles || roles.length === 0) return 0;

  // Merge any overlapping or continuous engagement intervals
  const intervals = roles
    .map((role) => ({
      start: parseRoleDate(role.startDate, false).getTime(),
      end: parseRoleDate(role.endDate, true).getTime(),
    }))
    .sort((a, b) => a.start - b.start);

  const merged: Array<{ start: number; end: number }> = [];
  for (const interval of intervals) {
    if (merged.length === 0) {
      merged.push({ ...interval });
    } else {
      const last = merged[merged.length - 1];
      if (interval.start <= last.end) {
        last.end = Math.max(last.end, interval.end);
      } else {
        merged.push({ ...interval });
      }
    }
  }

  const totalMs = merged.reduce(
    (acc, curr) => acc + (curr.end - curr.start),
    0,
  );
  const years = totalMs / (1000 * 60 * 60 * 24 * 365.25);
  return Math.floor(years);
}
