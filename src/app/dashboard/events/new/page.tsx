import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { EventForm } from "@/components/events/event-form";
import { Button } from "@/components/ui/button";

export default function NewEventPage() {
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
        <h1 className="text-2xl font-bold tracking-tight">Create Event</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a new sports event with venue information
        </p>
      </div>

      <EventForm />
    </div>
  );
}
