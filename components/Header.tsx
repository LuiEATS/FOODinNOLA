import Image from "next/image";
import Link from "next/link";
import UserNav from "./UserNav";

export default function Header() {
  return (
    <header className="flex items-center justify-between border-b border-purple-soft/40 bg-white px-4 py-3 sm:px-6">
      <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold italic text-purple-deep sm:text-xl">
        <Image src="/logo.png" alt="" width={35} height={32} className="h-7 w-auto sm:h-8" priority />
        <span>
          FOODin<span className="text-gold-bright">NOLA</span>
        </span>
      </Link>
      <nav className="flex items-center gap-3 whitespace-nowrap text-sm font-medium text-purple sm:gap-4">
        <Link href="/explore" className="hover:text-purple-deep">
          Explore
        </Link>
        <Link href="/submit" className="hover:text-purple-deep">
          <span className="sm:hidden">Submit</span>
          <span className="hidden sm:inline">Submit a Spot</span>
        </Link>
        <UserNav />
      </nav>
    </header>
  );
}
