import { Suspense } from "react";
import { CalendarPlus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchFilterBar } from "@/components/events/search-filter-bar";
import { EventCard } from "@/components/events/event-card";
import { getEvents } from "@/lib/actions/events";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; sport?: string }>;
}) {
  const params = await searchParams;
  const search = params.search;
  const sport = params.sport;

  const result = await getEvents(search, sport);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Events</h1>
        <p className="text-muted-foreground">
          Manage your sports events and venues
        </p>
      </div>

      <Suspense fallback={<SearchFilterBarSkeleton />}>
        <SearchFilterBar />
      </Suspense>

      {result.error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load events: {result.error}
        </div>
      ) : !result.data || result.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <CalendarPlus className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-1 text-lg font-semibold">No events yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {search || sport
              ? "No events match your filters. Try adjusting your search."
              : "Get started by creating your first event."}
          </p>
          {!search && !sport && (
            <Button render={<Link href="/dashboard/events/new" />}>
              Create Event
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.data.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchFilterBarSkeleton() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-full sm:w-[180px]" />
    </div>
  );
}
