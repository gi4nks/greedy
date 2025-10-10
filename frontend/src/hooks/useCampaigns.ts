import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types for Campaign
export interface Campaign {
  id: number;
  title: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  gameEditionId?: number;
  gameEditionName?: string;
  gameEditionVersion?: string;
  tags?: string[];
}

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await fetch('/api/campaigns');
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      return response.json() as Promise<Campaign[]>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCampaign(id: number) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch campaign');
      }
      return response.json() as Promise<Campaign>;
    },
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaign: Omit<Campaign, 'id'>) => {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaign),
      });
      if (!response.ok) {
        throw new Error('Failed to create campaign');
      }
      return response.json() as Promise<Campaign>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Campaign> }) => {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update campaign');
      }
      return response.json() as Promise<Campaign>;
    },
    onSuccess: (data: Campaign) => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      void queryClient.invalidateQueries({ queryKey: ['campaign', data.id] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete campaign');
      }
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}