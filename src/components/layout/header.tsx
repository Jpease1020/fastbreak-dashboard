"use client";

import { LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth";

export function Header({ email }: { email?: string }) {
  async function handleLogout() {
    try {
      await logout();
    } catch {
      toast.error("Failed to sign out");
    }
  }

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="text-xl font-bold">
          Fastbreak
        </Link>

        <div className="flex items-center gap-3">
          <Button size="sm" render={<Link href="/dashboard/events/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>

          {email && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {email}
            </span>
          )}

          <form action={handleLogout}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
