"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = { display_name: string | null; avatar_color: string | null; role: string };

export default function UserNav({
  variant = "desktop",
  onNavigate,
}: {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        setLoading(false);
        return;
      }
      supabase
        .from("profiles")
        .select("display_name, avatar_color, role")
        .eq("id", data.user.id)
        .single()
        .then(({ data: p }) => {
          setProfile(p);
          setLoading(false);
        });
    });
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    onNavigate?.();
    router.push("/");
    router.refresh();
  }

  if (loading) return <div className="h-5 w-16 animate-pulse rounded bg-purple-soft/30" />;

  if (!profile) {
    return (
      <Link href="/login" onClick={onNavigate} className="hover:text-purple-deep">
        Sign In
      </Link>
    );
  }

  const initials = (profile.display_name?.[0] ?? "?").toUpperCase();

  return (
    <div className={variant === "mobile" ? "flex flex-col gap-3" : "flex items-center gap-3"}>
      {profile.role === "admin" && (
        <Link href="/admin" onClick={onNavigate} className="text-gold-bright hover:text-gold">
          Admin
        </Link>
      )}
      <div className="flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: profile.avatar_color ?? "#7c3aed" }}
        >
          {initials}
        </div>
        <span className="text-text">{profile.display_name}</span>
      </div>
      <button
        type="button"
        onClick={signOut}
        className={variant === "mobile" ? "text-left text-xs text-muted hover:text-purple-deep" : "text-xs text-muted hover:text-purple-deep"}
      >
        Sign out
      </button>
    </div>
  );
}
