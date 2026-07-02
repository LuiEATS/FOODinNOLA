export default function SnowballSpotPromo({ className = "" }: { className?: string }) {
  return (
    <a
      href="https://snoballspot.com"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 rounded-full bg-green-light px-4 py-1.5 text-sm font-medium text-green hover:bg-green-light/70 ${className}`}
    >
      🍧 Obsessed with snoballs? Visit SnoballSpot.com →
    </a>
  );
}
