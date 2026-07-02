"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Json, TablesUpdate } from "@/lib/supabase/database.types";

export type Submission = {
  id: string;
  submission_type: string;
  location_id: string | null;
  submitted_by: string | null;
  proposed_data: Json;
  status: string;
  created_at: string | null;
  profiles: { display_name: string | null } | { display_name: string | null }[] | null;
  locations: { name: string } | { name: string }[] | null;
};

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function timeAgo(isoDate: string | null) {
  if (!isoDate) return "";
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  const units: [string, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [label, secondsInUnit] of units) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) return `${value} ${label}${value > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

const TYPE_LABELS: Record<string, string> = {
  new_location: "New Spot",
  edit_location: "Edit",
  new_photo: "Photo",
};

const LOCATION_FIELDS = [
  "name",
  "description",
  "address",
  "category",
  "neighborhood",
  "city",
  "state",
  "zip",
  "phone",
  "website",
  "hours",
  "payment_info",
] as const;

export default function PendingQueueTab({
  initialSubmissions,
  currentUserId,
}: {
  initialSubmissions: Submission[];
  currentUserId: string;
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReject(submission: Submission) {
    setBusyId(submission.id);
    setError(null);
    const supabase = createClient();
    const { data: updateData, error: updateErr } = await supabase
      .from("pending_submissions")
      .update({ status: "rejected", reviewed_by: currentUserId, reviewed_at: new Date().toISOString() })
      .eq("id", submission.id)
      .select("id");
    setBusyId(null);
    if (updateErr || !updateData || updateData.length === 0) {
      setError(updateErr?.message ?? "Update didn't apply — check permissions.");
      return;
    }
    setSubmissions((prev) => prev.filter((s) => s.id !== submission.id));
  }

  async function handleApprove(submission: Submission) {
    setBusyId(submission.id);
    setError(null);
    const supabase = createClient();
    const d = submission.proposed_data as Record<string, unknown>;

    if (submission.submission_type === "new_location") {
      const { data: newLocation, error: insertErr } = await supabase
        .from("locations")
        .insert({
          name: String(d.name ?? ""),
          description: (d.description as string) || null,
          address: String(d.address ?? ""),
          category: (d.category as string) || null,
          neighborhood: (d.neighborhood as string) || null,
          city: (d.city as string) || "New Orleans",
          state: (d.state as string) || "LA",
          zip: (d.zip as string) || null,
          phone: (d.phone as string) || null,
          website: (d.website as string) || null,
          hours: (d.hours as string) || null,
          payment_info: (d.price_range as string) || null,
          tags: (d.tags as string[]) || [],
          is_published: true,
          created_by: submission.submitted_by,
          site: "foodinnola",
        })
        .select("id")
        .single();

      if (insertErr || !newLocation) {
        setBusyId(null);
        setError(insertErr?.message ?? "Failed to create location.");
        return;
      }

      const photoUrls = (d.photo_urls as string[]) ?? [];
      if (photoUrls.length > 0) {
        await supabase.from("location_photos").insert(
          photoUrls.map((url, index) => ({
            location_id: newLocation.id,
            photo_url: url,
            uploaded_by: submission.submitted_by,
            is_primary: index === 0,
          })),
        );
      }
    } else if (submission.submission_type === "edit_location" && submission.location_id) {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      for (const field of LOCATION_FIELDS) {
        if (d[field] !== undefined) updates[field] = d[field] || null;
      }
      if (d.tags !== undefined) updates.tags = d.tags;

      const { data: updateData, error: updateErr } = await supabase
        .from("locations")
        .update(updates as TablesUpdate<"locations">)
        .eq("id", submission.location_id)
        .select("id");

      if (updateErr || !updateData || updateData.length === 0) {
        setBusyId(null);
        setError(updateErr?.message ?? "Update didn't apply — check permissions.");
        return;
      }
    } else if (submission.submission_type === "new_photo" && submission.location_id) {
      const { error: insertErr } = await supabase.from("location_photos").insert({
        location_id: submission.location_id,
        photo_url: String(d.photo_url ?? ""),
        uploaded_by: submission.submitted_by,
        is_primary: false,
      });

      if (insertErr) {
        setBusyId(null);
        setError(insertErr.message);
        return;
      }
    }

    const { data: statusData, error: statusErr } = await supabase
      .from("pending_submissions")
      .update({ status: "approved", reviewed_by: currentUserId, reviewed_at: new Date().toISOString() })
      .eq("id", submission.id)
      .select("id");

    setBusyId(null);
    if (statusErr || !statusData || statusData.length === 0) {
      setError(statusErr?.message ?? "Update didn't apply — check permissions.");
      return;
    }
    setSubmissions((prev) => prev.filter((s) => s.id !== submission.id));
  }

  if (submissions.length === 0) {
    return <p className="text-sm text-muted">No pending submissions.</p>;
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {submissions.map((submission) => {
        const submitterName = one(submission.profiles)?.display_name ?? "Unknown";
        const locationName = one(submission.locations)?.name;
        const spotName =
          submission.submission_type === "new_location"
            ? String((submission.proposed_data as Record<string, unknown>).name ?? "Untitled")
            : (locationName ?? "Unknown spot");

        return (
          <div key={submission.id} className="rounded-xl border border-purple-soft/40 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-purple-light px-2.5 py-0.5 text-xs font-semibold text-purple">
                  {TYPE_LABELS[submission.submission_type] ?? submission.submission_type}
                </span>
                <span className="font-heading font-bold text-text">{spotName}</span>
              </div>
              <span className="text-xs text-muted">
                {submitterName} · {timeAgo(submission.created_at)}
              </span>
            </div>

            <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-purple-light/20 p-3 text-xs text-text/80">
              {JSON.stringify(submission.proposed_data, null, 2)}
            </pre>

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleReject(submission)}
                disabled={busyId === submission.id}
                className="rounded-full border border-red-300 px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => handleApprove(submission)}
                disabled={busyId === submission.id}
                className="rounded-full bg-green px-4 py-1.5 text-sm font-medium text-white hover:bg-green-bright disabled:opacity-50"
              >
                {busyId === submission.id ? "Working…" : "Approve"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
