"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export type FlaggedComment = {
  id: string;
  body: string;
  photo_url: string | null;
  created_at: string | null;
  location_id: string | null;
  profiles: { display_name: string | null } | { display_name: string | null }[] | null;
  locations: { name: string } | { name: string }[] | null;
};

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default function FlaggedCommentsTab({ initialComments }: { initialComments: FlaggedComment[] }) {
  const [comments, setComments] = useState(initialComments);
  const [error, setError] = useState<string | null>(null);

  async function handleKeep(comment: FlaggedComment) {
    const supabase = createClient();
    const { data: updateData, error: updateErr } = await supabase
      .from("comments")
      .update({ is_flagged: false })
      .eq("id", comment.id)
      .select("id");
    if (updateErr || !updateData || updateData.length === 0) {
      setError(updateErr?.message ?? "Update didn't apply — check permissions.");
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== comment.id));
  }

  async function handleDelete(comment: FlaggedComment) {
    const supabase = createClient();
    const { data: deleteData, error: deleteErr } = await supabase
      .from("comments")
      .delete()
      .eq("id", comment.id)
      .select("id");
    if (deleteErr || !deleteData || deleteData.length === 0) {
      setError(deleteErr?.message ?? "Delete didn't apply — check permissions.");
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== comment.id));
  }

  if (comments.length === 0) {
    return <p className="text-sm text-muted">No flagged comments.</p>;
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {comments.map((comment) => {
        const author = one(comment.profiles)?.display_name ?? "Unknown";
        const location = one(comment.locations);
        return (
          <div key={comment.id} className="rounded-xl border border-red-200 bg-red-50/40 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-text">{author}</span>
              {comment.location_id && location && (
                <Link href={`/locations/${comment.location_id}`} className="text-purple hover:underline">
                  {location.name}
                </Link>
              )}
            </div>
            <p className="mt-2 text-sm text-text/80">{comment.body}</p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleKeep(comment)}
                className="rounded-full border border-purple-soft px-4 py-1.5 text-sm font-medium text-purple hover:bg-purple-light"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={() => handleDelete(comment)}
                className="rounded-full border border-red-300 px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
