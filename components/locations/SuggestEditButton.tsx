"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, NEIGHBORHOODS } from "@/lib/constants";

type EditableFields = {
  name: string;
  description: string | null;
  address: string;
  category: string | null;
  neighborhood: string | null;
  phone: string | null;
  website: string | null;
  hours: string | null;
  payment_info: string | null;
};

export default function SuggestEditButton({
  locationId,
  currentValues,
  currentUserId,
}: {
  locationId: string;
  currentValues: EditableFields;
  currentUserId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(currentValues);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentUserId) {
    return (
      <Link
        href={`/login?redirect=/locations/${locationId}`}
        className="block w-full rounded-full border border-purple-soft px-4 py-2 text-center text-sm font-medium text-purple hover:bg-purple-light"
      >
        Log in to Suggest an Edit
      </Link>
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error: insertErr } = await supabase.from("pending_submissions").insert({
      submission_type: "edit_location",
      location_id: locationId,
      submitted_by: currentUserId,
      proposed_data: form,
    });
    setSubmitting(false);
    if (insertErr) {
      setError(insertErr.message);
      return;
    }
    setSuccess(true);
  }

  function field(key: keyof EditableFields, label: string, multiline = false) {
    const value = form[key] ?? "";
    return (
      <div>
        <label className="block text-xs font-medium text-muted">{label}</label>
        {multiline ? (
          <textarea
            value={value}
            onChange={(event) => setForm({ ...form, [key]: event.target.value })}
            rows={3}
            className="mt-1 w-full resize-none rounded-lg border border-purple-soft/60 p-2 text-sm"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(event) => setForm({ ...form, [key]: event.target.value })}
            className="mt-1 w-full rounded-lg border border-purple-soft/60 p-2 text-sm"
          />
        )}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full rounded-full border border-purple-soft px-4 py-2 text-center text-sm font-medium text-purple hover:bg-purple-light"
      >
        Suggest an Edit
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="font-heading text-lg font-bold text-text">Suggest an Edit</h3>
            {success ? (
              <>
                <p className="mt-3 text-sm text-green">
                  Thanks! Your suggested changes are pending review.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-4 rounded-full bg-purple px-4 py-2 text-sm font-medium text-white"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <div className="mt-4 space-y-3">
                  {field("name", "Name")}
                  {field("description", "Description", true)}
                  {field("address", "Address")}
                  <div>
                    <label className="block text-xs font-medium text-muted">Category</label>
                    <select
                      value={form.category ?? ""}
                      onChange={(event) => setForm({ ...form, category: event.target.value || null })}
                      className="mt-1 w-full rounded-lg border border-purple-soft/60 p-2 text-sm"
                    >
                      <option value="">Select a category…</option>
                      {CATEGORIES.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.emoji} {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted">Neighborhood</label>
                    <select
                      value={form.neighborhood ?? ""}
                      onChange={(event) => setForm({ ...form, neighborhood: event.target.value || null })}
                      className="mt-1 w-full rounded-lg border border-purple-soft/60 p-2 text-sm"
                    >
                      <option value="">Select a neighborhood…</option>
                      {NEIGHBORHOODS.map((n) => (
                        <option key={n.slug} value={n.slug}>
                          {n.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {field("phone", "Phone")}
                  {field("website", "Website")}
                  {field("hours", "Hours")}
                  {field("payment_info", "Payment Info")}
                </div>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-purple-soft px-4 py-2 text-sm font-medium text-purple"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="rounded-full bg-purple px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {submitting ? "Submitting…" : "Submit"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
