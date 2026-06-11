import { BookingStatus } from "@/lib/types";

const STYLES: Record<BookingStatus, { label: string; classes: string }> = {
  pending: { label: "Pending", classes: "bg-amber-100 text-amber-800" },
  approved: { label: "Approved", classes: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Rejected", classes: "bg-red-100 text-red-800" },
  cancel_requested: { label: "Cancel pending", classes: "bg-sky-100 text-sky-800" },
  cancelled: { label: "Cancelled", classes: "bg-slate-200 text-slate-600" },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const style = STYLES[status] ?? { label: status, classes: "bg-slate-100 text-slate-700" };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${style.classes}`}>
      {style.label}
    </span>
  );
}
