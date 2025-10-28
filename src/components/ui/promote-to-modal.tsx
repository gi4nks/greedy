"use client";

import { useState, useEffect, useRef } from "react";
import { createCharacter } from "@/lib/actions/characters";
import { createQuest } from "@/lib/actions/quests";
import { createLocation } from "@/lib/actions/locations";
import { createMagicItemAction } from "@/lib/actions/magicItems";
import { showToast } from "@/lib/toast";

export type PromotionType = "character" | "quest" | "location" | "magic-item" | "diary-note";

interface PromoteToModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: number;
  adventureId?: number;
  prefilledText: string;
  selectedType: PromotionType;
}

const entityTypeLabels = {
  "character": "Character",
  "quest": "Quest", 
  "location": "Location",
  "magic-item": "Magic Item",
  "diary-note": "Diary Note"
} as const;

export default function PromoteToModal({
  isOpen,
  onClose,
  campaignId,
  adventureId,
  prefilledText,
  selectedType,
}: PromoteToModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    characterId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [characters, setCharacters] = useState<Array<{id: number, name: string}>>([]);
  const hasInitializedRef = useRef(false);

  // Fetch characters when diary-note is selected
  useEffect(() => {
    if (isOpen && selectedType === "diary-note" && campaignId) {
      fetch(`/api/campaigns/${campaignId}/characters`)
        .then(response => response.json())
        .then(data => {
          // API returns array directly
          setCharacters(data || []);
        })
        .catch(error => {
          console.error("Error fetching characters:", error);
        });
    }
  }, [isOpen, selectedType, campaignId]);

  // Initialize form data when modal opens with new content
  useEffect(() => {
    if (isOpen && prefilledText && !hasInitializedRef.current) {
      setFormData({
        title: selectedType === "diary-note" ? "" : prefilledText,
        description: selectedType === "diary-note" ? prefilledText : "",
        characterId: "",
      });
      hasInitializedRef.current = true;
    } else if (!isOpen) {
      // Reset initialization flag when modal closes
      hasInitializedRef.current = false;
    }
  }, [isOpen, prefilledText, selectedType]);

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value,
    }));
  };

  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      description: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedType !== "diary-note" && !formData.title.trim()) {
      showToast.error("Title is required");
      return;
    }
    if (selectedType === "diary-note" && !formData.description.trim()) {
      showToast.error("Description is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append("title", formData.title.trim());
      submitData.append("description", formData.description.trim());

      if (adventureId) {
        submitData.append("adventureId", adventureId.toString());
      }

      let result;
      let redirectPath = "";
      let entityName = "";

      switch (selectedType) {
        case "character":
          submitData.append("campaignId", campaignId.toString());
          submitData.append("name", formData.title.trim());
          submitData.append("characterType", "npc");
          submitData.append("strength", "10");
          submitData.append("dexterity", "10");
          submitData.append("constitution", "10");
          submitData.append("intelligence", "10");
          submitData.append("wisdom", "10");
          submitData.append("charisma", "10");
          submitData.append("hitPoints", "0");
          submitData.append("maxHitPoints", "0");
          submitData.append("armorClass", "10");
          submitData.append("classes", "[]");
          submitData.append("images", "[]");
          submitData.append("tags", "[]");

          result = await createCharacter({ success: false }, submitData);
          redirectPath = `/campaigns/${campaignId}/characters`;
          entityName = "Character";
          break;

        case "quest":
          submitData.append("campaignId", campaignId.toString());
          submitData.append("status", "active");
          submitData.append("priority", "medium");
          submitData.append("type", "main");
          submitData.append("tags", "[]");
          submitData.append("images", "[]");

          result = await createQuest(submitData);
          redirectPath = `/campaigns/${campaignId}/quests`;
          entityName = "Quest";
          break;

        case "location":
          submitData.append("campaignId", campaignId.toString());
          submitData.append("name", formData.title.trim());
          submitData.append("tags", "[]");
          submitData.append("images", "[]");

          result = await createLocation(submitData);
          redirectPath = `/campaigns/${campaignId}/locations`;
          entityName = "Location";
          break;

        case "magic-item":
          submitData.append("name", formData.title.trim());
          submitData.append("type", "");
          submitData.append("rarity", "");
          submitData.append("properties", "");
          submitData.append("tags", "[]");
          submitData.append("images", "[]");
          submitData.append("attunementRequired", "false");

          result = await createMagicItemAction(submitData);
          redirectPath = `/magic-items`;
          entityName = "Magic Item";
          break;

        case "diary-note":
          if (!formData.characterId) {
            showToast.error("Please select a character");
            return;
          }
          
          const diaryData = {
            description: formData.description,
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            linkedEntities: [],
            isImportant: false,
          };

          const response = await fetch(`/api/characters/${formData.characterId}/diary`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(diaryData),
          });

          const diaryResult = await response.json();
          result = diaryResult;
          redirectPath = `/campaigns/${campaignId}/characters/${formData.characterId}`;
          entityName = "Diary Note";
          break;
      }

      if (result.success) {
        showToast.success(`${entityName} created successfully!`, `You can view it in the ${entityName.toLowerCase()} list.`);
        onClose();
      } else {
        showToast.error(`Failed to create ${entityName.toLowerCase()}`, result.error || "Please try again.");
      }
    } catch (error) {
      console.error("Promotion error:", error);
      showToast.error("An unexpected error occurred", "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">
          Promote Text to {entityTypeLabels[selectedType]}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Character Selection for Diary Note */}
          {selectedType === "diary-note" && (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Character *</span>
              </label>
              <select
                value={formData.characterId}
                onChange={(e) => setFormData(prev => ({ ...prev, characterId: e.target.value }))}
                className="select select-bordered w-full"
                required
              >
                <option value="">Select a character</option>
                {characters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title Field - only for non-diary-note */}
          {selectedType !== "diary-note" && (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Title *</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="input input-bordered w-full"
                placeholder="Enter title for the new entity"
                required
              />
            </div>
          )}

          {/* Description Field */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">
                {selectedType === "diary-note" ? "Note Content *" : "Description"}
              </span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              className="textarea textarea-bordered w-full"
              rows={3}
              placeholder={
                selectedType === "diary-note" 
                  ? "Enter the diary note content" 
                  : "Optional description or additional details"
              }
              required={selectedType === "diary-note"}
            />
          </div>

          {/* Action Buttons */}
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                isSubmitting || 
                !formData.description.trim() || 
                (selectedType === "diary-note" && !formData.characterId)
              }
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                "Confirm Promotion"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
