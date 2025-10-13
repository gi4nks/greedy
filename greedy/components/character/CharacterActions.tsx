"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Character, Adventure, Campaign } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, AlertTriangle, EyeOff } from "lucide-react";
import Link from "next/link";
import { deleteCharacter } from "@/lib/actions/characters";

interface CharacterActionsProps {
  character: Character & {
    adventure?: Adventure | null;
    campaign?: Campaign | null;
  };
  campaignId?: number;
}

export default function CharacterActions({
  character,
  campaignId,
}: CharacterActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCharacter(character.id);
      const effectiveCampaignId = campaignId || character.campaign?.id;
      router.push(`/campaigns/${effectiveCampaignId}/characters`);
    } catch (error) {
      console.error("Error deleting character:", error);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-semibold">Delete Character</h3>
          </div>
          <p className="text-base-content/70 mb-6">
            Are you sure you want to delete this character? This action cannot
            be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              <EyeOff className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              variant="neutral"
              className="gap-2"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const effectiveCampaignId = campaignId || character.campaign?.id;

  return (
    <div className="flex gap-2">
      <Link
        href={`/campaigns/${effectiveCampaignId}/characters/${character.id}/edit`}
      >
        <Button variant="secondary" className="gap-2">
          <Edit className="w-4 h-4" />
          Edit
        </Button>
      </Link>

      <Button
        variant="neutral"
        size="sm"
        className="gap-2"
        onClick={() => setShowDeleteConfirm(true)}
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </Button>
    </div>
  );
}
