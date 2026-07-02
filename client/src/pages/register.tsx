import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Building2, User } from "lucide-react";
import { AluhicLogo } from "@/components/AluhicLogo";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  userType: z.enum(["individual", "company"]),
  companyName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.userType === "company") {
    return !!data.companyName && data.companyName.length > 0;
  }
  return true;
}, {
  message: "Company name is required for company accounts",
  path: ["companyName"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userType, setUserType] = useState<"individual" | "company">("individual");

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      userType: "individual",
      companyName: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const payload = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        userType: data.userType,
        companyName: data.companyName,
      };
      const res = await apiRequest("POST", "/api/auth/register", payload);
      return await res.json();
    },
    onSuccess: (user: any) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.firstName}! Your account has been created.`,
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  const handleUserTypeChange = (value: string) => {
    setUserType(value as "individual" | "company");
    form.setValue("userType", value as "individual" | "company");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <AluhicLogo size="lg" />
          </div>
          <div>
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Join AI-Powered Healthcare & Pharma Platform
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* User Type Selection */}
            <div className="space-y-3">
              <Label>Account Type</Label>
              <RadioGroup
                value={userType}
                onValueChange={handleUserTypeChange}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="individual"
                    id="individual"
                    className="peer sr-only"
                    data-testid="radio-individual"
                  />
                  <Label
                    htmlFor="individual"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover-elevate active-elevate-2 peer-data-[state=checked]:border-primary cursor-pointer"
                    data-testid="label-individual"
                  >
                    <User className="mb-3 h-6 w-6" />
                    <span className="text-sm font-medium">Individual</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="company"
                    id="company"
                    className="peer sr-only"
                    data-testid="radio-company"
                  />
                  <Label
                    htmlFor="company"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover-elevate active-elevate-2 peer-data-[state=checked]:border-primary cursor-pointer"
                    data-testid="label-company"
                  >
                    <Building2 className="mb-3 h-6 w-6" />
                    <span className="text-sm font-medium">Company</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  {...form.register("firstName")}
                  placeholder="John"
                  data-testid="input-firstname"
                />
                {form.formState.errors.firstName && (
                  <p className="text-xs text-destructive" data-testid="error-firstname">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  {...form.register("lastName")}
                  placeholder="Doe"
                  data-testid="input-lastname"
                />
                {form.formState.errors.lastName && (
                  <p className="text-xs text-destructive" data-testid="error-lastname">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="john.doe@example.com"
                data-testid="input-email"
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive" data-testid="error-email">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Company Name (conditional) */}
            {userType === "company" && (
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  {...form.register("companyName")}
                  placeholder="Acme Pharmaceuticals"
                  data-testid="input-companyname"
                />
                {form.formState.errors.companyName && (
                  <p className="text-xs text-destructive" data-testid="error-companyname">
                    {form.formState.errors.companyName.message}
                  </p>
                )}
              </div>
            )}

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                placeholder="••••••••"
                data-testid="input-password"
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive" data-testid="error-password">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...form.register("confirmPassword")}
                placeholder="••••••••"
                data-testid="input-confirmpassword"
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive" data-testid="error-confirmpassword">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
              data-testid="button-register"
            >
              {registerMutation.isPending ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-primary hover:underline"
              data-testid="link-login"
            >
              Sign in
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
