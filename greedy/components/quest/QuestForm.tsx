'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, X, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { createQuest, updateQuest } from '@/lib/actions/quests';
import { ImageManager } from '@/components/ui/image-manager';
import { ImageInfo, parseImagesJson } from '@/lib/utils/imageUtils.client';
import WikiEntitiesDisplay from '@/components/ui/wiki-entities-display';
import { WikiEntity } from '@/lib/types/wiki';

interface QuestFormProps {
  quest?: {
    id: number;
    title: string;
    description?: string | null;
    adventureId?: number | null;
    status?: string | null;
    priority?: string | null;
    type?: string | null;
    dueDate?: string | null;
    assignedTo?: string | null;
    tags?: unknown;
    images?: unknown;
    wikiEntities?: WikiEntity[];
  };
  campaignId: number;
  adventures?: Array<{
    id: number;
    title: string;
    status?: string | null;
  }>;
  adventureId?: number; // For adventure-scoped creation
  mode: 'create' | 'edit';
}

interface FormData {
  title: string;
  description: string;
  adventureId: string;
  status: string;
  priority: string;
  type: string;
  dueDate: string;
  assignedTo: string;
  tags: string[];
  images: ImageInfo[];
}

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'paused', label: 'Paused' },
];

const priorityOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const typeOptions = [
  { value: 'main', label: 'Main Quest' },
  { value: 'side', label: 'Side Quest' },
  { value: 'personal', label: 'Personal Quest' },
];

export default function QuestForm({ quest, campaignId, adventures, adventureId: fixedAdventureId, mode }: QuestFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [wikiEntities, setWikiEntities] = useState<WikiEntity[]>(quest?.wikiEntities || []);
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  // Parse tags from quest data
  const parseTags = (tags: unknown): string[] => {
    if (typeof tags === 'string') {
      try {
        const parsed = JSON.parse(tags);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(tags) ? tags : [];
  };

  // Initialize form data
  const [formData, setFormData] = useState<FormData>(() => {
    if (mode === 'edit' && quest) {
      return {
        title: quest.title,
        description: quest.description || '',
        adventureId: quest.adventureId?.toString() || fixedAdventureId?.toString() || '',
        status: quest.status || 'active',
        priority: quest.priority || 'medium',
        type: quest.type || 'main',
        dueDate: quest.dueDate || '',
        assignedTo: quest.assignedTo || '',
        tags: parseTags(quest.tags),
        images: parseImagesJson(quest.images),
      };
    }
    return {
      title: '',
      description: '',
      adventureId: fixedAdventureId?.toString() || '',
      status: 'active',
      priority: 'medium',
      type: 'main',
      dueDate: '',
      assignedTo: '',
      tags: [],
      images: [],
    };
  });

  const handleInputChange = (field: keyof Omit<FormData, 'tags' | 'images'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImagesChange = (images: ImageInfo[]) => {
    setFormData(prev => ({
      ...prev,
      images
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const removeWikiItem = async (wikiArticleId: number, _contentType: string) => {
    const itemKey = `wiki-${wikiArticleId}`;
    
    // Prevent duplicate removal operations
    if (removingItems.has(itemKey)) {
      return;
    }

    // Add to removing set to show loading state
    setRemovingItems(prev => new Set(prev).add(itemKey));

    try {
      const response = await fetch(`/api/wiki-articles/${wikiArticleId}/entities`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType: 'quest',
          entityId: quest?.id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        
        // Treat 404 as success (item already removed)
        if (response.status === 404) {
          console.log('Item already removed (404), treating as success');
        } else {
          throw new Error(`Failed to remove wiki item: ${errorText}`);
        }
      }

      const result = response.ok ? await response.json() : null;
      if (result) {
        console.log('API success result:', result);
      }

      // Update local state - remove the entity from wikiEntities
      setWikiEntities(prev => prev.filter(entity => entity.id !== wikiArticleId));
      console.log('Wiki item removed successfully');
    } catch (error) {
      console.error('Error removing wiki item:', error);
      // Could add toast notification here
    } finally {
      // Remove from removing set
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append('title', formData.title);
      formDataObj.append('description', formData.description);
      if (formData.adventureId) {
        formDataObj.append('adventureId', formData.adventureId);
      }
      formDataObj.append('status', formData.status);
      formDataObj.append('priority', formData.priority);
      formDataObj.append('type', formData.type);
      formDataObj.append('dueDate', formData.dueDate);
      formDataObj.append('assignedTo', formData.assignedTo);
      formDataObj.append('tags', formData.tags.join(','));
      formDataObj.append('images', JSON.stringify(formData.images));
      formDataObj.append('campaignId', campaignId.toString());

      let result;
      if (mode === 'edit' && quest) {
        formDataObj.append('id', quest.id.toString());
        result = await updateQuest(formDataObj);
      } else {
        result = await createQuest(formDataObj);
      }

      // Check if the action was successful, then redirect
      if (result?.success || !result?.message) {
        // Redirect based on context
        if (fixedAdventureId) {
          router.push(`/campaigns/${campaignId}/adventures/${fixedAdventureId}/quests`);
        } else {
          router.push(`/campaigns/${campaignId}/quests`);
        }
      } else {
        // Handle error case
        console.error('Action failed:', result.message);
      }
    } catch (error) {
      console.error('Error saving quest:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Link 
          href={fixedAdventureId ? `/campaigns/${campaignId}/adventures/${fixedAdventureId}/quests` : `/campaigns/${campaignId}/quests`}
          className="inline-flex items-center gap-2 text-base-content/70 hover:text-base-content mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Quests
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold">
            {mode === 'edit' ? 'Edit Quest' : 'Create New Quest'}
          </h1>
          <p className="text-base-content/70">
            {mode === 'edit' ? 'Update quest details' : 'Add a new quest to your campaign'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter quest title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the quest objectives, background, and any important details..."
                rows={4}
              />
            </div>

            {/* Only show adventure selector if not in adventure-scoped mode */}
            {!fixedAdventureId && (
              <div className="space-y-2">
                <Label htmlFor="adventureId">Adventure</Label>
                <Select
                  name="adventureId"
                  value={formData.adventureId}
                  onValueChange={(value) => handleInputChange('adventureId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an adventure (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific adventure</SelectItem>
                    {adventures?.map((adventure) => (
                      <SelectItem key={adventure.id} value={adventure.id.toString()}>
                        {adventure.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quest Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  name="status"
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  name="priority"
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  name="type"
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input
                  id="assignedTo"
                  value={formData.assignedTo}
                  onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                  placeholder="Character or player name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add Tag
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageManager
              entityType="quests"
              entityId={quest?.id || 0}
              currentImages={formData.images}
              onImagesChange={handleImagesChange}
            />
          </CardContent>
        </Card>

        {/* Wiki Items */}
        {mode === 'edit' && wikiEntities.length > 0 && quest && (
          <Card>
            <CardHeader>
              <CardTitle>Wiki Items</CardTitle>
            </CardHeader>
            <CardContent>
              <WikiEntitiesDisplay
                wikiEntities={wikiEntities}
                entityType="quest"
                entityId={quest.id}
                showImportMessage={true}
                isEditable={true}
                onRemoveEntity={removeWikiItem}
                removingItems={removingItems}
              />
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting 
              ? (mode === 'edit' ? 'Updating...' : 'Creating...') 
              : (mode === 'edit' ? 'Update' : 'Create')
            }
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => router.push(`/campaigns/${campaignId}/quests`)}
          >
            <EyeOff className="w-4 h-4" />
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}