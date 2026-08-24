import { zodResolver } from "@hookform/resolvers/zod";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import { useMembership } from "../hooks/use-membership";
import {
  useCreateWorkItem,
  useDeleteWorkItem,
  useUpdateWorkItem,
  useWorkItems,
} from "../hooks/use-work-items";
import type { WorkItem } from "../lib/database.types";
import { formatDate } from "../lib/utils";
import { PageHeading } from "./dashboard";

const WorkItemSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().max(1000),
});
type WorkItemValues = z.infer<typeof WorkItemSchema>;

export function WorkItemsPage() {
  "use no memo";
  const items = useWorkItems();
  const membership = useMembership();
  const update = useUpdateWorkItem();
  const remove = useDeleteWorkItem();
  const columns: ColumnDef<WorkItem>[] = [
    {
      accessorKey: "title",
      header: "Work item",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold">{row.original.title}</p>
          <p className="mt-1 line-clamp-1 max-w-md text-xs text-slate-500">
            {row.original.description || "No description"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Select
          value={row.original.status}
          onValueChange={(status) =>
            status &&
            update.mutate({ id: row.original.id, update: { status: status as WorkItem["status"] } })
          }
        >
          <SelectTrigger aria-label={`Status for ${row.original.title}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      accessorKey: "updated_at",
      header: "Updated",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm text-slate-500">
          {formatDate(row.original.updated_at)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) =>
        membership.data?.role === "admin" ? (
          <Button
            aria-label={`Delete ${row.original.title}`}
            variant="ghost"
            size="sm"
            onClick={() => remove.mutate(row.original.id)}
          >
            <Trash2 className="size-4 text-rose-600" />
          </Button>
        ) : null,
    },
  ];
  const table = useReactTable({
    data: items.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <div>
      <PageHeading
        eyebrow="Core process"
        title="Work items"
        detail="Create, progress, reopen, and—if you are an admin—delete neutral work records."
        action={<CreateWorkItemDialog />}
      />
      <Card className="mt-8 overflow-hidden">
        <Table className="min-w-[720px]">
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id} className="px-5">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {items.isPending ? (
              <TableRow>
                <TableCell colSpan={4} className="px-5 py-12 text-center text-muted-foreground">
                  Loading work items…
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="px-5 py-12 text-center text-muted-foreground">
                  No work items yet.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-5 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function CreateWorkItemDialog() {
  const [open, setOpen] = useState(false);
  const create = useCreateWorkItem();
  const form = useForm<WorkItemValues>({
    resolver: zodResolver(WorkItemSchema),
    defaultValues: { title: "", description: "" },
  });
  const submit = form.handleSubmit(async (values) => {
    await create.mutateAsync(values);
    form.reset();
    setOpen(false);
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        New work item
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create work item</DialogTitle>
          <DialogDescription>New items start open and every change is audited.</DialogDescription>
        </DialogHeader>
        <form className="mt-7 space-y-5" onSubmit={submit}>
          <label className="block text-sm font-semibold">
            Title
            <Input className="mt-2" autoFocus {...form.register("title")} />
          </label>
          {form.formState.errors.title && (
            <p className="text-sm text-rose-600">Use 1–160 characters.</p>
          )}
          <label className="block text-sm font-semibold">
            Description
            <Textarea className="mt-2 min-h-28" {...form.register("description")} />
          </label>
          {create.error && (
            <Alert variant="destructive">
              <AlertDescription>{create.error.message}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
