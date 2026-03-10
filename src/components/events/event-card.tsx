"use client";

import { format } from "date-fns";
import { Calendar, MapPin, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteEvent } from "@/lib/actions/events";
import type { SportEvent } from "@/lib/types";
import { Loader2 } from "lucide-react";

export function EventCard({ event }: { event: SportEvent }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteEvent(event.id);
    if (result.error) {
      toast.error(result.error);
      setIsDeleting(false);
    } else {
      toast.success("Event deleted successfully");
      setDialogOpen(false);
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="line-clamp-1">{event.name}</CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(event.date_time), "MMM d, yyyy 'at' h:mm a")}
            </CardDescription>
          </div>
          <Badge variant="secondary">{event.sport_type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {event.description && (
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
            {event.description}
          </p>
        )}
        {event.event_venues.length > 0 && (
          <div className="space-y-1">
            {event.event_venues.map((venue) => (
              <div
                key={venue.id}
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-1">
                  {venue.name}
                  {venue.address && ` — ${venue.address}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" size="sm" className="flex-1" render={<Link href={`/dashboard/events/${event.id}/edit`} />}>
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Edit
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive" />
            }
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete event</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{event.name}&quot;? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
