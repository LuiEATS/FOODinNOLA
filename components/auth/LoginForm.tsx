"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const inputCls =
  "w-full rounded-lg border border-purple-soft/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-mid";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetPending, setResetPending] = useState(false);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        setError("Invalid email or password.");
        return;
      }
      router.push(redirectTo);
      router.refresh();
    });
  }

  async function handleForgot(event: React.FormEvent) {
    event.preventDefault();
    setResetPending(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setResetSent(true);
    setResetPending(false);
  }

  if (forgotMode) {
    return (
      <div className="space-y-4">
        {resetSent ? (
          <p className="text-center text-sm text-green">Check your email for a password reset link.</p>
        ) : (
          <form onSubmit={handleForgot} className="space-y-4">
            <p className="text-sm text-muted">Enter your email and we&apos;ll send a reset link.</p>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className={inputCls}
            />
            <button
              type="submit"
              disabled={resetPending}
              className="w-full rounded-full bg-purple px-4 py-3 font-semibold text-white transition hover:bg-purple-deep disabled:opacity-60"
            >
              {resetPending ? "Sending…" : "Send Reset Link"}
            </button>
          </form>
        )}
        <button
          type="button"
          onClick={() => {
            setForgotMode(false);
            setResetSent(false);
          }}
          className="w-full text-center text-sm text-purple hover:underline"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          autoComplete="current-password"
          className={inputCls}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-purple px-4 py-3 font-semibold text-white transition hover:bg-purple-deep disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign In"}
      </button>
      <div className="flex justify-between text-sm">
        <button type="button" onClick={() => setForgotMode(true)} className="text-purple hover:underline">
          Forgot password?
        </button>
        <Link
          href={`/signup?redirect=${encodeURIComponent(redirectTo)}`}
          className="font-medium text-purple hover:underline"
        >
          Sign up
        </Link>
      </div>
    </form>
  );
}
