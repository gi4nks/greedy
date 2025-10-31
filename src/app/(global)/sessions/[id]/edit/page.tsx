import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { sessions, adventures } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import SessionForm from "@/components/session/SessionForm";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

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
      <div className="container mx-auto px-4 py-6 md:p-6">
        <DynamicBreadcrumb
          items={[
            { label: "Sessions", href: "/sessions" },
            { label: session.title, href: `/sessions/${sessionId}` },
            { label: "Edit" },
          ]}
        />

        <div className="mb-6 mt-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">Edit Session</h1>
              <p className="text-base-content/70">Update session details</p>
            </div>
          </div>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <SessionForm session={session} adventures={allAdventures} mode="edit" />
          </CardContent>
        </Card>
      </div>
    </Suspense>
  );
}

function EditSessionSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 md:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="skeleton h-8 w-8 rounded-lg"></div>
          <div className="skeleton h-6 w-48"></div>
        </div>
        <div className="skeleton h-8 w-64 mb-2"></div>
        <div className="skeleton h-4 w-96"></div>
      </div>

      <Card>
        <CardHeader>
          <div className="skeleton h-6 w-32"></div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="skeleton h-10 w-full"></div>
              <div className="skeleton h-10 w-full"></div>
            </div>
            <div className="skeleton h-10 w-full mb-4"></div>
            <div className="skeleton h-6 w-32 mb-4"></div>
            <div className="skeleton h-32 w-full mb-4"></div>
            <div className="skeleton h-6 w-32 mb-4"></div>
            <div className="skeleton h-32 w-full mb-4"></div>
            <div className="flex gap-4">
              <div className="skeleton h-10 w-24"></div>
              <div className="skeleton h-10 w-32"></div>
            </div>
          </div>
        </CardContent>
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
