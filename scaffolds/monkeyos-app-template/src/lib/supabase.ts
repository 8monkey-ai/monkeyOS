import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PublicConfig } from "../config";
import type { Database } from "./database.types";

// The application owns the default `public` schema, so the client needs no schema selection and
// the generated `Tables`/`Enums` helpers resolve without a `{ schema }` wrapper.
export type AppSupabaseClient = SupabaseClient<Database>;

let cachedClient: { key: string; client: AppSupabaseClient } | undefined;

export function createAppClient(config: PublicConfig): AppSupabaseClient {
  const key = `${config.supabaseUrl}|${config.supabasePublishableKey}`;
  if (cachedClient?.key === key) return cachedClient.client;
  const client = createClient<Database>(config.supabaseUrl, config.supabasePublishableKey, {
    auth: {
      persistSession: typeof window !== "undefined",
      autoRefreshToken: typeof window !== "undefined",
      detectSessionInUrl: typeof window !== "undefined",
    },
  });
  cachedClient = { key, client };
  return client;
}
