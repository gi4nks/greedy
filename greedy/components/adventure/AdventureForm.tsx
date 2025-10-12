'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, EyeOff } from 'lucide-react';
import { createAdventure, updateAdventure } from '@/lib/actions/adventures';
import { ImageManager } from '@/components/ui/image-manager';
import { ImageInfo, parseImagesJson } from '@/lib/utils/imageUtils.client';

interface AdventureFormProps {
  adventure?: {
    id: number;
    title: string;
    description?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    status?: string | null;
    slug?: string | null;
    images?: unknown;
  };
  campaignId: number;
  mode: 'create' | 'edit';
}

interface FormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  slug: string;
  images: ImageInfo[];
}

const statusOptions = [
  { value: 'planned', label: 'Planned' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdventureForm({ adventure, campaignId, mode }: AdventureFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data
  const [formData, setFormData] = useState<FormData>(() => {
    if (mode === 'edit' && adventure) {
      return {
        title: adventure.title,
        description: adventure.description || '',
        startDate: adventure.startDate || '',
        endDate: adventure.endDate || '',
        status: adventure.status || 'planned',
        slug: adventure.slug || '',
        images: parseImagesJson(adventure.images),
      };
    }
    return {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'planned',
      slug: '',
      images: [],
    };
  });

  const handleInputChange = (field: keyof FormData, value: string | ImageInfo[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate slug from title
    if (field === 'title' && typeof value === 'string') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({
        ...prev,
        slug: slug
      }));
    }
  };

  const handleImagesChange = (images: ImageInfo[]) => {
    handleInputChange('images', images);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append('title', formData.title);
      formDataObj.append('description', formData.description);
      formDataObj.append('startDate', formData.startDate);
      formDataObj.append('endDate', formData.endDate);
      formDataObj.append('status', formData.status);
      formDataObj.append('slug', formData.slug);
      formDataObj.append('images', JSON.stringify(formData.images));
      formDataObj.append('campaignId', campaignId.toString());

      if (mode === 'edit' && adventure) {
        formDataObj.append('id', adventure.id.toString());
        await updateAdventure(formDataObj);
        // Success feedback handled by router redirect
      } else {
        await createAdventure(formDataObj);
        // Success feedback handled by router redirect
      }

      router.push(`/campaigns/${campaignId}/adventures`);
    } catch (error) {
      console.error('Error saving adventure:', error);
      // Error handled by console log for now
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {mode === 'edit' ? 'Edit Adventure' : 'Create New Adventure'}
          </h1>
          <p className="text-base-content/70">
            {mode === 'edit' ? 'Update adventure details' : 'Add a new adventure to your campaign'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter adventure title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="adventure-slug"
                />
                <p className="text-sm text-base-content/70">
                  URL-friendly identifier (auto-generated from title)
                </p>
              </div>

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
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the adventure, its goals, themes, and key elements..."
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageManager
              entityType="adventures"
              entityId={adventure?.id || 0}
              currentImages={formData.images}
              onImagesChange={handleImagesChange}
            />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting} variant="primary">
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
            onClick={() => router.push(`/campaigns/${campaignId}/adventures`)}
          >
            <EyeOff className="w-4 h-4" />
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}