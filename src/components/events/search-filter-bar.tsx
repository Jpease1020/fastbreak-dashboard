"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useTransition } from "react";
import { Loader2, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SPORT_TYPES } from "@/lib/types";

const SPORT_LABELS: Record<string, string> = {
  all: "All sports",
  ...Object.fromEntries(SPORT_TYPES.map((s) => [s, s])),
};

export function SearchFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const currentSearch = searchParams.get("search") ?? "";
  const currentSport = searchParams.get("sport") ?? "all";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all" && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.push(`/dashboard?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            defaultValue={currentSearch}
            onChange={(e) => {
              const value = e.target.value;
              if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
              searchTimerRef.current = setTimeout(() => updateParams("search", value), 300);
            }}
            className="bg-muted/50 pl-9"
          />
        </div>
        <Select
          defaultValue={currentSport}
          onValueChange={(value) => updateParams("sport", value ?? "all")}
        >
          <SelectTrigger className="w-full bg-muted/50 sm:w-[180px]">
            <SelectValue placeholder="Filter by sport">
              {SPORT_LABELS[currentSport] ?? currentSport}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sports</SelectItem>
            {SPORT_TYPES.map((sport) => (
              <SelectItem key={sport} value={sport}>
                {sport}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching...
          </div>
        )}
      </div>
    </div>
  );
}
