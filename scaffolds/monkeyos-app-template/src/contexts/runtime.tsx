import { useQuery } from "@tanstack/react-query";
import { createContext, type ReactNode, use, useState } from "react";
import { PublicConfigSchema, type PublicConfig } from "../config";
import { createAppClient, type AppSupabaseClient } from "../lib/supabase";

type Runtime = { config: PublicConfig; supabase: AppSupabaseClient };
const RuntimeContext = createContext<Runtime | null>(null);

async function fetchConfig() {
  const response = await fetch("/api/config");
  if (!response.ok) throw new Error("Application configuration is unavailable");
  return PublicConfigSchema.parse(await response.json());
}

export function RuntimeProvider({ children }: { children: ReactNode }) {
  const config = useQuery({
    queryKey: ["runtime-config"],
    queryFn: fetchConfig,
    staleTime: Number.POSITIVE_INFINITY,
    retry: 1,
  });
  if (config.isPending)
    return (
      <FullScreenMessage
        title="Preparing your workspace"
        detail="Loading secure application configuration…"
      />
    );
  if (config.isError)
    return (
      <FullScreenMessage
        title="Configuration unavailable"
        detail={config.error.message}
        tone="error"
      />
    );
  return <ReadyRuntime config={config.data}>{children}</ReadyRuntime>;
}

function ReadyRuntime({ config, children }: { config: PublicConfig; children: ReactNode }) {
  const [supabase] = useState(() => createAppClient(config));
  const runtime = { config, supabase };
  return <RuntimeContext value={runtime}>{children}</RuntimeContext>;
}

export function useRuntime() {
  const runtime = use(RuntimeContext);
  if (!runtime) throw new Error("useRuntime must be used inside RuntimeProvider");
  return runtime;
}

function FullScreenMessage({
  title,
  detail,
  tone = "normal",
}: {
  title: string;
  detail: string;
  tone?: "normal" | "error";
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <div className="max-w-md text-center">
        <div
          className={
            tone === "error"
              ? "mx-auto mb-4 size-3 rounded-full bg-rose-500"
              : "mx-auto mb-4 size-3 animate-pulse rounded-full bg-teal-600"
          }
        />
        <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
        <p className="mt-2 text-slate-600">{detail}</p>
      </div>
    </main>
  );
}
