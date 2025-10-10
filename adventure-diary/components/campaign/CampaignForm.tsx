'use client';

import { useState, useActionState } from 'react';
import { updateCampaign } from '@/lib/actions/campaigns';
import { Campaign } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

interface CampaignFormProps {
  campaign: Campaign;
  mode: 'edit';
}

export default function CampaignForm({ campaign, mode }: CampaignFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateCampaignWithId = async (prevState: any, formData: FormData) => {
    const result = await updateCampaign(campaign.id, formData);
    if (!result.errors && !result.message) {
      // Success - redirect will happen via revalidatePath
      window.location.href = `/campaigns/${campaign.id}`;
    }
    return result;
  };

  const [state, formAction] = useActionState(updateCampaignWithId, undefined);

  const handleSubmit = (formData: FormData) => {
    setIsSubmitting(true);
    formAction(formData);
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Campaign</h1>
        <p className="text-base-content/70 mt-2">
          Update your campaign details and settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={campaign.title}
                placeholder="Campaign title"
                required
              />
              {state?.errors?.title && (
                <p className="text-sm text-red-600">{state.errors.title[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={campaign.description || ''}
                placeholder="Campaign description"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select defaultValue={campaign.status || 'active'} name="status">
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="hiatus">Hiatus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : ''}
                />
              </div>
            </div>

            {state?.message && (
              <div className="p-4 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{state.message}</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update'}
              </Button>
              <Link href={`/campaigns/${campaign.id}`}>
                <Button type="button" variant="accent">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}