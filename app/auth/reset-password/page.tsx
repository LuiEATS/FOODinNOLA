"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase puts the recovery tokens in the URL hash — this fires once they're exchanged.
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateErr) {
      setError(updateErr.message);
      return;
    }
    router.push("/");
  }

  if (!ready) {
    return (
      <main className="flex flex-1 items-center justify-center bg-cream px-4">
        <p className="text-muted">Loading reset form…</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-purple-soft/40 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center font-heading text-2xl font-bold italic text-text">
          Set New Password
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted">New Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-purple-soft/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-mid"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Confirm Password</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="w-full rounded-lg border border-purple-soft/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-mid"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-purple px-4 py-2.5 font-semibold text-white transition hover:bg-purple-deep disabled:opacity-50"
          >
            {loading ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
    </main>
  );
}
