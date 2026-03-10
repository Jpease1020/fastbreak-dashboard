import { SignupForm } from "@/components/auth/signup-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold uppercase tracking-widest text-foreground">
            Fastbreak
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sports Event Management
          </p>
        </div>

        <Card className="border-border border-t-2 border-t-primary">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Create an account
            </CardTitle>
            <CardDescription>
              Sign up for Fastbreak to manage your events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
