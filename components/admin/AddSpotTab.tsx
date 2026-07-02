"use client";

import { useState } from "react";
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
  description: "",
  tags: "",
  payment_info: "",
};

const inputCls = "mt-1 w-full rounded-lg border border-purple-soft/60 p-2 text-sm";

export default function AddSpotTab({ currentUserId }: { currentUserId: string }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [photos, setPhotos] = useState<File[]>([]);
  const [publish, setPublish] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function set(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.address.trim()) {
      setError("Name and address are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();

    const { data: newLocation, error: insertErr } = await supabase
      .from("locations")
      .insert({
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
        description: form.description || null,
        payment_info: form.payment_info || null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        is_published: publish,
        created_by: currentUserId,
        site: "foodinnola",
      })
      .select("id")
      .single();

    if (insertErr || !newLocation) {
      setSubmitting(false);
      setError(insertErr?.message ?? "Failed to create location.");
      return;
    }

    for (const [index, file] of photos.entries()) {
      const path = `${newLocation.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("location-photos").upload(path, file);
      if (uploadErr) continue;
      const publicUrl = supabase.storage.from("location-photos").getPublicUrl(path).data.publicUrl;
      await supabase.from("location_photos").insert({
        location_id: newLocation.id,
        photo_url: publicUrl,
        uploaded_by: currentUserId,
        is_primary: index === 0,
      });
    }

    setSubmitting(false);
    setSuccess(publish ? `"${form.name}" is now live!` : `"${form.name}" saved as a draft.`);
    setForm(EMPTY_FORM);
    setPhotos([]);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      {success && <p className="rounded-lg bg-green-light p-3 text-sm text-green">{success}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-muted">Name *</span>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} required className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-muted">Category</span>
          <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
            <option value="">Select…</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-muted">Neighborhood</span>
          <select
            value={form.neighborhood}
            onChange={(e) => set("neighborhood", e.target.value)}
            className={inputCls}
          >
            <option value="">Select…</option>
            {NEIGHBORHOODS.map((n) => (
              <option key={n.slug} value={n.slug}>
                {n.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-muted">Street Address *</span>
          <input
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            required
            className={inputCls}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-muted">City</span>
          <input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-muted">State</span>
          <input value={form.state} onChange={(e) => set("state", e.target.value)} className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-muted">ZIP</span>
          <input value={form.zip} onChange={(e) => set("zip", e.target.value)} className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-muted">Phone</span>
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-muted">Website</span>
          <input value={form.website} onChange={(e) => set("website", e.target.value)} className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-muted">Hours</span>
          <input value={form.hours} onChange={(e) => set("hours", e.target.value)} className={inputCls} />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-muted">Description</span>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-muted">Payment Info</span>
          <input
            value={form.payment_info}
            onChange={(e) => set("payment_info", e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-muted">Tags (comma-separated)</span>
          <input value={form.tags} onChange={(e) => set("tags", e.target.value)} className={inputCls} />
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted">Photos</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
          className="mt-1 text-sm"
        />
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-purple-soft/40 p-3">
        <button
          type="button"
          onClick={() => setPublish(true)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            publish ? "bg-green text-white" : "border border-purple-soft text-purple"
          }`}
        >
          Publish
        </button>
        <button
          type="button"
          onClick={() => setPublish(false)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            !publish ? "bg-gold text-white" : "border border-purple-soft text-purple"
          }`}
        >
          Save as Draft
        </button>
        <span className="text-xs text-muted">
          {publish ? "Goes live immediately." : "Hidden until you publish it later."}
        </span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-purple px-6 py-3 font-semibold text-white hover:bg-purple-deep disabled:opacity-50"
      >
        {submitting ? "Saving…" : publish ? "Publish Spot" : "Save Draft"}
      </button>
    </form>
  );
}
