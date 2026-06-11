"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Booking } from "@/lib/types";

const TIMELINE_START = 6;
const TIMELINE_END = 22;
const TIMELINE_HOURS = TIMELINE_END - TIMELINE_START;

function timeToFraction(time: string) {
  const [h, m] = time.split(":").map(Number);
  return (h + m / 60 - TIMELINE_START) / TIMELINE_HOURS;
}

function hourLabel(h: number) {
  return h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
}

function statusLabel(status: string) {
  if (status === "pending") return "Pending";
  if (status === "cancel_requested") return "Cancel req.";
  return "Approved";
}

export function AvailabilityTimeline({ date }: { date: string }) {
  const { data, isLoading } = useQuery<Booking[]>({
    queryKey: ["bookings-active", date],
    queryFn: () => api.get<Booking[]>(`/bookings/date/${date}/all`),
    enabled: !!date,
  });

  const bookings = data ?? [];

  return (
    <div>
      <div className="relative h-12 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
        <div className="absolute inset-0 flex">
          {Array.from({ length: TIMELINE_HOURS }, (_, i) => TIMELINE_START + i).map((h) => (
            <div key={h} className="flex-1 border-r border-slate-200 last:border-r-0">
              <span className="ml-1 text-[10px] text-slate-400">{hourLabel(h)}</span>
            </div>
          ))}
        </div>
        {bookings.map((b) => {
          const startFrac = timeToFraction(b.starting_time);
          const endFrac = timeToFraction(b.ending_time);
          if (endFrac <= 0 || startFrac >= 1) return null;
          const left = Math.max(0, startFrac) * 100;
          const width = (Math.min(1, endFrac) - Math.max(0, startFrac)) * 100;
          const isPending = b.status === "pending";
          return (
            <div
              key={b.id}
              title={`${b.student_id} · ${b.match_type || "Booking"} · ${b.starting_time}-${b.ending_time} [${statusLabel(b.status)}]`}
              className={`absolute top-3 h-6 rounded text-[10px] font-medium leading-6 text-white ${
                isPending ? "bg-amber-400/90" : "bg-emerald-600/90"
              }`}
              style={{ left: `${left}%`, width: `${width}%` }}
            >
              <span className="ml-1 truncate block">{b.starting_time}-{b.ending_time}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {isLoading && <span className="text-xs text-slate-400">Loading…</span>}
        {!isLoading && bookings.length === 0 && (
          <span className="text-xs font-medium text-emerald-700">
            ✓ Ground is free all day!
          </span>
        )}
        {bookings.map((b) => (
          <div
            key={b.id}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
              b.status === "pending"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${b.status === "pending" ? "bg-amber-500" : "bg-emerald-600"}`}
            />
            <strong>{b.starting_time}–{b.ending_time}</strong>
            <span className="opacity-70">
              · {b.student_id} ({b.match_type || "–"}) [{statusLabel(b.status)}]
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
