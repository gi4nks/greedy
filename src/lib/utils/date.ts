import {
  format,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
} from "date-fns";

/**
 * Formats a date string consistently for both server and client rendering
 * to avoid hydration mismatches. Uses MMM d, yyyy format.
 */
export function formatDate(
  dateString: string | Date | null | undefined,
): string {
  if (!dateString) return "—";

  try {
    let date: Date;

    if (dateString instanceof Date) {
      date = dateString;
    } else {
      // Handle SQLite timestamp format (e.g., "2025-10-14 12:34:56")
      // Replace space with 'T' to make it ISO-like format
      const isoString = dateString.replace(' ', 'T');
      date = new Date(isoString);

      // If that doesn't work, try the original string
      if (isNaN(date.getTime())) {
        date = new Date(dateString);
      }
    }

    if (isNaN(date.getTime())) return "—";
    return format(date, "MMM d, yyyy");
  } catch {
    return "—";
  }
}

/**
 * Formats a date with month and year for headers/grouping
 */
export function formatMonthYear(
  dateString: string | Date | null | undefined,
): string {
  if (!dateString) return "—";

  try {
    let date: Date;

    if (dateString instanceof Date) {
      date = dateString;
    } else {
      // Handle SQLite timestamp format (e.g., "2025-10-14 12:34:56")
      // Replace space with 'T' to make it ISO-like format
      const isoString = dateString.replace(' ', 'T');
      date = new Date(isoString);

      // If that doesn't work, try the original string
      if (isNaN(date.getTime())) {
        date = new Date(dateString);
      }
    }

    if (isNaN(date.getTime())) return "—";
    return format(date, "MMMM yyyy");
  } catch {
    return "—";
  }
}

/**
 * Formats a date for display in UI components
 */
export function formatDisplayDate(
  dateString: string | Date | null | undefined,
): string {
  if (!dateString) return "—";

  try {
    let date: Date;

    if (dateString instanceof Date) {
      date = dateString;
    } else {
      // Handle SQLite timestamp format (e.g., "2025-10-14 12:34:56")
      // Replace space with 'T' to make it ISO-like format
      const isoString = dateString.replace(' ', 'T');
      date = new Date(isoString);

      // If that doesn't work, try the original string
      if (isNaN(date.getTime())) {
        date = new Date(dateString);
      }
    }

    if (isNaN(date.getTime())) return "—";

    // Use consistent format regardless of locale to prevent hydration mismatches
    const day = date.getDate().toString().padStart(2, "0");
    const month = date.getMonth() + 1; // getMonth() returns 0-based month
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return "—";
  }
}

/**
 * Formats a date consistently for UI display (DD/MM/YYYY format)
 * This is a simple wrapper around formatDisplayDate for clarity
 */
export function formatUIDate(
  dateString: string | Date | null | undefined,
): string {
  return formatDisplayDate(dateString);
}

/**
 * Formats a date as DD MMM YYYY (e.g., "10 Oct 2025")
 */
export function formatCardDate(
  dateString: string | Date | null | undefined,
): string {
  if (!dateString) return "—";

  try {
    let date: Date;

    if (dateString instanceof Date) {
      date = dateString;
    } else {
      // Handle SQLite timestamp format (e.g., "2025-10-14 12:34:56")
      // Replace space with 'T' to make it ISO-like format
      const isoString = dateString.replace(' ', 'T');
      date = new Date(isoString);

      // If that doesn't work, try the original string
      if (isNaN(date.getTime())) {
        date = new Date(dateString);
      }
    }

    if (isNaN(date.getTime())) return "—";

    const day = date.getDate().toString().padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  } catch {
    return "—";
  }
}

/**
 * Calculates and formats the duration between two dates
 */
export function formatDuration(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
): string {
  if (!startDate) return "Not started";

  try {
    // Helper function to parse date
    const parseDate = (dateString: string | Date): Date => {
      if (dateString instanceof Date) return dateString;

      // Handle SQLite timestamp format (e.g., "2025-10-14 12:34:56")
      // Replace space with 'T' to make it ISO-like format
      const isoString = dateString.replace(' ', 'T');
      const date = new Date(isoString);

      // If that doesn't work, try the original string
      if (isNaN(date.getTime())) {
        return new Date(dateString);
      }

      return date;
    };

    const start = parseDate(startDate);
    const end = endDate ? parseDate(endDate) : new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "Invalid dates";

    const days = Math.abs(differenceInDays(end, start));
    const weeks = Math.abs(differenceInWeeks(end, start));
    const months = Math.abs(differenceInMonths(end, start));
    const years = Math.abs(differenceInYears(end, start));

    if (years > 0) {
      return years === 1 ? "1 year" : `${years} years`;
    } else if (months > 0) {
      return months === 1 ? "1 month" : `${months} months`;
    } else if (weeks > 0) {
      return weeks === 1 ? "1 week" : `${weeks} weeks`;
    } else {
      return days === 1 ? "1 day" : `${days} days`;
    }
  } catch {
    return "Invalid dates";
  }
}
