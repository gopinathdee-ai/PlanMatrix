"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="w-full bg-slate-900 shadow-2xl border-b-4 border-blue-600">
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-3 no-underline">
            <img src="/images/logo.png" alt="Logo" className="h-10 w-10" />
            <div>
              <div className="text-2xl font-bold text-white">Plan Matrix</div>
              <div className="text-xs text-blue-200">Workspace Intelligence</div>
            </div>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer active:scale-95"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
