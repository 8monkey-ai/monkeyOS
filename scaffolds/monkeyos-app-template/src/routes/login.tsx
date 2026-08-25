import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation } from "react-router";
import { z } from "zod";
import { useAuth } from "../contexts/auth";
import { useRuntime } from "../contexts/runtime";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";

const LoginSchema = z.object({ email: z.email(), password: z.string().min(8) });
type LoginValues = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const { supabase } = useRuntime();
  const { user, loading } = useAuth();
  const location = useLocation();
  const [error, setError] = useState<string>();
  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });
  const requestedReturnPath =
    typeof location.state === "object" &&
    location.state !== null &&
    "from" in location.state &&
    typeof location.state.from === "string"
      ? location.state.from
      : undefined;
  const returnPath =
    requestedReturnPath?.startsWith("/") && !requestedReturnPath.startsWith("//")
      ? requestedReturnPath
      : "/";
  if (!loading && user) return <Navigate to={returnPath} replace />;
  const submit = form.handleSubmit(async (values) => {
    setError(undefined);
    const result = await supabase.auth.signInWithPassword(values);
    if (result.error) setError(result.error.message);
  });
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden bg-[#102a2e] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-teal-400 font-black text-[#102a2e]">
            m
          </div>
          <span className="text-lg font-bold">monkeyOS</span>
        </div>
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-300">
            Built for useful work
          </p>
          <h1 className="mt-4 text-5xl font-bold leading-tight tracking-tight">
            Simple applications. Strong boundaries.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-teal-50/70">
            Shared identity, local authorization, auditable business changes, and an immutable path
            to production.
          </p>
        </div>
        <p className="text-sm text-teal-100/50">Identity is shared. Authorization is local.</p>
      </section>
      <section className="grid place-items-center bg-[#f4f7f6] p-5 sm:p-10">
        <Card className="w-full max-w-md p-6 sm:p-8">
          <div className="grid size-12 place-items-center rounded-2xl bg-teal-100 text-teal-800">
            <LockKeyhole className="size-6" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm text-slate-600">
            Sign in with your existing Supabase identity.
          </p>
          <form className="mt-8 space-y-5" onSubmit={submit}>
            <label htmlFor="login-email" className="block text-sm font-semibold">
              Email
              <Input
                id="login-email"
                className="mt-2"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...form.register("email")}
              />
            </label>
            {form.formState.errors.email && (
              <p className="text-sm text-rose-600">Enter a valid email.</p>
            )}
            <label htmlFor="login-password" className="block text-sm font-semibold">
              Password
              <Input
                id="login-password"
                className="mt-2"
                type="password"
                autoComplete="current-password"
                {...form.register("password")}
              />
            </label>
            {error && (
              <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-xs leading-5 text-slate-500">
            Access is granted separately by an application admin. Signing in does not imply
            membership.
          </p>
        </Card>
      </section>
    </main>
  );
}
