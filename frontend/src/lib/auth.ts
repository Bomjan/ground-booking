"use client";

import { useQuery } from "@tanstack/react-query";
import { api, ApiRequestError } from "./api";
import { User } from "./types";

export function useCurrentUser() {
  return useQuery<User | null>({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return await api.get<User>("/user/me");
      } catch (err) {
        if (err instanceof ApiRequestError && err.status === 401) return null;
        throw err;
      }
    },
  });
}

export function useCurrentAdmin() {
  return useQuery<{ email: string } | null>({
    queryKey: ["admin-me"],
    queryFn: async () => {
      try {
        return await api.get<{ email: string }>("/admin/me");
      } catch (err) {
        if (err instanceof ApiRequestError && err.status === 401) return null;
        throw err;
      }
    },
  });
}
