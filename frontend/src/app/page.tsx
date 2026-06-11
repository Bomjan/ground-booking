import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <span className="inline-block rounded-full bg-white/10 px-4 py-1 text-sm font-medium tracking-wide">
            GCIT — Gyalpozhing
          </span>
          <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Smart Ground Booking for Campus Life
          </h1>
          <p className="mt-4 max-w-xl text-lg text-emerald-100">
            Reserve your time slot, check live availability, and manage campus
            ground usage — all in one place.
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              href="/booking"
              className="rounded-md bg-white px-6 py-3 font-semibold text-emerald-800 hover:bg-emerald-50"
            >
              Book the ground
            </Link>
            <Link
              href="/about"
              className="rounded-md border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white/10"
            >
              Learn more
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold text-slate-900">
          A better way to manage campus grounds
        </h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          <Feature
            title="Live availability"
            body="See exactly which time slots are booked, pending, or open before you submit a request."
          />
          <Feature
            title="Fair allocation"
            body="Bookings go through admin review, with automatic conflict resolution between overlapping requests."
          />
          <Feature
            title="One place for everything"
            body="Sign up, manage your profile, track your bookings, and request cancellations — all online."
          />
        </div>
      </section>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="font-semibold text-emerald-800">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
  );
}
