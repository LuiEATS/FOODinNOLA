"use client";

import { useState } from "react";
import PendingQueueTab, { type Submission } from "./PendingQueueTab";
import ManageSpotsTab, { type AdminLocation } from "./ManageSpotsTab";
import AddSpotTab from "./AddSpotTab";
import FlaggedCommentsTab, { type FlaggedComment } from "./FlaggedCommentsTab";

const TABS = [
  { key: "pending", label: "Pending Queue" },
  { key: "manage", label: "Manage Spots" },
  { key: "add", label: "Add Spot Directly" },
  { key: "flagged", label: "Flagged Comments" },
] as const;

export default function AdminDashboard({
  currentUserId,
  submissions,
  locations,
  flaggedComments,
}: {
  currentUserId: string;
  submissions: Submission[];
  locations: AdminLocation[];
  flaggedComments: FlaggedComment[];
}) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("pending");

  return (
    <div className="mt-10">
      <div className="flex flex-wrap gap-2 border-b border-purple-soft/40">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? "border-b-2 border-purple bg-purple-light/40 text-purple-deep"
                : "text-muted hover:text-purple"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="py-6">
        {activeTab === "pending" && (
          <PendingQueueTab initialSubmissions={submissions} currentUserId={currentUserId} />
        )}
        {activeTab === "manage" && <ManageSpotsTab initialLocations={locations} />}
        {activeTab === "add" && <AddSpotTab currentUserId={currentUserId} />}
        {activeTab === "flagged" && <FlaggedCommentsTab initialComments={flaggedComments} />}
      </div>
    </div>
  );
}
