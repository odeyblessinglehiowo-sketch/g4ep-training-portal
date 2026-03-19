"use client";

import { logout } from "@/app/logout/actions";

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 active:scale-[0.97]"
      >
        Logout
      </button>
    </form>
  );
}