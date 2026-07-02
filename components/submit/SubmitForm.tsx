"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, NEIGHBORHOODS } from "@/lib/constants";

const EMPTY_FORM = {
  name: "",
  category: "",
  neighborhood: "",
  address: "",
  city: "New Orleans",
  state: "LA",
  zip: "",
  phone: "",
  website: "",
  hours: "",
  priceRange: "",
  description: "",
  tags: "",
};

export default function SubmitForm({ currentUserId }: { currentUserId: string }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function set(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handlePhotosSelected(fileList: FileList | null) {
    if (!fileList) return;
    setPhotos((prev) => [...prev, ...Array.from(fileList)]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.address.trim()) {
      setError("Name and address are required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const photoUrls: string[] = [];

    for (const file of photos) {
      const path = `pending/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("location-photos").upload(path, file);
      if (uploadErr) {
        setError(`Failed to upload ${file.name}: ${uploadErr.message}`);
        setSubmitting(false);
        return;
      }
      photoUrls.push(supabase.storage.from("location-photos").getPublicUrl(path).data.publicUrl);
    }

    const { error: insertErr } = await supabase.from("pending_submissions").insert({
      submission_type: "new_location",
      submitted_by: currentUserId,
      proposed_data: {
        name: form.name.trim(),
        category: form.category || null,
        neighborhood: form.neighborhood || null,
        address: form.address.trim(),
        city: form.city,
        state: form.state,
        zip: form.zip || null,
        phone: form.phone || null,
        website: form.website || null,
        hours: form.hours || null,
        price_range: form.priceRange || null,
        description: form.description || null,
        tags: form.tags
          ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        photo_urls: photoUrls,
      },
    });

    setSubmitting(false);
    if (insertErr) {
      setError(insertErr.message);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-green-light bg-green-light/40 p-8 text-center">
        <div className="text-4xl">🎉</div>
        <h2 className="mt-3 font-heading text-2xl font-bold text-green">Thanks for the submission!</h2>
        <p className="mt-2 text-text/80">We&apos;ll notify you when it&apos;s approved!</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-6 rounded-full bg-purple px-6 py-2 text-sm font-semibold text-white hover:bg-purple-deep"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-xl border border-gold-bright/40 bg-gold-light p-4 text-sm text-gold">
        FOODinNOLA reviews all submissions before they go live.
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name" required>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
            className={inputCls}
          />
        </Field>

        <Field label="Category">
          <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
            <option value="">Select a category…</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Neighborhood">
          <select
            value={form.neighborhood}
            onChange={(e) => set("neighborhood", e.target.value)}
            className={inputCls}
          >
            <option value="">Select a neighborhood…</option>
            {NEIGHBORHOODS.map((n) => (
              <option key={n.slug} value={n.slug}>
                {n.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Price Range">
          <select value={form.priceRange} onChange={(e) => set("priceRange", e.target.value)} className={inputCls}>
            <option value="">Select…</option>
            <option value="$">$ — Cheap eats</option>
            <option value="$$">$$ — Moderate</option>
            <option value="$$$">$$$ — Upscale</option>
            <option value="$$$$">$$$$ — Fine dining</option>
          </select>
        </Field>

        <Field label="Street Address" required className="sm:col-span-2">
          <input
            type="text"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            required
            className={inputCls}
          />
        </Field>

        <Field label="City">
          <input type="text" value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
        </Field>

        <Field label="State">
          <input type="text" value={form.state} onChange={(e) => set("state", e.target.value)} className={inputCls} />
        </Field>

        <Field label="ZIP">
          <input type="text" value={form.zip} onChange={(e) => set("zip", e.target.value)} className={inputCls} />
        </Field>

        <Field label="Phone">
          <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
        </Field>

        <Field label="Website">
          <input
            type="url"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            placeholder="https://…"
            className={inputCls}
          />
        </Field>

        <Field label="Hours" className="sm:col-span-2">
          <input
            type="text"
            value={form.hours}
            onChange={(e) => set("hours", e.target.value)}
            placeholder="M-Su 11-9"
            className={inputCls}
          />
        </Field>

        <Field label="Description" className="sm:col-span-2">
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            className={`${inputCls} resize-none`}
          />
        </Field>

        <Field label="Tags (comma-separated)" className="sm:col-span-2">
          <input
            type="text"
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="date-night, live-music, outdoor-seating"
            className={inputCls}
          />
        </Field>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted">Photos</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handlePhotosSelected(e.target.files)}
          className="mt-1 w-full text-sm"
        />
        {photos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3">
            {photos.map((file, index) => (
              <div key={index} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(file)}
                  alt=""
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                  aria-label="Remove photo"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-purple px-6 py-3 font-semibold text-white transition hover:bg-purple-deep disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit Spot"}
      </button>
    </form>
  );
}

const inputCls =
  "mt-1 w-full rounded-lg border border-purple-soft/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-mid";

function Field({
  label,
  required,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-muted">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
    </label>
  );
}
