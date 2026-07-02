"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const AVATAR_COLORS = ["#6b21a8", "#7c3aed", "#92680a", "#b8860b", "#166534", "#16a34a"];

const inputCls =
  "w-full rounded-lg border border-purple-soft/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-mid";

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    startTransition(async () => {
      const { data, error: signUpErr } = await supabase.auth.signUp({ email, password });
      if (signUpErr) {
        setError(signUpErr.message);
        return;
      }

      // The database trigger creates a bare profile row; fill in the name/color the user picked.
      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          display_name: displayName.trim() || email.split("@")[0],
          avatar_color: avatarColor,
        });
      }

      router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-muted">Display Name</label>
        <input
          type="text"
          required
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="What should we call you?"
          autoComplete="nickname"
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 6 characters"
          autoComplete="new-password"
          className={inputCls}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted">Pick an avatar color</label>
        <div className="flex flex-wrap gap-2">
          {AVATAR_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setAvatarColor(color)}
              className={`h-8 w-8 rounded-full border-2 transition-transform ${
                avatarColor === color ? "scale-110 border-text" : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Choose avatar color ${color}`}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: avatarColor }}
          >
            {(displayName[0] ?? "?").toUpperCase()}
          </div>
          <span className="text-sm text-muted">Preview</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-purple px-4 py-3 font-semibold text-white transition hover:bg-purple-deep disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create Account"}
      </button>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link
          href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
          className="font-medium text-purple hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
