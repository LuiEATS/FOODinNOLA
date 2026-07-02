"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, NEIGHBORHOODS } from "@/lib/constants";

export type AdminLocation = {
  id: string;
  name: string;
  address: string;
  is_published: boolean | null;
  updated_at: string | null;
  category: string | null;
  neighborhood: string | null;
  description: string | null;
  city: string;
  state: string;
  zip: string | null;
  phone: string | null;
  website: string | null;
  hours: string | null;
  payment_info: string | null;
  tags: string[] | null;
  commentCount: number;
};

export default function ManageSpotsTab({ initialLocations }: { initialLocations: AdminLocation[] }) {
  const [locations, setLocations] = useState(initialLocations);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter(
      (location) => location.name.toLowerCase().includes(q) || location.address.toLowerCase().includes(q),
    );
  }, [locations, search]);

  async function toggleHide(location: AdminLocation) {
    const supabase = createClient();
    const { data: updateData, error: updateErr } = await supabase
      .from("locations")
      .update({ is_published: !location.is_published })
      .eq("id", location.id)
      .select("id");
    // Supabase returns no error when RLS silently filters out the row being
    // updated — an empty `data` array is the only signal that nothing changed.
    if (updateErr || !updateData || updateData.length === 0) {
      setError(updateErr?.message ?? "Update didn't apply — check permissions.");
      return;
    }
    setLocations((prev) =>
      prev.map((l) => (l.id === location.id ? { ...l, is_published: !l.is_published } : l)),
    );
  }

  async function handleDelete(location: AdminLocation) {
    if (!window.confirm(`Permanently delete "${location.name}"? This cannot be undone.`)) return;
    const supabase = createClient();
    const { data: deleteData, error: deleteErr } = await supabase
      .from("locations")
      .delete()
      .eq("id", location.id)
      .select("id");
    if (deleteErr || !deleteData || deleteData.length === 0) {
      setError(deleteErr?.message ?? "Delete didn't apply — check permissions.");
      return;
    }
    setLocations((prev) => prev.filter((l) => l.id !== location.id));
  }

  function handleSaved(updated: AdminLocation) {
    setLocations((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setEditingId(null);
  }

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by name or address…"
        className="w-full max-w-sm rounded-full border border-purple-soft/60 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-mid"
      />

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 space-y-3">
        {filtered.map((location) => (
          <div key={location.id} className="rounded-xl border border-purple-soft/40 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    location.is_published ? "bg-green-light text-green" : "bg-gold-light text-gold"
                  }`}
                >
                  {location.is_published ? "Live" : "Hidden"}
                </span>
                <span className="font-heading font-bold text-text">{location.name}</span>
              </div>
              <span className="text-xs text-muted">{location.commentCount} comments</span>
            </div>
            <p className="mt-1 text-sm text-muted">{location.address}</p>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setEditingId(editingId === location.id ? null : location.id)}
                className="rounded-full border border-purple-soft px-4 py-1.5 text-sm font-medium text-purple hover:bg-purple-light"
              >
                {editingId === location.id ? "Close" : "Edit"}
              </button>
              <button
                type="button"
                onClick={() => toggleHide(location)}
                className="rounded-full border border-gold px-4 py-1.5 text-sm font-medium text-gold hover:bg-gold-light"
              >
                {location.is_published ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(location)}
                className="rounded-full border border-red-300 px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>

            {editingId === location.id && <EditPanel location={location} onSaved={handleSaved} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function EditPanel({
  location,
  onSaved,
}: {
  location: AdminLocation;
  onSaved: (updated: AdminLocation) => void;
}) {
  const [form, setForm] = useState({
    name: location.name,
    description: location.description ?? "",
    address: location.address,
    category: location.category ?? "",
    neighborhood: location.neighborhood ?? "",
    city: location.city,
    state: location.state,
    zip: location.zip ?? "",
    phone: location.phone ?? "",
    website: location.website ?? "",
    hours: location.hours ?? "",
    payment_info: location.payment_info ?? "",
    tags: location.tags?.join(", ") ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const updates = {
      name: form.name.trim(),
      description: form.description || null,
      address: form.address.trim(),
      category: form.category || null,
      neighborhood: form.neighborhood || null,
      city: form.city,
      state: form.state,
      zip: form.zip || null,
      phone: form.phone || null,
      website: form.website || null,
      hours: form.hours || null,
      payment_info: form.payment_info || null,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      updated_at: new Date().toISOString(),
    };
    const { data: updateData, error: updateErr } = await supabase
      .from("locations")
      .update(updates)
      .eq("id", location.id)
      .select("id");
    setSaving(false);
    if (updateErr || !updateData || updateData.length === 0) {
      setError(updateErr?.message ?? "Update didn't apply — check permissions.");
      return;
    }
    onSaved({ ...location, ...updates });
  }

  const inputCls = "mt-1 w-full rounded-lg border border-purple-soft/60 p-2 text-sm";

  return (
    <div className="mt-4 grid grid-cols-1 gap-3 border-t border-purple-soft/30 pt-4 sm:grid-cols-2">
      <label className="block text-sm sm:col-span-2">
        <span className="text-xs font-medium text-muted">Name</span>
        <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
      </label>
      <label className="block text-sm sm:col-span-2">
        <span className="text-xs font-medium text-muted">Description</span>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          className={`${inputCls} resize-none`}
        />
      </label>
      <label className="block text-sm">
        <span className="text-xs font-medium text-muted">Category</span>
        <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
          <option value="">None</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-xs font-medium text-muted">Neighborhood</span>
        <select
          value={form.neighborhood}
          onChange={(e) => set("neighborhood", e.target.value)}
          className={inputCls}
        >
          <option value="">None</option>
          {NEIGHBORHOODS.map((n) => (
            <option key={n.slug} value={n.slug}>
              {n.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm sm:col-span-2">
        <span className="text-xs font-medium text-muted">Address</span>
        <input value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
      </label>
      <label className="block text-sm">
        <span className="text-xs font-medium text-muted">City</span>
        <input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
      </label>
      <label className="block text-sm">
        <span className="text-xs font-medium text-muted">State</span>
        <input value={form.state} onChange={(e) => set("state", e.target.value)} className={inputCls} />
      </label>
      <label className="block text-sm">
        <span className="text-xs font-medium text-muted">ZIP</span>
        <input value={form.zip} onChange={(e) => set("zip", e.target.value)} className={inputCls} />
      </label>
      <label className="block text-sm">
        <span className="text-xs font-medium text-muted">Phone</span>
        <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
      </label>
      <label className="block text-sm">
        <span className="text-xs font-medium text-muted">Website</span>
        <input value={form.website} onChange={(e) => set("website", e.target.value)} className={inputCls} />
      </label>
      <label className="block text-sm">
        <span className="text-xs font-medium text-muted">Hours</span>
        <input value={form.hours} onChange={(e) => set("hours", e.target.value)} className={inputCls} />
      </label>
      <label className="block text-sm">
        <span className="text-xs font-medium text-muted">Payment Info</span>
        <input
          value={form.payment_info}
          onChange={(e) => set("payment_info", e.target.value)}
          className={inputCls}
        />
      </label>
      <label className="block text-sm sm:col-span-2">
        <span className="text-xs font-medium text-muted">Tags (comma-separated)</span>
        <input value={form.tags} onChange={(e) => set("tags", e.target.value)} className={inputCls} />
      </label>

      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

      <div className="sm:col-span-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-purple px-5 py-2 text-sm font-medium text-white hover:bg-purple-deep disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
