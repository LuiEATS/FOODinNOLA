"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Comment = {
  id: string;
  body: string;
  photo_url: string | null;
  created_at: string;
  user_id: string;
  display_name: string | null;
  avatar_color: string | null;
};

type CurrentUser = {
  id: string;
  display_name: string | null;
  avatar_color: string | null;
  role: string;
};

function timeAgo(isoDate: string) {
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

export default function CommunityComments({
  locationId,
  initialComments,
  currentUser,
}: {
  locationId: string;
  initialComments: Comment[];
  currentUser: CurrentUser | null;
}) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!currentUser || !body.trim()) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    let photoUrl: string | null = null;

    if (photo) {
      const path = `${locationId}/${crypto.randomUUID()}-${photo.name}`;
      const { error: uploadErr } = await supabase.storage.from("comment-photos").upload(path, photo);
      if (uploadErr) {
        setError(uploadErr.message);
        setSubmitting(false);
        return;
      }
      photoUrl = supabase.storage.from("comment-photos").getPublicUrl(path).data.publicUrl;
    }

    const { data, error: insertErr } = await supabase
      .from("comments")
      .insert({ location_id: locationId, user_id: currentUser.id, body: body.trim(), photo_url: photoUrl })
      .select()
      .single();

    setSubmitting(false);
    if (insertErr || !data) {
      setError(insertErr?.message ?? "Something went wrong.");
      return;
    }

    setComments([
      {
        id: data.id,
        body: data.body,
        photo_url: data.photo_url,
        created_at: data.created_at,
        user_id: data.user_id,
        display_name: currentUser.display_name,
        avatar_color: currentUser.avatar_color,
      },
      ...comments,
    ]);
    setBody("");
    setPhoto(null);
  }

  async function handleDelete(commentId: string) {
    const supabase = createClient();
    const { error: deleteErr } = await supabase.from("comments").delete().eq("id", commentId);
    if (!deleteErr) {
      setComments(comments.filter((comment) => comment.id !== commentId));
    }
  }

  return (
    <section className="mt-10">
      <h2 className="font-heading text-2xl font-bold italic text-text">Community Reviews</h2>

      {currentUser ? (
        <div className="mt-4 rounded-xl border border-purple-soft/40 bg-white p-4">
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Share your experience…"
            rows={3}
            className="w-full resize-none rounded-lg border border-purple-soft/60 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-mid"
          />
          <div className="mt-2 flex items-center justify-between">
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
              className="text-xs"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!body.trim() || submitting}
              className="rounded-full bg-purple px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {submitting ? "Posting…" : "Post Review"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-purple-soft bg-purple-light/30 p-4 text-sm text-purple">
          <Link href={`/login?redirect=/locations/${locationId}`} className="font-medium underline">
            Log in
          </Link>{" "}
          to leave a review.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {comments.length === 0 && <p className="text-sm text-muted">No community reviews yet.</p>}
        {comments.map((comment) => {
          const canDelete =
            currentUser && (currentUser.id === comment.user_id || currentUser.role === "admin");
          return (
            <div key={comment.id} className="flex gap-3">
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: comment.avatar_color ?? "#7c3aed" }}
              >
                {(comment.display_name ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text">{comment.display_name ?? "Anonymous"}</span>
                  <span className="text-xs text-muted">{timeAgo(comment.created_at)}</span>
                </div>
                <p className="mt-1 text-sm text-text/80">{comment.body}</p>
                {comment.photo_url && (
                  <Image
                    src={comment.photo_url}
                    alt=""
                    width={200}
                    height={200}
                    className="mt-2 h-32 w-32 rounded-lg object-cover"
                  />
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    className="mt-1 text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
