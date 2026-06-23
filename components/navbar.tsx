"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="w-full bg-slate-900 shadow-2xl border-b-4 border-blue-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3 no-underline">
            <img src="/images/logo.png" alt="Logo" className="h-8 sm:h-10 w-8 sm:w-10" />
            <div>
              <div className="text-lg sm:text-2xl font-bold text-white">Plan Matrix</div>
              <div className="text-xs text-blue-200 hidden sm:block">Workspace Intelligence</div>
            </div>
          </Link>

          <nav className="hidden md:flex gap-4 lg:gap-6">
            <Link
              href="/dashboard"
              className="text-white hover:text-blue-200 font-medium transition-colors text-sm lg:text-base"
            >
              Dashboard
            </Link>
            <Link
              href="/floor-plans"
              className="text-white hover:text-blue-200 font-medium transition-colors text-sm lg:text-base"
            >
              Floor Plans
            </Link>
            <Link
              href="/users"
              className="text-white hover:text-blue-200 font-medium transition-colors text-sm lg:text-base"
            >
              Users
            </Link>
            <Link
              href="/assignments"
              className="text-white hover:text-blue-200 font-medium transition-colors text-sm lg:text-base"
            >
              Assignments
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="hidden sm:block px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer active:scale-95"
            >
              Logout
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-white hover:text-blue-200 transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden mt-4 space-y-2 border-t border-blue-500 pt-4">
            <Link
              href="/dashboard"
              className="block px-4 py-2 text-white hover:bg-blue-700 rounded transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/floor-plans"
              className="block px-4 py-2 text-white hover:bg-blue-700 rounded transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Floor Plans
            </Link>
            <Link
              href="/users"
              className="block px-4 py-2 text-white hover:bg-blue-700 rounded transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Users
            </Link>
            <Link
              href="/assignments"
              className="block px-4 py-2 text-white hover:bg-blue-700 rounded transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Assignments
            </Link>
            <button
              onClick={() => {
                signOut({ callbackUrl: "/login" });
                setIsOpen(false);
              }}
              className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all duration-300"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
