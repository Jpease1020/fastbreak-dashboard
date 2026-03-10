import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { getE2ESessionEmail, isE2EMockEnabled } from "@/lib/e2e/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isE2EMockEnabled()) {
    const email = await getE2ESessionEmail();

    if (!email) {
      redirect("/login");
    }

    return (
      <div className="min-h-screen">
        <Header email={email} />
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">{children}</main>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <Header email={user.email} />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
