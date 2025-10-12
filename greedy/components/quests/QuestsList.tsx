"use client";

import Link from 'next/link';
import { useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MarkdownRenderer from '@/components/ui/markdown-renderer';
import { CheckCircle, Clock, AlertTriangle, Flag, Star, Edit, Trash2, View } from 'lucide-react';
import { deleteQuestAction } from '@/lib/actions/quests';
import type { Adventure } from '@/lib/db/schema';

type Quest = {
  id: number;
  adventureId: number | null;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  type: string | null;
  dueDate: string | null;
  assignedTo: string | null;
  tags: unknown;
  images: unknown;
  createdAt: string | null;
  updatedAt: string | null;
};

interface QuestsListProps {
  questsData: { quest: Quest; adventure: Adventure | null }[];
  campaignId: number;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'active':
      return <Clock className="w-4 h-4 text-blue-500" />;
    case 'failed':
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    default:
      return <Clock className="w-4 h-4 text-base-content/50" />;
  }
}

function getPriorityIcon(priority: string) {
  switch (priority) {
    case 'high':
      return <Flag className="w-4 h-4 text-red-500" />;
    case 'medium':
      return <Flag className="w-4 h-4 text-yellow-500" />;
    case 'low':
      return <Flag className="w-4 h-4 text-green-500" />;
    default:
      return <Flag className="w-4 h-4 text-base-content/50" />;
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'main':
      return <Star className="w-4 h-4 text-yellow-500" />;
    case 'side':
      return <Clock className="w-4 h-4 text-blue-500" />;
    default:
      return <Clock className="w-4 h-4 text-base-content/50" />;
  }
}

export function QuestsList({ questsData, campaignId }: QuestsListProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (questId: number) => {
    if (confirm('Are you sure you want to delete this quest?')) {
      startTransition(async () => {
        try {
          const formData = new FormData();
          formData.append('id', questId.toString());
          formData.append('campaignId', campaignId.toString());
          await deleteQuestAction(formData);
        } catch (error) {
          console.error('Failed to delete quest:', error);
          alert('Failed to delete quest');
        }
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {questsData.map(({ quest, adventure }) => (
        <Card key={quest.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(quest.status || 'active')}
                <Badge variant={quest.status === 'completed' ? 'default' : 'secondary'}>
                  {quest.status || 'active'}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                {getPriorityIcon(quest.priority || 'medium')}
                {getTypeIcon(quest.type || 'main')}
              </div>
            </div>
            <CardTitle className="text-lg line-clamp-2">{quest.title}</CardTitle>
          </CardHeader>

          <CardContent>
            {quest.description && (
              <div className="mb-3 max-h-32 overflow-hidden">
                <MarkdownRenderer
                  content={quest.description}
                  className="prose-sm text-base-content/70"
                />
              </div>
            )}

            {adventure && (
              <div className="mb-3">
                <Badge variant="outline" className="text-xs">
                  {adventure.title}
                </Badge>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-base-content/70 mb-3">
              <span className="capitalize">{quest.type || 'main'} quest</span>
              <span className="capitalize">{quest.priority || 'medium'} priority</span>
            </div>

            {quest.dueDate && (
              <div className="flex items-center gap-1 text-xs text-base-content/70 mb-3">
                <Clock className="w-3 h-3" />
                Due: {new Date(quest.dueDate).toLocaleDateString()}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <Link href={`/campaigns/${campaignId}/quests/${quest.id}`}>
                <Button variant="warning" className="gap-2" size="sm">
                  <View className="w-4 h-4" />
                  View
                </Button>
              </Link>
              <Link href={`/campaigns/${campaignId}/quests/${quest.id}/edit`}>
                <Button variant="secondary" className="gap-2">
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="neutral"
                className="gap-2"
                size="sm"
                onClick={() => handleDelete(quest.id)}
                disabled={isPending}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}