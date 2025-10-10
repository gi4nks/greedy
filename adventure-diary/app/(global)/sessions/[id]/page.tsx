import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession, getSessionLogs } from "@/lib/actions/sessions";
import { SessionHeader } from "@/components/session/SessionHeader";
import { SessionLogList } from "@/components/session/SessionLogList";
import { SessionLogForm } from "@/components/session/SessionLogForm";
import { Skeleton } from "@/components/ui/skeleton";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

async function SessionContent({ sessionId }: { sessionId: number }) {
  const session = await getSession(sessionId);
  const logs = await getSessionLogs(sessionId);

  if (!session) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      {session.campaignId ? (
        <DynamicBreadcrumb
          campaignId={session.campaignId}
          campaignTitle={session.campaignTitle || undefined}
          sectionItems={[
            { label: 'Sessions', href: `/campaigns/${session.campaignId}/sessions` },
            { label: session.title || `Session ${sessionId}` }
          ]}
        />
      ) : (
        <DynamicBreadcrumb
          items={[
            { label: 'Sessions', href: '/sessions' },
            { label: session.title || `Session ${sessionId}` }
          ]}
        />
      )}

      <SessionHeader session={session} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SessionLogList logs={logs} />
        </div>

        <div>
          <SessionLogForm sessionId={sessionId} />
        </div>
      </div>
    </div>
  );
}

export default async function SessionPage({ params }: SessionPageProps) {
  const resolvedParams = await params;
  const sessionId = parseInt(resolvedParams.id);

  if (isNaN(sessionId)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        <Suspense
          fallback={
            <div className="space-y-6">
              <div className="card bg-white shadow">
                <div className="card-body">
                  <Skeleton className="h-8 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-1/4 mb-4" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="card bg-white shadow">
                    <div className="card-body">
                      <Skeleton className="h-6 w-1/4 mb-4" />
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="mb-4 p-4 border rounded">
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card bg-white shadow">
                  <div className="card-body">
                    <Skeleton className="h-6 w-1/3 mb-4" />
                    <Skeleton className="h-32 w-full mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </div>
            </div>
          }
        >
          <SessionContent sessionId={sessionId} />
        </Suspense>

        <div className="mt-8 text-center">
          <Link href="/sessions" className="btn btn-ghost">
            ← Back to Sessions
          </Link>
        </div>
      </div>
    </div>
  );
}