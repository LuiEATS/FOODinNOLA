"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import UserNav from "./UserNav";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative border-b border-purple-soft/40 bg-white px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-heading text-xl font-bold italic text-purple-deep">
          <Image src="/logo.png" alt="" width={35} height={32} className="h-8 w-auto" priority />
          <span>
            FOODin<span className="text-gold-bright">NOLA</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-4 text-sm font-medium text-purple sm:flex">
          <Link href="/explore" className="hover:text-purple-deep">
            Explore
          </Link>
          <Link href="/submit" className="hover:text-purple-deep">
            Submit a Spot
          </Link>
          <UserNav />
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center text-purple-deep sm:hidden"
        >
          {open ? (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <nav className="mt-3 flex flex-col gap-3 border-t border-purple-soft/40 pt-3 text-sm font-medium text-purple sm:hidden">
          <Link href="/explore" onClick={() => setOpen(false)} className="hover:text-purple-deep">
            Explore
          </Link>
          <Link href="/submit" onClick={() => setOpen(false)} className="hover:text-purple-deep">
            Submit a Spot
          </Link>
          <UserNav variant="mobile" onNavigate={() => setOpen(false)} />
        </nav>
      )}
    </header>
  );
}
