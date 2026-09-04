import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { AluhicLogo } from "@/components/AluhicLogo";

export default function VerifyEmail() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token");
  
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error">("loading");

  const verifyEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/verify-email", { token });
      return response.json();
    },
    onSuccess: () => {
      setVerificationStatus("success");
    },
    onError: () => {
      setVerificationStatus("error");
    },
  });

  useEffect(() => {
    if (token) {
      verifyEmailMutation.mutate();
    } else {
      setVerificationStatus("error");
    }
  }, [token]);

  if (verificationStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AluhicLogo variant="full" size="md" />
            </div>
            <CardTitle>Verifying Email</CardTitle>
            <CardDescription>
              Please wait while we verify your email address...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-4">
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle>Email Verified!</CardTitle>
            <CardDescription>
              Your email address has been successfully verified.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>You can now access all features of your Alhuic account.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/login">
              <Button data-testid="button-sign-in">
                Sign In Now
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 dark:bg-red-900 p-4">
              <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle>Verification Failed</CardTitle>
          <CardDescription>
            This verification link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>Please request a new verification email from your account settings.</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login">
            <Button data-testid="button-back-to-login">
              Back to Sign In
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
