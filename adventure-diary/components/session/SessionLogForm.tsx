"use client";

import { useState } from "react";
import { createSessionLog } from "@/lib/actions/sessions";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface SessionLogFormProps {
  sessionId: number;
}

export function SessionLogForm({ sessionId }: SessionLogFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Card>
      <CardContent>
        <CardTitle>Add Log Entry</CardTitle>

        <form
          action={async (formData: FormData) => {
            setIsSubmitting(true);
            try {
              formData.append('tags', tags.join(','));
              await createSessionLog(formData);
              // Reset form
              setTags([]);
              setCurrentTag('');
              const form = document.querySelector('form') as HTMLFormElement;
              if (form) form.reset();
            } catch (error) {
              console.error("Failed to create session log:", error);
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <input type="hidden" name="sessionId" value={sessionId} />

          <div className="space-y-2 mb-4">
            <Label htmlFor="entryType">Entry Type</Label>
            <Select name="entryType" defaultValue="narrative">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="narrative">📖 Narrative</SelectItem>
                <SelectItem value="combat">⚔️ Combat</SelectItem>
                <SelectItem value="roleplay">🎭 Roleplay</SelectItem>
                <SelectItem value="exploration">🗺️ Exploration</SelectItem>
                <SelectItem value="rest">💤 Rest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 mb-4">
            <Label htmlFor="timestamp">Timestamp (optional)</Label>
            <Input
              id="timestamp"
              name="timestamp"
              placeholder="e.g., 2:30 PM, Hour 3"
            />
          </div>

          <div className="space-y-2 mb-4">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="What happened? (Markdown supported, use @character[id], @location[id], @quest[id] for mentions)"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2 mb-4">
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add tag"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleAddTag}
                variant="outline"
                size="sm"
              >
                Add
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-xs hover:text-red-500 ml-1"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add Log Entry"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}