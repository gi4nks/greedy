"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tag, Plus, X, Edit3 } from "lucide-react";
import { useTagManagement } from "@/lib/utils/tagUtils";

interface TagManagerProps {
  initialTags: string[];
  onTagsChange?: (tags: string[]) => void;
  readonly?: boolean;
  title?: string;
  className?: string;
}

export default function TagManager({
  initialTags = [],
  onTagsChange,
  readonly = false,
  title = "Tags",
  className = "",
}: TagManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const tagManagement = useTagManagement(initialTags);

  const handleSave = () => {
    onTagsChange?.(tagManagement.tags);
    setIsEditing(false);
  };

  const handleCancel = () => {
    tagManagement.setTags(initialTags);
    tagManagement.setNewTag("");
    setIsEditing(false);
  };

  if (readonly) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {initialTags.length === 0 ? (
            <p className="text-base-content/70 text-sm">No tags assigned</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {initialTags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            {title}
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            {/* Current Tags */}
            {tagManagement.tags.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Current Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tagManagement.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => tagManagement.removeTag(tag)}
                        className="hover:bg-base-content/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Tag */}
            <div>
              <Label htmlFor="new-tag" className="text-sm font-medium">
                Add New Tag
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="new-tag"
                  type="text"
                  placeholder="Enter tag name..."
                  value={tagManagement.newTag}
                  onChange={(e) => tagManagement.setNewTag(e.target.value)}
                  onKeyPress={tagManagement.handleKeyPress}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={tagManagement.addTag}
                  disabled={!tagManagement.newTag.trim()}
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleSave} size="sm" className="flex-1">
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                size="sm"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {tagManagement.tags.length === 0 ? (
              <div className="text-center py-8">
                <Tag className="w-12 h-12 mx-auto mb-4 text-base-content/50" />
                <h3 className="text-lg font-semibold mb-2">No Tags</h3>
                <p className="text-base-content/70 mb-4">
                  Add tags to help organize and find this item.
                </p>
                <Button
                  onClick={() => setIsEditing(true)}
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Tags
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tagManagement.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}