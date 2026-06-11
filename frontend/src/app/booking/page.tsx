"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/lib/auth";
import { api, ApiRequestError } from "@/lib/api";
import { Booking } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { AvailabilityTimeline } from "@/components/availability-timeline";

const MAX_BOOKING_MINUTES = 90;

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function BookingPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const queryClient = useQueryClient();

  const [date, setDate] = useState(today());
  const [matchType, setMatchType] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  useEffect(() => {
    if (!userLoading && !user) router.replace("/login");
  }, [userLoading, user, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const { data: myBookings = [] } = useQuery<Booking[]>({
    queryKey: ["my-bookings"],
    queryFn: () => api.get<Booking[]>("/my-bookings"),
    enabled: !!user,
  });

  const createBooking = useMutation({
    mutationFn: (payload: Partial<Booking>) => api.post("/booking", payload),
    onSuccess: () => {
      setToast({ message: "Booking request submitted — pending admin approval." });
      setMatchType("");
      setStartTime("");
      setEndTime("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["bookings-active", date] });
    },
    onError: (err) => {
      setToast({ message: err instanceof ApiRequestError ? err.message : "Booking failed", isError: true });
    },
  });

  const deleteBooking = useMutation({
    mutationFn: (id: number) => api.delete(`/booking/${id}`),
    onSuccess: () => {
      setToast({ message: "Booking removed." });
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["bookings-active", date] });
    },
    onError: () => setToast({ message: "Delete failed", isError: true }),
  });

  const requestCancel = useMutation({
    mutationFn: (id: number) => api.put(`/booking/${id}/request-cancel`),
    onSuccess: () => {
      setToast({ message: "Cancellation request sent." });
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["bookings-active", date] });
    },
    onError: (err) => {
      setToast({ message: err instanceof ApiRequestError ? err.message : "Request failed", isError: true });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!matchType || !date || !startTime || !endTime) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (startTime >= endTime) {
      setFormError("End time must be after start time.");
      return;
    }
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    if (eh * 60 + em - (sh * 60 + sm) > MAX_BOOKING_MINUTES) {
      setFormError("Bookings cannot exceed 1.5 hours.");
      return;
    }

    createBooking.mutate({
      student_id: user!.email,
      match_type: matchType,
      date,
      starting_time: startTime,
      ending_time: endTime,
      notes,
    });
  }

  if (userLoading || !user) {
    return <div className="mx-auto max-w-5xl px-6 py-16 text-slate-500">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Book the ground</h1>
      <p className="mt-1 text-sm text-slate-500">Logged in as {user.email}</p>

      {toast && (
        <div
          className={`fixed right-6 top-20 z-50 rounded-md px-4 py-2.5 text-sm text-white shadow-lg ${
            toast.isError ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">New booking request</h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Date</span>
              <input
                type="date"
                className="input"
                min={today()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Purpose / match type</span>
              <input
                className="input"
                placeholder="e.g. Football practice"
                value={matchType}
                onChange={(e) => setMatchType(e.target.value)}
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Start time</span>
                <input
                  type="time"
                  className="input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">End time</span>
                <input
                  type="time"
                  className="input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Notes (optional)</span>
              <textarea
                className="input"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <button
              type="submit"
              disabled={createBooking.isPending}
              className="w-full rounded-md bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {createBooking.isPending ? "Submitting…" : "Submit request"}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Availability for {date}</h2>
          <p className="mt-1 text-xs text-slate-500">
            Bookings cannot exceed 1.5 hours. Slots shown below are pending or approved.
          </p>
          <div className="mt-4">
            <AvailabilityTimeline date={date} />
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900">My bookings</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 font-medium">Purpose</th>
                <th className="py-2 font-medium">Date</th>
                <th className="py-2 font-medium">Time</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {myBookings.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No bookings yet. Submit your first request above!
                  </td>
                </tr>
              )}
              {myBookings.map((b) => (
                <tr key={b.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3">{b.match_type || "–"}</td>
                  <td className="py-3">{b.date}</td>
                  <td className="py-3 whitespace-nowrap">{b.starting_time} – {b.ending_time}</td>
                  <td className="py-3"><StatusBadge status={b.status} /></td>
                  <td className="py-3">
                    {(b.status === "pending" || b.status === "rejected") && (
                      <button
                        onClick={() => deleteBooking.mutate(b.id)}
                        className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    )}
                    {b.status === "approved" && (
                      <button
                        onClick={() => requestCancel.mutate(b.id)}
                        className="rounded-md border border-sky-200 px-3 py-1 text-xs font-medium text-sky-700 hover:bg-sky-50"
                      >
                        Request cancel
                      </button>
                    )}
                    {b.status === "cancel_requested" && (
                      <span className="text-xs italic text-slate-400">Awaiting admin</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
