import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { sessions, adventures } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import SessionForm from '@/components/session/SessionForm';
import { Skeleton } from '@/components/ui/skeleton';
import DynamicBreadcrumb from '@/components/ui/dynamic-breadcrumb';

interface EditSessionPageProps {
  params: Promise<{ id: string }>;
}

async function getSession(sessionId: number) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session) return null;

  return session;
}

async function getAdventures() {
  return await db
    .select()
    .from(adventures)
    .orderBy(adventures.startDate);
}

export default async function EditSessionPage({ params }: EditSessionPageProps) {
  const resolvedParams = await params;
  const sessionId = parseInt(resolvedParams.id);

  const session = await getSession(sessionId);

  if (!session) {
    notFound();
  }

  const allAdventures = await getAdventures();

  return (
    <Suspense fallback={<EditSessionSkeleton />}>
      <DynamicBreadcrumb
        items={[
          { label: 'Sessions', href: '/sessions' },
          { label: session.title, href: `/sessions/${sessionId}` },
          { label: 'Edit' }
        ]}
      />
      <SessionForm
        session={session}
        adventures={allAdventures}
        mode="edit"
      />
    </Suspense>
  );
}

function EditSessionSkeleton() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-6 w-48" />
      </div>

      <div className="space-y-6">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>

        <div className="flex gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: EditSessionPageProps) {
  const resolvedParams = await params;
  const session = await getSession(parseInt(resolvedParams.id));

  return {
    title: session ? `Edit ${session.title}` : 'Edit Session',
    description: session ? `Edit session details for ${session.title}` : 'Edit session details',
  };
}