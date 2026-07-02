import { Suspense } from "react";
import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to FOODinNOLA to review, submit spots, and more.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-purple-soft/40 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <span className="text-4xl">🍽️</span>
          <h1 className="mt-2 font-heading text-2xl font-bold italic text-text">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">Sign in to review, submit, and more</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
