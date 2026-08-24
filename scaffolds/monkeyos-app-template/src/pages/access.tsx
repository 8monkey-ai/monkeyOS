import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldPlus, Trash2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAuth } from "../contexts/auth";
import { useRuntime } from "../contexts/runtime";
import { formatDate } from "../lib/utils";
import { PageHeading } from "./dashboard";

const AddMemberSchema = z.object({ email: z.email(), role: z.enum(["admin", "member"]) });
type AddMemberValues = z.infer<typeof AddMemberSchema>;

export function AccessPage() {
  const { supabase } = useRuntime();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const members = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("members").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const add = useMutation({
    mutationFn: async (values: AddMemberValues) => {
      const { error } = await supabase.rpc("add_member_by_email", {
        target_email: values.email,
        target_role: values.role,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }),
  });
  const changeRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: "admin" | "member" }) => {
      const { error } = await supabase.from("members").update({ role }).eq("user_id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("members").delete().eq("user_id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }),
  });
  const form = useForm<AddMemberValues>({
    resolver: zodResolver(AddMemberSchema),
    defaultValues: { email: "", role: "member" },
  });
  const role = useWatch({ control: form.control, name: "role" });
  const submit = form.handleSubmit(async (values) => {
    await add.mutateAsync(values);
    form.reset();
  });
  return (
    <div>
      <PageHeading
        eyebrow="Administration"
        title="Application access"
        detail="Add an existing Auth identity by exact email. The browser cannot list or search the shared user directory."
      />
      <div className="mt-8 grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <Card className="h-fit p-5 sm:p-7">
          <div className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
            <ShieldPlus className="size-5" />
          </div>
          <h2 className="mt-5 text-lg font-bold">Add existing user</h2>
          <form className="mt-5 space-y-4" onSubmit={submit}>
            <label className="block text-sm font-semibold">
              Exact email
              <Input
                className="mt-2"
                type="email"
                placeholder="person@example.com"
                {...form.register("email")}
              />
            </label>
            <label className="block text-sm font-semibold">
              Role
              <Select
                value={role}
                onValueChange={(role) =>
                  role && form.setValue("role", role as AddMemberValues["role"])
                }
              >
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </label>
            {add.error && (
              <Alert variant="destructive">
                <AlertDescription>{add.error.message}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={add.isPending}>
              {add.isPending ? "Adding…" : "Add access"}
            </Button>
          </form>
        </Card>
        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <h2 className="font-bold">Current members</h2>
            <p className="mt-1 text-sm text-slate-500">
              User IDs are shown because membership intentionally stores no shared profile
              directory.
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {members.data?.map((member) => (
              <div
                key={member.user_id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs text-slate-700">{member.user_id}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Added {formatDate(member.created_at)}
                  </p>
                </div>
                <Select
                  value={member.role}
                  onValueChange={(role) =>
                    role &&
                    changeRole.mutate({ id: member.user_id, role: role as "admin" | "member" })
                  }
                >
                  <SelectTrigger aria-label={`Role for ${member.user_id}`} className="capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  aria-label={`Remove ${member.user_id}`}
                  variant="ghost"
                  size="sm"
                  disabled={member.user_id === user?.id}
                  onClick={() => remove.mutate(member.user_id)}
                >
                  <Trash2 className="size-4 text-rose-600" />
                </Button>
              </div>
            ))}
            {members.data?.length === 0 && (
              <p className="p-8 text-center text-sm text-slate-500">No members.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
