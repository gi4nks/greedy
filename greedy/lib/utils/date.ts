import {
  format,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
} from "date-fns";

/**
 * Formats a date string consistently for both server and client rendering
 * to avoid hydration mismatches. Uses MM/dd/yyyy format.
 */
export function formatDate(
  dateString: string | Date | null | undefined,
): string {
  if (!dateString) return "Unknown";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return format(date, "MM/dd/yyyy");
  } catch {
    return "Invalid Date";
  }
}

/**
 * Formats a date with month and year for headers/grouping
 */
export function formatMonthYear(
  dateString: string | Date | null | undefined,
): string {
  if (!dateString) return "Unknown";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return format(date, "MMMM yyyy");
  } catch {
    return "Invalid Date";
  }
}

/**
 * Formats a date for display in UI components
 */
export function formatDisplayDate(
  dateString: string | Date | null | undefined,
): string {
  if (!dateString) return "Unknown";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString();
  } catch {
    return "Invalid Date";
  }
}

/**
 * Formats a date as DD MMM YYYY (e.g., "10 Oct 2025")
 */
export function formatCardDate(
  dateString: string | Date | null | undefined,
): string {
  if (!dateString) return "No date available";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";

    const day = date.getDate().toString().padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  } catch {
    return "Invalid date";
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
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

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
