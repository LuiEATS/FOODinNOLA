import Link from "next/link";

export default function Header() {
  return (
    <header className="flex items-center justify-between border-b border-purple-soft/40 bg-white px-6 py-3">
      <Link href="/" className="font-heading text-xl font-bold italic text-purple-deep">
        FOODin<span className="text-gold-bright">NOLA</span>
      </Link>
      <nav className="flex items-center gap-4 text-sm font-medium text-purple">
        <Link href="/explore" className="hover:text-purple-deep">
          Explore
        </Link>
        <Link href="/submit" className="hover:text-purple-deep">
          Submit a Spot
        </Link>
      </nav>
    </header>
  );
}
