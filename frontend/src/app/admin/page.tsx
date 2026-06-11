"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentAdmin } from "@/lib/auth";
import { api, ApiRequestError } from "@/lib/api";
import { Booking, User } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

type Tab = "users" | "approvals" | "all";

export default function AdminPage() {
  const router = useRouter();
  const { data: admin, isLoading: adminLoading } = useCurrentAdmin();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>("users");
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  useEffect(() => {
    if (!adminLoading && !admin) router.replace("/admin-login");
  }, [adminLoading, admin, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  function notify(message: string, isError = false) {
    setToast({ message, isError });
  }

  function invalidateBookings() {
    queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
  }

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: () => api.get<User[]>("/admin/users"),
    enabled: !!admin,
  });

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["admin-bookings"],
    queryFn: () => api.get<Booking[]>("/bookings"),
    enabled: !!admin,
  });

  const pending = useMemo(() => bookings.filter((b) => b.status === "pending"), [bookings]);
  const cancelRequests = useMemo(
    () => bookings.filter((b) => b.status === "cancel_requested"),
    [bookings]
  );

  const stats = {
    totalUsers: users.length,
    totalBookings: bookings.length,
    pending: pending.length,
    cancels: cancelRequests.length,
  };

  const deleteUser = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      notify("User removed.");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => notify("Could not remove user", true),
  });

  const approveBooking = useMutation({
    mutationFn: (id: number) => api.put<{ auto_rejected: number }>(`/booking/${id}/approve`),
    onSuccess: (res) => {
      notify(
        res.auto_rejected > 0
          ? `Booking approved — ${res.auto_rejected} conflicting request(s) auto-rejected.`
          : "Booking approved."
      );
      invalidateBookings();
    },
    onError: (err) => notify(err instanceof ApiRequestError ? err.message : "Approve failed", true),
  });

  const rejectBooking = useMutation({
    mutationFn: (id: number) => api.put(`/booking/${id}/reject`),
    onSuccess: () => {
      notify("Booking rejected.");
      invalidateBookings();
    },
    onError: () => notify("Reject failed", true),
  });

  const approveCancel = useMutation({
    mutationFn: (id: number) => api.put(`/booking/${id}/approve-cancel`),
    onSuccess: () => {
      notify("Cancellation confirmed — slot freed.");
      invalidateBookings();
    },
    onError: () => notify("Action failed", true),
  });

  const denyCancel = useMutation({
    mutationFn: (id: number) => api.put(`/booking/${id}/deny-cancel`),
    onSuccess: () => {
      notify("Cancellation request denied.");
      invalidateBookings();
    },
    onError: () => notify("Action failed", true),
  });

  const deleteBooking = useMutation({
    mutationFn: (id: number) => api.delete(`/booking/${id}`),
    onSuccess: () => {
      notify("Booking deleted.");
      invalidateBookings();
    },
    onError: () => notify("Delete failed", true),
  });

  async function handleLogout() {
    await api.post("/admin/logout");
    queryClient.setQueryData(["admin-me"], null);
    router.push("/admin-login");
  }

  if (adminLoading || !admin) {
    return <div className="mx-auto max-w-6xl px-6 py-16 text-slate-500">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {toast && (
        <div
          className={`fixed right-6 top-20 z-50 rounded-md px-4 py-2.5 text-sm text-white shadow-lg ${
            toast.isError ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Admin dashboard</h1>
        <button
          onClick={handleLogout}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Logout
        </button>
      </div>
      <p className="mt-1 text-sm text-slate-500">Signed in as {admin.email}</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Users" value={stats.totalUsers} />
        <Stat label="Bookings" value={stats.totalBookings} />
        <Stat label="Pending" value={stats.pending} />
        <Stat label="Cancel requests" value={stats.cancels} />
      </div>

      <div className="mt-8 flex gap-2 border-b border-slate-200">
        <TabButton active={tab === "users"} onClick={() => setTab("users")}>
          Users
        </TabButton>
        <TabButton active={tab === "approvals"} onClick={() => setTab("approvals")}>
          Approvals
          {stats.pending + stats.cancels > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
              {stats.pending + stats.cancels}
            </span>
          )}
        </TabButton>
        <TabButton active={tab === "all"} onClick={() => setTab("all")}>
          All bookings
        </TabButton>
      </div>

      {tab === "users" && (
        <Section title="Registered users">
          <Table headers={["Student ID", "Name", "Email", "Phone", "Action"]}>
            {users.length === 0 && <EmptyRow span={5} text="No users yet." />}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="py-3 font-mono text-xs">{u.student_id}</td>
                <td className="py-3">{u.first_name} {u.last_name}</td>
                <td className="py-3">{u.email}</td>
                <td className="py-3">{u.phone}</td>
                <td className="py-3">
                  <button
                    onClick={() => deleteUser.mutate(u.id)}
                    className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        </Section>
      )}

      {tab === "approvals" && (
        <>
          <Section title="Pending booking requests">
            <Table headers={["Requester", "Purpose", "Date", "Time", "Notes", "Action"]}>
              {pending.length === 0 && <EmptyRow span={6} text="No pending requests." />}
              {pending.map((b) => (
                <tr key={b.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3">{b.student_id}</td>
                  <td className="py-3">{b.match_type || "–"}</td>
                  <td className="py-3">{b.date}</td>
                  <td className="py-3 whitespace-nowrap">{b.starting_time} – {b.ending_time}</td>
                  <td className="py-3 max-w-[200px] truncate text-slate-500">{b.notes || "–"}</td>
                  <td className="py-3 space-x-2">
                    <button
                      onClick={() => approveBooking.mutate(b.id)}
                      className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectBooking.mutate(b.id)}
                      className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </Table>
          </Section>

          <Section title="Cancellation requests">
            <Table headers={["Requester", "Purpose", "Date", "Time", "Action"]}>
              {cancelRequests.length === 0 && <EmptyRow span={5} text="No cancellation requests." />}
              {cancelRequests.map((b) => (
                <tr key={b.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3">{b.student_id}</td>
                  <td className="py-3">{b.match_type || "–"}</td>
                  <td className="py-3">{b.date}</td>
                  <td className="py-3 whitespace-nowrap">{b.starting_time} – {b.ending_time}</td>
                  <td className="py-3 space-x-2">
                    <button
                      onClick={() => approveCancel.mutate(b.id)}
                      className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => denyCancel.mutate(b.id)}
                      className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                    >
                      Deny
                    </button>
                  </td>
                </tr>
              ))}
            </Table>
          </Section>
        </>
      )}

      {tab === "all" && (
        <Section title="All bookings">
          <Table headers={["Requester", "Purpose", "Date", "Time", "Status", "Action"]}>
            {bookings.length === 0 && <EmptyRow span={6} text="No bookings yet." />}
            {bookings.map((b) => (
              <tr key={b.id} className="border-b border-slate-100 last:border-0">
                <td className="py-3">{b.student_id}</td>
                <td className="py-3">{b.match_type || "–"}</td>
                <td className="py-3">{b.date}</td>
                <td className="py-3 whitespace-nowrap">{b.starting_time} – {b.ending_time}</td>
                <td className="py-3"><StatusBadge status={b.status} /></td>
                <td className="py-3">
                  <button
                    onClick={() => deleteBooking.mutate(b.id)}
                    className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        </Section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm">
      <div className="text-2xl font-bold text-emerald-700">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
        active
          ? "border-emerald-600 text-emerald-700"
          : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 overflow-x-auto">{children}</div>
    </section>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full min-w-[640px] text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-slate-500">
          {headers.map((h) => (
            <th key={h} className="py-2 font-medium">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function EmptyRow({ span, text }: { span: number; text: string }) {
  return (
    <tr>
      <td colSpan={span} className="py-8 text-center text-slate-400">
        {text}
      </td>
    </tr>
  );
}
