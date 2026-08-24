import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/auth";
import { useRuntime } from "../contexts/runtime";

export function useMembership() {
  const { user } = useAuth();
  const { supabase } = useRuntime();
  return useQuery({
    queryKey: ["membership", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
