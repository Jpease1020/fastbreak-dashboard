"use client";

import { format } from "date-fns";
import { Calendar, Check, MapPin, Trophy, X } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SPORT_COLORS } from "@/lib/constants/sport-colors";
import type { EventFormValues } from "@/lib/validations/events";

type EventSummaryPanelProps = {
  form: UseFormReturn<EventFormValues>;
  isEditing?: boolean;
};

export function EventSummaryPanel({ form, isEditing }: EventSummaryPanelProps) {
  const name = form.watch("name");
  const sportType = form.watch("sport_type");
  const dateTime = form.watch("date_time");
  const venues = form.watch("venues");

  const filledVenues = venues?.filter((v) => v.name.trim()) ?? [];

  const sportColor = sportType
    ? (SPORT_COLORS[sportType] ?? SPORT_COLORS["Other"])
    : "";

  const formattedDate =
    dateTime && !isNaN(Date.parse(dateTime))
      ? format(new Date(dateTime), "MMM d, yyyy 'at' h:mm a")
      : null;

  const checks = [
    { label: "Event name", done: !!name?.trim() },
    { label: "Sport type", done: !!sportType },
    { label: "Date & time", done: !!formattedDate },
    { label: "Venue", done: filledVenues.length > 0 },
  ];

  return (
    <div className="sticky top-24 space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {isEditing ? "Editing Preview" : "Event Preview"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Event name */}
          {name?.trim() ? (
            <h3 className="text-lg font-semibold leading-tight">{name}</h3>
          ) : (
            <h3 className="text-lg italic text-muted-foreground">
              Untitled Event
            </h3>
          )}

          {/* Sport badge */}
          {sportType ? (
            <Badge
              variant="outline"
              className={`border text-xs font-medium ${sportColor}`}
            >
              {sportType}
            </Badge>
          ) : (
            <p className="text-sm text-muted-foreground">No sport selected</p>
          )}

          {/* Date & time */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {formattedDate ? (
              <span>{formattedDate}</span>
            ) : (
              <span className="text-muted-foreground">No date set</span>
            )}
          </div>

          {/* Venues */}
          {filledVenues.length > 0 ? (
            <div className="space-y-1">
              {filledVenues.map((venue, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-1">{venue.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>No venues added</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completion checklist */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Completion
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {checks.map((check) => (
              <li key={check.label} className="flex items-center gap-2 text-sm">
                {check.done ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground/50" />
                )}
                <span
                  className={
                    check.done ? "text-foreground" : "text-muted-foreground"
                  }
                >
                  {check.label}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
