"use client";

import { LogOut, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth";

export function Header({ email }: { email?: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[oklch(0.136_0.027_230)]/90 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/dashboard"
          className="text-xl font-bold uppercase tracking-widest text-white"
        >
          Fastbreak
        </Link>

        <div className="flex items-center gap-2">
          <Button render={<Link href="/dashboard/events/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>

          {email && (
            <span className="hidden max-w-[200px] truncate rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 sm:inline">
              {email}
            </span>
          )}

          <form action={logout}>
            <Button variant="ghost" size="sm" type="submit" className="text-white/80 hover:bg-white/10 hover:text-white">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
