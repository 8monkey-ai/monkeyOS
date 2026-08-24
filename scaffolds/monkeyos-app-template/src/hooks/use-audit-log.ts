import { useQuery } from "@tanstack/react-query";
import { useRuntime } from "../contexts/runtime";

export const auditLogQueryKey = ["audit-log"] as const;

export function useAuditLog() {
  const { supabase } = useRuntime();
  return useQuery({
    queryKey: auditLogQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
}
