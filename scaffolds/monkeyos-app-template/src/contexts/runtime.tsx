import { createContext, type ReactNode, use, useMemo, useState } from "react";
import type { PublicConfig } from "../config";
import { createAppClient, type AppSupabaseClient } from "../lib/supabase";

type Runtime = { config: PublicConfig; supabase: AppSupabaseClient };
const RuntimeContext = createContext<Runtime | null>(null);

export function RuntimeProvider({
  config,
  children,
}: {
  config: PublicConfig;
  children: ReactNode;
}) {
  const [supabase] = useState(() => createAppClient(config));
  const runtime = useMemo(() => ({ config, supabase }), [config, supabase]);
  return <RuntimeContext value={runtime}>{children}</RuntimeContext>;
}

export function useRuntime() {
  const runtime = use(RuntimeContext);
  if (!runtime) throw new Error("useRuntime must be used inside RuntimeProvider");
  return runtime;
}
