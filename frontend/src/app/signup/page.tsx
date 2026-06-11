"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiRequestError } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (Object.values(form).some((v) => !v.trim())) {
      setError("Please fill all fields");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/user/add", form);
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Server error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-6 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Create an account</h1>
      <p className="mt-1 text-sm text-slate-500">
        Already have one?{" "}
        <Link href="/login" className="text-emerald-700 hover:underline">
          Log in
        </Link>
      </p>

      {done ? (
        <div className="mt-8 rounded-md bg-emerald-50 p-4 text-emerald-800">
          Account created — redirecting to login…
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First name">
              <input
                className="input"
                value={form.first_name}
                onChange={(e) => update("first_name", e.target.value)}
              />
            </Field>
            <Field label="Last name">
              <input
                className="input"
                value={form.last_name}
                onChange={(e) => update("last_name", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Phone">
            <input
              className="input"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
          </Field>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Sign up"}
          </button>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
