"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  ListFilter,
  Search,
  Filter,
  Clock,
  UserCheck,
  UserX,
  XCircle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Loader2,
  BookmarkCheck,
  ChevronDown,
  Eye,
} from "lucide-react";
import { studioDateTime, type ReservationRecord } from "@/domain/models/planning";
import { Button } from "@/components/ui/button";
import { SessionPreviewModal } from "@/features/planning/session-preview-modal";
import styles from "./reservations.module.css";

interface CrmReservationsViewProps {
  initialItems: ReservationRecord[];
  initialCursor: string | null;
  initialError?: string | null;
}

export function CrmReservationsView({
  initialItems,
  initialCursor,
  initialError,
}: CrmReservationsViewProps) {
  const [items, setItems] = useState<ReservationRecord[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor);
  const [loadError, setLoadError] = useState<string | null>(initialError ?? null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  // Preview Modal State
  const [previewSessionId, setPreviewSessionId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewInitialData, setPreviewInitialData] = useState<ReservationRecord | null>(null);

  const handleOpenPreview = (item: ReservationRecord) => {
    setPreviewSessionId(item.sessionId);
    setPreviewInitialData(item);
    setPreviewOpen(true);
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [attendanceFilter, setAttendanceFilter] = useState<string>("all");
  const [instructorFilter, setInstructorFilter] = useState<string>("all");

  // Extract instructors
  const instructors = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => set.add(item.instructor));
    return Array.from(set).sort();
  }, [items]);

  // Load More logic
  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/crm/reservations?after=${encodeURIComponent(nextCursor)}`);
      if (!res.ok) throw new Error("load");
      {
        const data = await res.json();
        setItems((prev) => Array.from(new Map([...prev, ...data.items].map(item => [item.id, item])).values()));
        setNextCursor(data.nextCursor || null);
      }
    } catch {
      setLoadError("Les réservations n’ont pas pu être chargées. Réessayez ou actualisez la page.");
    } finally {
      setLoadingMore(false);
    }
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search text (client name or course title)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesClient = item.clientName.toLowerCase().includes(q);
        const matchesTitle = item.sessionTitle.toLowerCase().includes(q);
        if (!matchesClient && !matchesTitle) return false;
      }

      // Instructor filter
      if (instructorFilter !== "all" && item.instructor !== instructorFilter) {
        return false;
      }

      // Booking Status filter
      if (statusFilter === "confirmed" && item.bookingStatus !== "confirmed") return false;
      if (statusFilter === "cancelled" && item.bookingStatus !== "cancelled") return false;

      // Attendance Status filter
      if (attendanceFilter !== "all") {
        if (attendanceFilter === "present" && item.attendanceStatus !== "present") return false;
        if (attendanceFilter === "absent" && item.attendanceStatus !== "absent") return false;
        if (attendanceFilter === "unmarked" && item.attendanceStatus !== "unmarked") return false;
      }

      return true;
    });
  }, [items, searchQuery, statusFilter, attendanceFilter, instructorFilter]);

  // Statistics
  const confirmedCount = items.filter((i) => i.bookingStatus === "confirmed").length;
  const presentCount = items.filter((i) => i.attendanceStatus === "present").length;
  const absentCount = items.filter((i) => i.attendanceStatus === "absent").length;
  const cancelledCount = items.filter((i) => i.bookingStatus === "cancelled").length;

  return (
    <div className={styles.reservations + " space-y-6"}>
      <section aria-label="Synthèse des réservations chargées" className={styles.stats}>
        {[{ label: "Chargées", value: items.length, icon: BookmarkCheck }, { label: "Confirmées", value: confirmedCount, icon: CheckCircle2 }, { label: "Présentes", value: presentCount, icon: UserCheck }, { label: "Absentes", value: absentCount, icon: UserX }, { label: "Annulées", value: cancelledCount, icon: XCircle }].map(({label, value, icon: Icon}) => <article key={label} className={styles.stat}><div><span>{label}</span><Icon size={17} aria-hidden="true" /></div><strong>{value}</strong></article>)}
      </section>
      {/* TOOLBAR CONTROLS HEADER */}
      <div className={styles.toolbar}>
        {/* Top Row: View Switcher & Search */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Segmented Control Switcher */}
          <div className={styles.switcher} role="group" aria-label="Présentation des réservations">
            <button
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                view === "grid"
                  ? "bg-[#111] text-white shadow"
                  : "text-[#6b6255] hover:text-[#111]"
              }`}
            >
              <LayoutGrid size={17} />
              <span>Grille</span>
            </button>

            <button
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                view === "list"
                  ? "bg-[#111] text-white shadow"
                  : "text-[#6b6255] hover:text-[#111]"
              }`}
            >
              <ListFilter size={17} />
              <span>Liste</span>
            </button>
          </div>

          {/* Search Box */}
          <div className={styles.search}>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#988c7b]" size={16} />
            <input
              aria-label="Rechercher une cliente ou une séance"
              type="text"
              placeholder="Rechercher une cliente ou une séance…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-[#ded4c3] bg-[#fffdf9] pl-10 pr-4 py-2 text-xs font-medium text-[#443c30] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#b7893b]"
            />
          </div>
        </div>

        {/* Bottom Row: Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#eee5d8]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-bold text-[#887c6b]">
              <Filter size={14} /> Filtres :
            </span>

            {/* Booking status */}
            <select
              aria-label="Statut de réservation"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[#ded4c3] bg-[#fffdf9] px-3 py-1.5 text-xs font-medium text-[#443c30] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#b7893b]"
            >
              <option value="all">Réservation: Toutes</option>
              <option value="confirmed">Confirmées</option>
              <option value="cancelled">Annulées</option>
            </select>

            {/* Attendance status */}
            <select
              aria-label="Statut de présence"
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value)}
              className="rounded-xl border border-[#ded4c3] bg-[#fffdf9] px-3 py-1.5 text-xs font-medium text-[#443c30] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#b7893b]"
            >
              <option value="all">Présence: Tous les états</option>
              <option value="present">Présente</option>
              <option value="absent">Absente</option>
              <option value="unmarked">À renseigner</option>
            </select>

            {/* Coach filter */}
            {instructors.length > 0 && (
              <select
                aria-label="Coach"
              value={instructorFilter}
                onChange={(e) => setInstructorFilter(e.target.value)}
                className="rounded-xl border border-[#ded4c3] bg-[#fffdf9] px-3 py-1.5 text-xs font-medium text-[#443c30] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#b7893b]"
              >
                <option value="all">Coach: Tous</option>
                {instructors.map((ins) => (
                  <option key={ins} value={ins}>
                    Coach {ins}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="text-xs text-[#786c5c] font-medium">
            Affichage de <strong className="text-[#111]">{filteredItems.length}</strong> réservation(s)
          </div>
        </div>


      </div>

      {loadError && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{loadError} {!nextCursor && <button type="button" onClick={() => window.location.reload()} className="ml-2 underline">Réessayer</button>}</div>}
      <p className="text-xs text-[#786c5c]">Les filtres portent sur les réservations chargées. Chargez la suite pour étendre les résultats.</p>
      {/* RENDER GRID OR LIST */}
      {loadError && items.length === 0 ? null : view === "grid" ? (
        <GridView items={filteredItems} onPreview={handleOpenPreview} />
      ) : (
        <ListView items={filteredItems} onPreview={handleOpenPreview} />
      )}

      {/* LOAD MORE BUTTON */}
      {nextCursor && (
        <div className="pt-4 text-center">
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-2xl bg-[#111] hover:bg-[#222] text-white px-8 py-3 text-sm font-semibold shadow-md transition-all hover:scale-[1.02]"
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Chargement des réservations...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Charger plus de réservations</span>
                <ChevronDown size={16} />
              </span>
            )}
          </Button>
        </div>
      )}

      {/* SESSION PREVIEW MODAL */}
      <SessionPreviewModal
        sessionId={previewSessionId}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        initialData={previewInitialData}
      />
    </div>
  );
}

/* =========================================================================
   VUE 1: GRID VIEW (Cartes sublimes avec badges & émargement)
   ========================================================================= */
function GridView({
  items,
  onPreview,
}: {
  items: ReservationRecord[];
  onPreview: (item: ReservationRecord) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#c9bda8] bg-[#fffdf9] p-12 text-center shadow-sm">
        <BookmarkCheck size={40} className="mx-auto mb-3 text-[#b7893b] opacity-80" />
        <h3 className="font-serif text-2xl text-[#111]">Aucune réservation trouvée</h3>
        <p className="mt-2 text-sm text-[#776c5c]">
          Modifiez vos filtres de recherche pour consulter les réservations.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const initials = item.clientName
          .split(/\s+/)
          .slice(0, 2)
          .map((w) => w[0])
          .join("")
          .toUpperCase();

        return (
          <article
            key={item.id}
            className={styles.card}
          >
            {/* Top Bar Status */}
            <div
              className={`absolute top-0 left-0 right-0 h-0.5 ${
                item.bookingStatus === "cancelled"
                  ? "bg-rose-500"
                  : item.attendanceStatus === "present"
                  ? "bg-emerald-600"
                  : item.attendanceStatus === "absent"
                  ? "bg-amber-600"
                  : "bg-[#b7893b]"
              }`}
            />

            <div className="space-y-4 pt-1">
              {/* Header: Client Info */}
              <div className={styles.cardHeader}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#b7893b] text-xs font-bold text-black shadow-inner">
                    {initials || "CL"}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-[#111] text-base group-hover:text-[#b7893b] transition-colors">
                      {item.clientName}
                    </h3>
                    <p className="text-xs text-[#8c8070]">Cliente du centre</p>
                  </div>
                </div>

                {/* Status Badge */}
                {item.bookingStatus === "cancelled" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
                    <XCircle size={13} /> Annulée
                  </span>
                ) : item.attendanceStatus === "present" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    <UserCheck size={13} /> Présente
                  </span>
                ) : item.attendanceStatus === "absent" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    <UserX size={13} /> Absente
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#ede0c8] px-3 py-1 text-xs font-semibold text-[#765522]">
                    <CheckCircle2 size={13} /> Confirmée
                  </span>
                )}
              </div>

              {/* Course details */}
              <div className="space-y-2 rounded-2xl bg-[#fcf8f1] p-4 border border-[#eee4d5]">
                <div className="flex items-center justify-between">
                  <span className="inline-block rounded-lg bg-[#f0e4d2] px-2.5 py-0.5 text-xs font-bold text-[#765522]">
                    {studioDateTime(item.startsAt).slice(11)}
                  </span>
                  <span className="text-xs text-[#857969] font-medium flex items-center gap-1">
                    <Calendar size={13} />
                    {studioDateTime(item.startsAt).slice(0, 10)}
                  </span>
                </div>

                <h4 className="font-serif text-xl font-medium text-[#111]">
                  {item.sessionTitle}
                </h4>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#786c5c]">
                  <span>Coach {item.instructor}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> {item.durationMinutes} min
                  </span>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="mt-5 pt-4 border-t border-[#f0e7da] flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onPreview(item)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#f4ece0] hover:bg-[#ede0c8] px-3.5 py-2 text-xs font-bold text-[#765522] transition-colors"
              >
                <Eye size={14} />
                <span>Aperçu réservation</span>
              </button>

              <Link
                href={`/crm/planning/${item.sessionId}#presences`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8d6729] hover:text-[#111] transition-colors"
              >
                <span>Émargement & détail</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/* =========================================================================
   VUE 2: LIST VIEW (Tableau filtrable)
   ========================================================================= */
