import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EventForm } from "@/components/events/event-form";
import { getEvent } from "@/lib/actions/events";
import { Button } from "@/components/ui/button";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getEvent(id);

  if (result.error || !result.data) {
    notFound();
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        render={<Link href="/dashboard" />}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to events
      </Button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Edit Event</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update event details and venue information
        </p>
      </div>

      <EventForm event={result.data} />
    </div>
  );
}
