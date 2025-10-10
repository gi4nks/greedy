import { Suspense } from "react";
import Link from "next/link";
import { getSessions } from "@/lib/actions/sessions";
import { SessionCard } from "../../../components/session/SessionCard";
import { CreateSessionForm } from "../../../components/session/CreateSessionForm";
import { Skeleton } from "../../../components/ui/skeleton";
import DynamicBreadcrumb from "@/components/ui/dynamic-breadcrumb";

// Force dynamic rendering to avoid database queries during build
export const dynamic = 'force-dynamic';

async function SessionsList() {
  const sessions = await getSessions();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} />
      ))}
    </div>
  );
}

export default function SessionsPage() {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <DynamicBreadcrumb
          items={[
            { label: 'Sessions' }
          ]}
        />

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-base-content">Sessions</h1>
            <p className="text-base-content/70 mt-2">
              Record and manage your D&D session notes
            </p>
          </div>

          <CreateSessionForm />
        </div>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card bg-white shadow">
                  <div className="card-body">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          }
        >
          <SessionsList />
        </Suspense>

        <div className="mt-8 text-center">
          <Link href="/" className="btn btn-ghost">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}