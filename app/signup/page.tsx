import { Suspense } from "react";
import type { Metadata } from "next";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a FOODinNOLA account to review, submit spots, and more.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-purple-soft/40 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <span className="text-4xl">🍽️</span>
          <h1 className="mt-2 font-heading text-2xl font-bold italic text-text">Join FOODinNOLA</h1>
          <p className="mt-1 text-sm text-muted">Review, submit spots, and more</p>
        </div>
        <Suspense>
          <SignupForm />
        </Suspense>
      </div>
    </main>
  );
}
