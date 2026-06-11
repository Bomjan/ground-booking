"use client";

import { useEffect, useMemo, useRef, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/lib/auth";
import { api, ApiRequestError } from "@/lib/api";
import { Booking, Profile } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

export default function ProfilePage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const queryClient = useQueryClient();

  const departmentRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const [forceEdit, setForceEdit] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  useEffect(() => {
    if (!userLoading && !user) router.replace("/login");
  }, [userLoading, user, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const { data: profile } = useQuery<Profile | null>({
    queryKey: ["my-profile"],
    queryFn: async () => {
      try {
        return await api.get<Profile>("/profile/me");
      } catch (err) {
        if (err instanceof ApiRequestError && err.status === 404) return null;
        throw err;
      }
    },
    enabled: !!user,
  });

  const editing = forceEdit || !profile;

  const { data: myBookings = [] } = useQuery<Booking[]>({
    queryKey: ["my-bookings"],
    queryFn: () => api.get<Booking[]>("/my-bookings"),
    enabled: !!user,
  });

  const stats = useMemo(() => {
    const total = myBookings.length;
    const todayStr = new Date().toISOString().split("T")[0];
    const upcoming = myBookings.filter((b) => b.status === "approved" && b.date >= todayStr).length;
    return { total, upcoming };
  }, [myBookings]);

  const saveProfile = useMutation({
    mutationFn: (payload: { email: string; department: string; phone: number }) =>
      api.post("/add/details", payload),
    onSuccess: () => {
      setToast({ message: "Details saved!" });
      setForceEdit(false);
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (err) => {
      setToast({
        message: err instanceof ApiRequestError ? `Error: ${err.message}` : "Server error",
        isError: true,
      });
    },
  });

  const deleteBooking = useMutation({
    mutationFn: (id: number) => api.delete(`/booking/${id}`),
    onSuccess: () => {
      setToast({ message: "Booking removed." });
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: () => setToast({ message: "Delete failed", isError: true }),
  });

  const requestCancel = useMutation({
    mutationFn: (id: number) => api.put(`/booking/${id}/request-cancel`),
    onSuccess: () => {
      setToast({ message: "Cancellation request sent." });
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (err) => {
      setToast({ message: err instanceof ApiRequestError ? err.message : "Request failed", isError: true });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const department = departmentRef.current?.value.trim() ?? "";
    if (!department) {
      setToast({ message: "Please enter your department.", isError: true });
      return;
    }
    const phoneNum = parseInt(phoneRef.current?.value ?? "", 10);
    if (isNaN(phoneNum)) {
      setToast({ message: "Please enter a valid phone number.", isError: true });
      return;
    }
    saveProfile.mutate({ email: user.email, department, phone: phoneNum });
  }

  if (userLoading || !user) {
    return <div className="mx-auto max-w-5xl px-6 py-16 text-slate-500">Loading…</div>;
  }

  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {toast && (
        <div
          className={`fixed right-6 top-20 z-50 rounded-md px-4 py-2.5 text-sm text-white shadow-lg ${
            toast.isError ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-700 text-xl font-semibold text-white">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {user.first_name} {user.last_name}
          </h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900">Personal details</h3>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
              <input className="input bg-emerald-50" value={user.email} readOnly />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Department</span>
              <input
                key={`dept-${profile?.id ?? "new"}`}
                ref={departmentRef}
                className="input"
                placeholder="e.g. IT"
                defaultValue={profile?.department ?? ""}
                disabled={!editing}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Phone</span>
              <input
                key={`phone-${profile?.id ?? "new"}`}
                ref={phoneRef}
                className="input"
                placeholder="17xxxxxx"
                defaultValue={profile ? String(profile.phone) : user.phone ?? ""}
                disabled={!editing}
              />
            </label>

            {editing ? (
              <button
                type="submit"
                disabled={saveProfile.isPending}
                className="w-full rounded-md bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saveProfile.isPending ? "Saving…" : "Save info"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setForceEdit(true)}
                className="w-full rounded-md border border-emerald-600 py-2.5 font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                Edit
              </button>
            )}
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900">Activity summary</h3>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-md bg-slate-50 p-4 text-center">
              <div className="text-2xl font-bold text-emerald-700">{stats.total}</div>
              <div className="mt-1 text-xs text-slate-500">Total bookings</div>
            </div>
            <div className="rounded-md bg-slate-50 p-4 text-center">
              <div className="text-2xl font-bold text-emerald-700">{stats.upcoming || "–"}</div>
              <div className="mt-1 text-xs text-slate-500">Upcoming approved</div>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900">My bookings</h3>
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
                    No bookings yet.{" "}
                    <a href="/booking" className="text-emerald-700 hover:underline">
                      Book the ground
                    </a>
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
