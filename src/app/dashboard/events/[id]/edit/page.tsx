import { notFound } from "next/navigation";
import { EventForm } from "@/components/events/event-form";
import { getEvent } from "@/lib/actions/events";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Event</CardTitle>
          <CardDescription>
            Update event details and venue information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm event={result.data} />
        </CardContent>
      </Card>
    </div>
  );
}
