"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/lib/auth";
import { api } from "@/lib/api";

export function Navbar() {
  const { data: user } = useCurrentUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  async function handleLogout() {
    await api.post("/user/logout");
    queryClient.setQueryData(["me"], null);
    router.push("/");
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-emerald-700">
          GCIT Ground Booking
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/" className="hover:text-emerald-700">Home</Link>
          <Link href="/about" className="hover:text-emerald-700">About</Link>
          {user ? (
            <>
              <Link href="/booking" className="hover:text-emerald-700">Book</Link>
              <Link href="/profile" className="hover:text-emerald-700">Profile</Link>
              <button onClick={handleLogout} className="text-slate-500 hover:text-red-600">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-emerald-700">Login</Link>
              <Link
                href="/signup"
                className="rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
