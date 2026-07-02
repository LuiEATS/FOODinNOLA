"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Photo = {
  id: string;
  photo_url: string;
  is_primary: boolean | null;
};

export default function PhotoGallery({
  locationId,
  photos,
  currentUserId,
}: {
  locationId: string;
  photos: Photo[];
  currentUserId: string | null;
}) {
  const ordered = [...photos].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  async function handleUpload() {
    if (!file || !currentUserId) return;
    setUploading(true);
    setUploadError(null);

    const supabase = createClient();
    const path = `${locationId}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("location-photos").upload(path, file);
    if (uploadErr) {
      setUploadError(uploadErr.message);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("location-photos").getPublicUrl(path);

    const { error: insertErr } = await supabase.from("pending_submissions").insert({
      submission_type: "new_photo",
      location_id: locationId,
      submitted_by: currentUserId,
      proposed_data: { photo_url: publicUrlData.publicUrl },
    });

    setUploading(false);
    if (insertErr) {
      setUploadError(insertErr.message);
      return;
    }

    setUploadSuccess(true);
    setFile(null);
  }

  if (ordered.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-2xl bg-purple-light/40 text-center">
        <p className="text-muted">No photos yet — be the first to add one!</p>
        <AddPhotoButton
          currentUserId={currentUserId}
          locationId={locationId}
          onClick={() => setShowUpload(true)}
        />
        {showUpload && (
          <UploadModal
            file={file}
            setFile={setFile}
            uploading={uploading}
            error={uploadError}
            success={uploadSuccess}
            onUpload={handleUpload}
            onClose={() => {
              setShowUpload(false);
              setUploadSuccess(false);
              setUploadError(null);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightboxIndex(0)}
        className="block h-96 w-full overflow-hidden rounded-2xl bg-purple-light/40"
      >
        <Image
          src={ordered[0].photo_url}
          alt=""
          width={960}
          height={540}
          className="h-96 w-full object-cover"
        />
      </button>

      <div className="mt-3 flex items-center gap-3 overflow-x-auto">
        {ordered.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setLightboxIndex(index)}
            className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 border-transparent hover:border-purple-mid"
          >
            <Image src={photo.photo_url} alt="" width={80} height={80} className="h-20 w-20 object-cover" />
          </button>
        ))}
        <AddPhotoButton
          currentUserId={currentUserId}
          locationId={locationId}
          onClick={() => setShowUpload(true)}
        />
      </div>

      {showUpload && (
        <UploadModal
          file={file}
          setFile={setFile}
          uploading={uploading}
          error={uploadError}
          success={uploadSuccess}
          onUpload={handleUpload}
          onClose={() => {
            setShowUpload(false);
            setUploadSuccess(false);
            setUploadError(null);
          }}
        />
      )}

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setLightboxIndex((lightboxIndex - 1 + ordered.length) % ordered.length);
            }}
            className="absolute left-4 text-4xl text-white"
            aria-label="Previous photo"
          >
            ‹
          </button>
          <Image
            src={ordered[lightboxIndex].photo_url}
            alt=""
            width={1200}
            height={800}
            className="max-h-[85vh] max-w-[85vw] object-contain"
            onClick={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setLightboxIndex((lightboxIndex + 1) % ordered.length);
            }}
            className="absolute right-4 text-4xl text-white"
            aria-label="Next photo"
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-2xl text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function AddPhotoButton({
  currentUserId,
  locationId,
  onClick,
}: {
  currentUserId: string | null;
  locationId: string;
  onClick: () => void;
}) {
  if (!currentUserId) {
    return (
      <Link
        href={`/login?redirect=/locations/${locationId}`}
        className="flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-purple-soft text-center text-xs text-purple hover:bg-purple-light"
      >
        Log in to add a photo
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-purple-soft text-xs font-medium text-purple hover:bg-purple-light"
    >
      + Add Photo
    </button>
  );
}

function UploadModal({
  file,
  setFile,
  uploading,
  error,
  success,
  onUpload,
  onClose,
}: {
  file: File | null;
  setFile: (file: File | null) => void;
  uploading: boolean;
  error: string | null;
  success: boolean;
  onUpload: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="font-heading text-lg font-bold text-text">Add a Photo</h3>
        {success ? (
          <>
            <p className="mt-3 text-sm text-green">
              Thanks! Your photo is pending review before it goes live.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-full bg-purple px-4 py-2 text-sm font-medium text-white"
            >
              Close
            </button>
          </>
        ) : (
          <>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="mt-4 w-full text-sm"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-purple-soft px-4 py-2 text-sm font-medium text-purple"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onUpload}
                disabled={!file || uploading}
                className="rounded-full bg-purple px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Submit"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
