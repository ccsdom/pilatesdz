import { cashMonthSchema, summarizeCash, type CashReportEntry } from "./cash-report";
import { studioDay, studioDateTime, type PilatesSession } from "./planning";
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

export type TimeSlotSummary = {
  slot: string;
  sessions: number;
  bookings: number;
  capacity: number;
};

export function hourlyAttendance(sessions: PilatesSession[]): TimeSlotSummary[] {
  const scheduled = sessions.filter(s => s.status === "scheduled");
  const slotsMap = new Map<string, { sessions: number; bookings: number; capacity: number }>([
    ["Matin (08h-12h)", { sessions: 0, bookings: 0, capacity: 0 }],
    ["Midi (12h-15h)", { sessions: 0, bookings: 0, capacity: 0 }],
    ["Après-midi (15h-18h)", { sessions: 0, bookings: 0, capacity: 0 }],
    ["Soir (18h+)", { sessions: 0, bookings: 0, capacity: 0 }],
  ]);

  for (const session of scheduled) {
    const hour = parseInt(studioDateTime(session.startsAt).slice(11, 13), 10);
    let key = "Soir (18h+)";
    if (hour < 12) key = "Matin (08h-12h)";
    else if (hour < 15) key = "Midi (12h-15h)";
    else if (hour < 18) key = "Après-midi (15h-18h)";

    const current = slotsMap.get(key)!;
    current.sessions += 1;
    current.bookings += session.bookedCount;
    current.capacity += session.capacity;
  }

  return Array.from(slotsMap.entries()).map(([slot, data]) => ({ slot, ...data }));
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
  const timeSlots = hourlyAttendance(inMonth);
  return {
    summary: summarizeDay(inMonth),
    daily,
    courses: [...courses].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "fr")),
    timeSlots,
  };
}

export function monthlyCash(month: string, entries: Pick<CashReportEntry, "receivedDate" | "amountMinor" | "corrected">[]) {
  const days = dashboardMonthDays(month);
  const included = entries.filter(entry => days.includes(entry.receivedDate));
  const daily = days.map(day => ({ day, ...summarizeCash(included.filter(entry => entry.receivedDate === day)) }));
  const activeDaysCount = daily.filter(d => d.netMinor > 0).length;
  const summary = summarizeCash(included);
  const averageMinorPerActiveDay = activeDaysCount > 0 ? Math.round(summary.netMinor / activeDaysCount) : 0;
  return {
    summary: { ...summary, activeDaysCount, averageMinorPerActiveDay },
    daily,
  };
}

export function formatMonthlyReportCsv(month: string, planning: MonthlyPlanning | null, cash: MonthlyCash | null): string {
  const days = dashboardMonthDays(month);
  const header = "Jour;Date;Séances maintenues;Réservations;Places non réservées;Taux de remplissage;Encaissements nets (DA)";
  const rows = days.map((day, index) => {
    const p = planning?.daily[index];
    const c = cash?.daily[index];
    const dayName = new Date(`${day}T12:00:00Z`).toLocaleDateString("fr-FR", { weekday: "long", timeZone: "UTC" });
    const formattedDay = `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${day.slice(8)}`;
    const sessions = p ? String(p.sessions) : "—";
    const bookings = p ? String(p.bookings) : "—";
    const available = p ? String(p.available) : "—";
    const occupancy = p?.occupancy != null ? `${p.occupancy}%` : "—";
    const cashStr = c ? (c.netMinor / 100).toFixed(2).replace(".", ",") : "—";
    return `"${formattedDay}";"${day}";"${sessions}";"${bookings}";"${available}";"${occupancy}";"${cashStr}"`;
  });
  return "\uFEFF" + [header, ...rows].join("\r\n");
}

export type MonthlyPlanning = ReturnType<typeof monthlyPlanning>;
export type MonthlyCash = ReturnType<typeof monthlyCash>;

