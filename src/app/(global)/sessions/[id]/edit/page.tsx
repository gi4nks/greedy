import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { sessions, adventures } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import SessionForm from "@/components/session/SessionForm";
import { Skeleton } from "@/components/ui/skeleton";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, EyeOff } from "lucide-react";
import Link from "next/link";

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
  return await db.select().from(adventures).orderBy(adventures.startDate);
}

export default async function EditSessionPage({
  params,
}: EditSessionPageProps) {
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
          { label: "Sessions", href: "/sessions" },
          { label: session.title, href: `/sessions/${sessionId}` },
          { label: "Edit" },
        ]}
      />
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="p-6">
            <SessionForm session={session} adventures={allAdventures} mode="edit" showButtons={false} id="session-form" />
          </CardContent>
          <CardFooter className="flex gap-4 justify-end">
            <Button type="submit" form="session-form" size="sm" variant="primary">
              <Save className="w-4 h-4 mr-2" />
              Update
            </Button>
            <Link href={`/sessions/${sessionId}`}>
              <Button type="button" size="sm" variant="outline" className="gap-2">
                <EyeOff className="w-4 h-4" />
                Cancel
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
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

      <Card>
        <CardContent className="p-6">
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

            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-4 justify-end">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </CardFooter>
      </Card>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: EditSessionPageProps) {
  const resolvedParams = await params;
  const session = await getSession(parseInt(resolvedParams.id));

  return {
    title: session ? `Edit ${session.title}` : "Edit Session",
    description: session
      ? `Edit session details for ${session.title}`
      : "Edit session details",
  };
}
