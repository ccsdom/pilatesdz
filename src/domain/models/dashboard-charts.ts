import { cashMonthSchema, summarizeCash, type CashReportEntry } from "./cash-report";
import { studioDay, type PilatesSession } from "./planning";
import { summarizeDay } from "./dashboard";

export function dashboardMonthDays(month: string) {
  cashMonthSchema.parse(month);
  const date = new Date(`${month}-01T12:00:00Z`);
  const days: string[] = [];
  while (date.toISOString().startsWith(month)) {
    days.push(date.toISOString().slice(0, 10));
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return days;
}
export function monthlyPlanning(month: string, sessions: PilatesSession[]) {
  const days = dashboardMonthDays(month);
  const inMonth = sessions.filter(session => studioDay(session.startsAt).startsWith(month));
  const daily = days.map(day => {
    const summary = summarizeDay(inMonth.filter(session => studioDay(session.startsAt) === day));
    return { day, ...summary };
  });
  const courses = new Map<string, number>();
  for (const session of inMonth) if (session.status === "scheduled") courses.set(session.title, (courses.get(session.title) ?? 0) + 1);
  return { summary: summarizeDay(inMonth), daily, courses: [...courses].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "fr")) };
}
export function monthlyCash(month: string, entries: Pick<CashReportEntry, "receivedDate" | "amountMinor" | "corrected">[]) {
  const days = dashboardMonthDays(month);
  const included = entries.filter(entry => days.includes(entry.receivedDate));
  return { summary: summarizeCash(included), daily: days.map(day => ({ day, ...summarizeCash(included.filter(entry => entry.receivedDate === day)) })) };
}
export type MonthlyPlanning = ReturnType<typeof monthlyPlanning>;
export type MonthlyCash = ReturnType<typeof monthlyCash>;
