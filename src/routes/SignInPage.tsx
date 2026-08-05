import { Navigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "../auth";

export function SignInPage() {
  const { isSignedIn, isSigningIn, error, signIn } = useAuth();

  if (isSignedIn) {
    return <Navigate to="/properties" replace />;
  }

  return (
    <div className="flex justify-center py-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Property Expense Tracker</CardTitle>
          <CardDescription>
            Sign in to view and manage your portfolio.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button className="w-full" onClick={signIn} disabled={isSigningIn}>
            {isSigningIn ? "Signing in…" : "Sign in with Google"}
          </Button>
          {error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
