import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SubmitForm from "@/components/submit/SubmitForm";
import AdBanner from "@/components/AdBanner";

export default async function SubmitPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login?redirect=/submit");
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-center font-heading text-4xl font-bold italic text-text">Submit a Spot</h1>
      <p className="mt-2 text-center text-muted">
        Know a great restaurant, bar, or hidden gem? Tell us about it.
      </p>
      <div className="mt-8">
        <SubmitForm currentUserId={userData.user.id} />
      </div>
      <AdBanner />
    </main>
  );
}
