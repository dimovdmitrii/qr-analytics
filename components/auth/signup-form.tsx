"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signUp } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="shadow-token-lg">
      <CardHeader>
        <CardTitle className="text-base text-foreground">Create your company account</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              const result = await signUp(formData);
              if (result?.error) setError(result.error);
            });
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="companyName">Company name</Label>
            <Input id="companyName" name="companyName" required placeholder="Studio Atelier" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating account..." : "Sign up"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
