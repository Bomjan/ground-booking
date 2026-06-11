"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { api, ApiRequestError } from "@/lib/api";
import { User } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please fill all fields");
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.post<{ message: string; user: User }>("/user/login", {
        email,
        password,
      });
      queryClient.setQueryData(["me"], result.user);
      router.push("/booking");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Server error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col px-6 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Log in</h1>
      <p className="mt-1 text-sm text-slate-500">
        New here?{" "}
        <Link href="/signup" className="text-emerald-700 hover:underline">
          Create an account
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Are you an admin?{" "}
        <Link href="/admin-login" className="text-emerald-700 hover:underline">
          Admin login
        </Link>
      </p>
    </div>
  );
}
