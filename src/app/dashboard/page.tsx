import { Suspense } from "react";
import { CalendarPlus, Trophy } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchFilterBar } from "@/components/events/search-filter-bar";
import { EventCard } from "@/components/events/event-card";
import { getEvents } from "@/lib/actions/events";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; sport?: string }>;
}) {
  const params = await searchParams;
  const search = params.search;
  const sport = params.sport;

  const [result, supabase] = await Promise.all([
    getEvents(search, sport),
    createClient(),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Events</h1>
          <p className="mt-1 text-foreground/60">
            Manage your sports events and venues
          </p>
        </div>
        {result.data && result.data.length > 0 && (
          <span className="hidden text-sm text-foreground/60 sm:block">
            {result.data.length} event{result.data.length !== 1 && "s"}
          </span>
        )}
      </div>

      <Suspense fallback={<SearchFilterBarSkeleton />}>
        <SearchFilterBar />
      </Suspense>

      {result.error ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6 text-sm text-destructive">
          Failed to load events: {result.error}
        </div>
      ) : !result.data || result.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-20 text-card-foreground shadow-sm">
          {search || sport ? (
            <>
              <div className="mb-4 rounded-full bg-muted p-4">
                <Trophy className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">No matches</h3>
              <p className="max-w-sm text-center text-sm text-muted-foreground">
                No events match your filters. Try adjusting your search or
                clearing your filters.
              </p>
            </>
          ) : (
            <>
              <div className="mb-4 rounded-full bg-primary/10 p-4">
                <CalendarPlus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">No events yet</h3>
              <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
                Get started by creating your first sports event. Add venues,
                dates, and all the details you need.
              </p>
              <Button render={<Link href="/dashboard/events/new" />}>
                <CalendarPlus className="mr-2 h-4 w-4" />
                Create Your First Event
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.data.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isOwner={event.user_id === user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchFilterBarSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-full sm:w-[180px]" />
      </div>
    </div>
  );
}
