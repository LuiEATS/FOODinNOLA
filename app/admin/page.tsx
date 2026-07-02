import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdBanner from "@/components/AdBanner";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login?redirect=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  const [
    { count: liveCount },
    { count: pendingCount },
    { count: commentCount },
    { count: flaggedCount },
    { data: submissions },
    { data: locations },
    { data: allComments },
    { data: flaggedComments },
  ] = await Promise.all([
    supabase
      .from("locations")
      .select("*", { count: "exact", head: true })
      .eq("site", "foodinnola")
      .eq("is_published", true),
    supabase
      .from("pending_submissions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("comments").select("*", { count: "exact", head: true }),
    supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("is_flagged", true),
    supabase
      .from("pending_submissions")
      .select("id, submission_type, location_id, submitted_by, proposed_data, status, created_at, profiles!submitted_by(display_name), locations(name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("locations")
      .select("id, name, address, is_published, updated_at, category, neighborhood, description, city, state, zip, phone, website, hours, payment_info, tags")
      .eq("site", "foodinnola")
      .order("name"),
    supabase.from("comments").select("id, location_id"),
    supabase
      .from("comments")
      .select("id, body, photo_url, created_at, location_id, profiles(display_name), locations(name)")
      .eq("is_flagged", true)
      .order("created_at", { ascending: false }),
  ]);

  const commentCounts = new Map<string, number>();
  for (const comment of allComments ?? []) {
    if (!comment.location_id) continue;
    commentCounts.set(comment.location_id, (commentCounts.get(comment.location_id) ?? 0) + 1);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="font-heading text-4xl font-bold italic text-text">Admin Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Live Spots" value={liveCount ?? 0} />
        <StatCard label="Pending" value={pendingCount ?? 0} />
        <StatCard label="Comments" value={commentCount ?? 0} />
        <StatCard label="Flagged" value={flaggedCount ?? 0} />
      </div>

      <AdminDashboard
        currentUserId={userData.user.id}
        submissions={submissions ?? []}
        locations={(locations ?? []).map((location) => ({
          ...location,
          commentCount: commentCounts.get(location.id) ?? 0,
        }))}
        flaggedComments={flaggedComments ?? []}
      />

      <AdBanner />
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-purple-soft/40 bg-white p-4 text-center">
      <div className="font-heading text-3xl font-bold text-purple-deep">{value}</div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </div>
  );
}
