'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { createSession, updateSession } from '@/lib/actions/sessions';
import { ImageManager } from '@/components/ui/image-manager';
import { ImageInfo, parseImagesJson } from '@/lib/utils/imageUtils.client';
import WikiEntitiesDisplay from '@/components/ui/wiki-entities-display';
import { WikiEntity } from '@/lib/types/wiki';

interface SessionFormProps {
  session?: {
    id: number;
    title: string;
    date: string;
    text?: string | null;
    adventureId?: number | null;
    images?: unknown;
    wikiEntities?: WikiEntity[];
  };
  campaignId?: number;
  campaignTitle?: string;
  adventures: Array<{
    id: number;
    title: string;
    status?: string | null;
  }>;
  mode: 'create' | 'edit';
  defaultAdventureId?: number;
}

interface FormData {
  title: string;
  date: string;
  text: string;
  adventureId: string;
  images: ImageInfo[];
}

export default function SessionForm({ session, campaignId, campaignTitle, adventures, mode, defaultAdventureId }: SessionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Wiki entities state
  const [wikiEntities, setWikiEntities] = useState<WikiEntity[]>(session?.wikiEntities || []);
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  // Initialize form data
  const [formData, setFormData] = useState<FormData>(() => {
    if (mode === 'edit' && session) {
      return {
        title: session.title,
        date: session.date,
        text: session.text || '',
        adventureId: session.adventureId?.toString() || '',
        images: parseImagesJson(session.images),
      };
    }
    return {
      title: '',
      date: new Date().toISOString().split('T')[0], // Today's date
      text: '',
      adventureId: defaultAdventureId?.toString() || '',
      images: [],
    };
  });

  const handleInputChange = (field: keyof FormData, value: string | ImageInfo[]) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append('title', formData.title);
      formDataObj.append('date', formData.date);
      formDataObj.append('text', formData.text);
      formDataObj.append('images', JSON.stringify(formData.images));
      if (campaignId) {
        formDataObj.append('campaignId', campaignId.toString());
      }
      if (formData.adventureId && formData.adventureId !== 'none') {
        formDataObj.append('adventureId', formData.adventureId);
      }

      let result;
      if (mode === 'edit' && session) {
        formDataObj.append('id', session.id.toString());
        result = await updateSession(formDataObj);
      } else {
        result = await createSession(formDataObj);
      }

      // Check if the action was successful
      if (result?.success) {
        router.push(campaignId ? `/campaigns/${campaignId}/sessions` : '/sessions');
      } else {
        console.error('Action failed: Unknown error');
      }
    } catch (error) {
      console.error('Error saving session:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeWikiItem = async (wikiArticleId: number, contentType: string) => {
    const itemKey = `${contentType}-${wikiArticleId}`;
    
    // Prevent multiple simultaneous removals of the same item
    if (removingItems.has(itemKey)) {
      return;
    }

    setRemovingItems(prev => new Set(prev).add(itemKey));

    try {
      const response = await fetch(`/api/wiki-articles/${wikiArticleId}/entities`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType: 'session',
          entityId: session?.id,
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
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {mode === 'edit' ? 'Edit Session' : 'Create New Session'}
          </h1>
          <p className="text-base-content/70">
            {mode === 'edit' ? 'Update session details' : 'Record a new gaming session for your campaign'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Session Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter session title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
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
                    {adventures.map((adventure) => (
                      <SelectItem key={adventure.id} value={adventure.id.toString()}>
                        {adventure.title}
                        {adventure.status && adventure.status !== 'active' && (
                          <span className="ml-2 text-base-content/70">
                            ({adventure.status})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-base-content/70">
                  Link this session to a specific adventure
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="text">Session Summary</Label>
              <Textarea
                id="text"
                value={formData.text}
                onChange={(e) => handleInputChange('text', e.target.value)}
                placeholder="What happened in this session? Record key events, character interactions, plot developments, combat encounters, and any memorable moments..."
                rows={12}
              />
              <p className="text-sm text-base-content/70">
                Describe what happened during this session. This will help you track campaign progress and recall important details.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageManager
              entityType="sessions"
              entityId={session?.id || 0}
              currentImages={formData.images}
              onImagesChange={handleImagesChange}
            />
          </CardContent>
        </Card>

        {/* Wiki Items */}
        {mode === 'edit' && wikiEntities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Wiki Items</CardTitle>
            </CardHeader>
            <CardContent>
                            <WikiEntitiesDisplay
                wikiEntities={wikiEntities}
                entityType="session"
                entityId={session?.id || 0}
                showImportMessage={true}
                isEditable={true}
                onRemoveEntity={removeWikiItem}
                removingItems={removingItems}
              />
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 justify-end">
          <Button type="submit" size="sm" disabled={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting
              ? (mode === 'edit' ? 'Updating...' : 'Creating...')
              : (mode === 'edit' ? 'Update Session' : 'Create Session')
            }
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => router.push(campaignId ? `/campaigns/${campaignId}/sessions` : '/sessions')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}