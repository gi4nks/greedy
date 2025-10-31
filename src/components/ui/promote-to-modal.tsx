"use client";

import { useState, useEffect, useRef } from "react";
import { createCharacter } from "@/lib/actions/characters";
import { createQuest } from "@/lib/actions/quests";
import { createLocation } from "@/lib/actions/locations";
import { createMagicItemAction } from "@/lib/actions/magicItems";
import { showToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Edit, EyeOff } from "lucide-react";

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
    entityType: "character" as "character" | "location" | "quest",
    entityId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [characters, setCharacters] = useState<Array<{id: number, name: string}>>([]);
  const [locations, setLocations] = useState<Array<{id: number, name: string}>>([]);
  const [quests, setQuests] = useState<Array<{id: number, title: string}>>([]);
  const hasInitializedRef = useRef(false);

  // Fetch entities when diary-note is selected
  useEffect(() => {
    if (isOpen && selectedType === "diary-note" && campaignId) {
      // Fetch characters
      fetch(`/api/campaigns/${campaignId}/characters`)
        .then(response => response.json())
        .then(data => {
          setCharacters(data || []);
        })
        .catch(error => {
          console.error("Error fetching characters:", error);
        });

      // Fetch locations
      fetch(`/api/campaigns/${campaignId}/locations`)
        .then(response => response.json())
        .then(data => {
          setLocations(data || []);
        })
        .catch(error => {
          console.error("Error fetching locations:", error);
        });

      // Fetch quests
      fetch(`/api/campaigns/${campaignId}/quests`)
        .then(response => response.json())
        .then(data => {
          setQuests(data || []);
        })
        .catch(error => {
          console.error("Error fetching quests:", error);
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
        entityType: "character",
        entityId: "",
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
          entityName = "Quest";
          break;

        case "location":
          submitData.append("campaignId", campaignId.toString());
          submitData.append("name", formData.title.trim());
          submitData.append("tags", "[]");
          submitData.append("images", "[]");

          result = await createLocation(submitData);
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
          entityName = "Magic Item";
          break;

        case "diary-note":
          if (!formData.entityId) {
            showToast.error(`Please select a ${formData.entityType}`);
            return;
          }
          
          const diaryData = {
            description: formData.description,
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            linkedEntities: [],
            isImportant: false,
          };

          let diaryEndpoint = "";
          switch (formData.entityType) {
            case "character":
              diaryEndpoint = `/api/characters/${formData.entityId}/diary`;
              break;
            case "location":
              diaryEndpoint = `/api/locations/${formData.entityId}/diary`;
              break;
            case "quest":
              diaryEndpoint = `/api/quests/${formData.entityId}/diary`;
              break;
          }

          const response = await fetch(diaryEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(diaryData),
          });

          const diaryResult = await response.json();
          result = diaryResult;
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

        <form className="space-y-4">
          {/* Entity Type and Selection for Diary Note */}
          {selectedType === "diary-note" && (
            <>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Add Diary Note to *</span>
                </label>
                <select
                  value={formData.entityType}
                  onChange={(e) => setFormData(prev => ({ ...prev, entityType: e.target.value as "character" | "location" | "quest", entityId: "" }))}
                  className="select select-bordered w-full"
                  required
                >
                  <option value="character">Character</option>
                  <option value="location">Location</option>
                  <option value="quest">Quest</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    {formData.entityType === "character" && "Character *"}
                    {formData.entityType === "location" && "Location *"}
                    {formData.entityType === "quest" && "Quest *"}
                  </span>
                </label>
                <select
                  value={formData.entityId}
                  onChange={(e) => setFormData(prev => ({ ...prev, entityId: e.target.value }))}
                  className="select select-bordered w-full"
                  required
                >
                  <option value="">
                    {formData.entityType === "character" && "Select a character"}
                    {formData.entityType === "location" && "Select a location"}
                    {formData.entityType === "quest" && "Select a quest"}
                  </option>
                  {formData.entityType === "character" && characters.map((character) => (
                    <option key={character.id} value={character.id}>
                      {character.name}
                    </option>
                  ))}
                  {formData.entityType === "location" && locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                  {formData.entityType === "quest" && quests.map((quest) => (
                    <option key={quest.id} value={quest.id}>
                      {quest.title}
                    </option>
                  ))}
                </select>
              </div>
            </>
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
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              size="sm"
            >
              <EyeOff className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={
                isSubmitting || 
                !formData.description.trim() || 
                (selectedType === "diary-note" && !formData.entityId)
              }
              onClick={handleSubmit}
            >
              <Edit className="w-4 h-4" />
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                "Confirm Promotion"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
