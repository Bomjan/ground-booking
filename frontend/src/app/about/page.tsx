export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-900">About the Ground Booking System</h1>

      <p className="mt-6 text-slate-700 leading-relaxed">
        The Ground Booking System of Gyalpozhing College of Information
        Technology is designed to assist both faculty members and students in
        efficiently managing and scheduling their time for using the college
        grounds.
      </p>
      <p className="mt-4 text-slate-700 leading-relaxed">
        By organizing bookings in a clear and systematic way, the system
        ensures fair allocation of time among all users. It helps prevent
        overuse or misuse of facilities by allowing equal opportunities for
        everyone to access the grounds.
      </p>
      <p className="mt-4 text-slate-700 leading-relaxed">
        Overall, the ground booking system enhances convenience, promotes
        better time management, and supports a more organized and fair use of
        campus resources.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-emerald-800">What we aspire to</h2>
      <blockquote className="mt-3 border-l-4 border-emerald-600 pl-4 italic text-slate-600">
        &ldquo;To create a smart and efficient digital platform for Gyalpozhing
        College of Information Technology that ensures fair, transparent, and
        easy access to ground facilities for all students and faculty.&rdquo;
      </blockquote>

      <h2 className="mt-10 text-xl font-semibold text-emerald-800">How we get there</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-700">
        <li>A simple sign-up and login flow for students and staff</li>
        <li>A live timeline showing booked, pending, and open slots</li>
        <li>Admin review and approval to keep allocation fair</li>
        <li>Cancellation requests so freed-up slots become available again</li>
      </ul>
    </div>
  );
}