function ListView({
  items,
  onPreview,
}: {
  items: ReservationRecord[];
  onPreview: (item: ReservationRecord) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#c9bda8] bg-[#fffdf9] p-12 text-center shadow-sm">
        <BookmarkCheck size={40} className="mx-auto mb-3 text-[#b7893b] opacity-80" />
        <h3 className="font-serif text-2xl text-[#111]">Aucune réservation dans la liste</h3>
        <p className="mt-2 text-sm text-[#776c5c]">
          Modifiez vos filtres de recherche pour consulter les réservations.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.tableWrap} role="region" aria-label="Liste des réservations, défilement horizontal" tabIndex={0}>
      <table className="w-full text-left text-sm"><caption className="sr-only">Réservations chargées correspondant aux filtres sélectionnés</caption>
        <thead className="border-b border-[#eee3d1] bg-[#fbf7ef] text-xs font-bold text-[#8c8070] uppercase tracking-wider">
          <tr>
            <th scope="col" className="px-6 py-4">Cliente</th>
            <th scope="col" className="px-6 py-4">Cours & Date</th>
            <th scope="col" className="px-6 py-4">Coach</th>
            <th scope="col" className="px-6 py-4">Statut Réservation</th>
            <th scope="col" className="px-6 py-4">Émargement</th>
            <th scope="col" className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f2e9dc]">
          {items.map((item) => {
            const initials = item.clientName
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase();

            return (
              <tr
                key={item.id}
                className="hover:bg-[#faf4eb] transition-colors"
              >
                {/* Cliente */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#b7893b] text-xs font-bold text-black">
                      {initials || "CL"}
                    </span>
                    <div>
                      <p className="font-semibold text-[#111]">{item.clientName}</p>
                    </div>
                  </div>
                </td>

                {/* Cours & Date */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="font-semibold text-[#111]">{item.sessionTitle}</p>
                  <p className="text-xs text-[#887c6b]">
                    {studioDateTime(item.startsAt).slice(0, 10)} à{" "}
                    <strong>{studioDateTime(item.startsAt).slice(11)}</strong>
                  </p>
                </td>

                {/* Coach */}
                <td className="px-6 py-4 whitespace-nowrap font-medium text-[#6e6353]">
                  Coach {item.instructor}
                </td>

                {/* Statut Réservation */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.bookingStatus === "cancelled" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
                      <XCircle size={13} /> Annulée
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#ede0c8] px-3 py-1 text-xs font-semibold text-[#765522]">
                      <CheckCircle2 size={13} /> Confirmée
                    </span>
                  )}
                </td>

                {/* Émargement */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.attendanceStatus === "present" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                      <UserCheck size={13} /> Présente
                    </span>
                  ) : item.attendanceStatus === "absent" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      <UserX size={13} /> Absente
                    </span>
                  ) : (
                    <span className="text-xs text-[#998c7b] italic">
                      À renseigner
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onPreview(item)}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#f4ece0] hover:bg-[#ede0c8] px-3 py-1.5 text-xs font-bold text-[#765522] transition-colors"
                    >
                      <Eye size={13} />
                      <span>Aperçu</span>
                    </button>

                    <Link
                      href={`/crm/planning/${item.sessionId}#presences`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#8d6729] hover:underline"
                    >
                      <span>Émarger →</span>
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
