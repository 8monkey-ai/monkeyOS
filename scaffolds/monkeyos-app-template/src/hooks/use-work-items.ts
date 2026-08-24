import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/auth";
import { useRuntime } from "../contexts/runtime";
import type { WorkItem } from "../lib/database.types";

export function useWorkItems() {
  const { supabase } = useRuntime();
  return useQuery({
    queryKey: ["work-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateWorkItem() {
  const { supabase } = useRuntime();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; description: string }) => {
      if (!user) throw new Error("Sign in required");
      const { data, error } = await supabase
        .from("work_items")
        .insert({ ...input, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["work-items"] }),
  });
}

export function useUpdateWorkItem() {
  const { supabase } = useRuntime();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      update,
    }: {
      id: string;
      update: Partial<Pick<WorkItem, "title" | "description" | "status">>;
    }) => {
      const { error } = await supabase
        .from("work_items")
        .update({ ...update, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["work-items"] }),
  });
}

export function useDeleteWorkItem() {
  const { supabase } = useRuntime();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("work_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["work-items"] }),
  });
}
