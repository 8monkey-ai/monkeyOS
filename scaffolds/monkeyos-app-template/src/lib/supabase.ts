import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PublicConfig } from "../config";
import type { Database } from "./database.types";

export type AppSupabaseClient = SupabaseClient<Database, "monkeyos_app_template">;

let cachedClient: { key: string; client: AppSupabaseClient } | undefined;

export function createAppClient(config: PublicConfig): AppSupabaseClient {
  if (config.appSchema !== "monkeyos_app_template") {
    throw new Error(
      `Provisioning mismatch: client expects monkeyos_app_template, received ${config.appSchema}`,
    );
  }
  const key = `${config.supabaseUrl}|${config.supabasePublishableKey}|${config.appSchema}`;
  if (cachedClient?.key === key) return cachedClient.client;
  const client = createClient<Database, "monkeyos_app_template">(
    config.supabaseUrl,
    config.supabasePublishableKey,
    {
      db: { schema: "monkeyos_app_template" },
      auth: {
        persistSession: typeof window !== "undefined",
        autoRefreshToken: typeof window !== "undefined",
        detectSessionInUrl: typeof window !== "undefined",
      },
    },
  );
  cachedClient = { key, client };
  return client;
}
