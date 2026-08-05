import { Navigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { StampIcon } from "@/components/StampIcon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "../auth";

export function SignInPage() {
  const { isSignedIn, isSigningIn, error, signIn } = useAuth();

  if (isSignedIn) {
    return <Navigate to="/properties" replace />;
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-4 text-center">
          <StampIcon size={44} />
          <CardDescription>
            Sign in to view and manage your portfolio.
          </CardDescription>
          <Separator />
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
