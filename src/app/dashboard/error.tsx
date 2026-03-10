"use client";

import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-4 rounded-full bg-destructive/10 p-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="mb-1 text-lg font-semibold">Something went wrong</h2>
      <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred while loading the dashboard."}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
