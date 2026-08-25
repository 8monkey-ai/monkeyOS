import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useRuntime } from "../contexts/runtime";

export const membersQueryKey = ["members"] as const;
const MemberRoleSchema = z.enum(["admin", "member"]);
const AddMemberInputSchema = z.object({ email: z.email(), role: MemberRoleSchema });
const ChangeMemberRoleInputSchema = z.object({ id: z.uuid(), role: MemberRoleSchema });
const MemberIdSchema = z.uuid();

async function invalidateMembershipState(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: membersQueryKey });
}

export function useMembers() {
  const { supabase } = useRuntime();
  return useQuery({
    queryKey: membersQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase.from("members").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

export function useAddMember() {
  const { supabase } = useRuntime();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: z.input<typeof AddMemberInputSchema>) => {
      const { email, role } = AddMemberInputSchema.parse(input);
      const { error } = await supabase.rpc("add_member_by_email", {
        target_email: email,
        target_role: role,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateMembershipState(queryClient),
  });
}

export function useChangeMemberRole() {
  const { supabase } = useRuntime();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: z.input<typeof ChangeMemberRoleInputSchema>) => {
      const { id, role } = ChangeMemberRoleInputSchema.parse(input);
      const { error } = await supabase.from("members").update({ role }).eq("user_id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateMembershipState(queryClient),
  });
}

export function useRemoveMember() {
  const { supabase } = useRuntime();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: string) => {
      const id = MemberIdSchema.parse(input);
      const { error } = await supabase.from("members").delete().eq("user_id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateMembershipState(queryClient),
  });
}
