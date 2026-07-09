"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signIn } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="shadow-token-lg">
      <CardHeader>
        <CardTitle className="text-base text-foreground">Log in to your dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              const result = await signIn(formData);
              if (result?.error) setError(result.error);
            });
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Logging in..." : "Log in"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          No account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
