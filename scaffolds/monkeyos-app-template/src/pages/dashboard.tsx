import { CheckCircle2, CircleDot, Clock3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "../components/ui/card";
import { useWorkItems } from "../hooks/use-work-items";

export function DashboardPage() {
  const items = useWorkItems();
  const counts = [
    {
      status: "Open",
      count: items.data?.filter((item) => item.status === "open").length ?? 0,
      icon: CircleDot,
      tone: "text-sky-700 bg-sky-50",
    },
    {
      status: "In progress",
      count: items.data?.filter((item) => item.status === "in_progress").length ?? 0,
      icon: Clock3,
      tone: "text-amber-700 bg-amber-50",
    },
    {
      status: "Done",
      count: items.data?.filter((item) => item.status === "done").length ?? 0,
      icon: CheckCircle2,
      tone: "text-emerald-700 bg-emerald-50",
    },
  ];
  return (
    <div>
      <PageHeading
        eyebrow="Workspace"
        title="Good work starts with clarity."
        detail="A neutral operational view of the current work-item lifecycle."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {counts.map(({ status, count, icon: Icon, tone }) => (
          <Card key={status} className="p-5">
            <div className={`grid size-10 place-items-center rounded-xl ${tone}`}>
              <Icon className="size-5" />
            </div>
            <p className="mt-5 text-3xl font-bold">{count}</p>
            <p className="mt-1 text-sm text-slate-500">{status}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-6 p-5 sm:p-7">
        <div>
          <h2 className="text-lg font-bold">Work by status</h2>
          <p className="mt-1 text-sm text-slate-500">
            Live app-owned data, protected by membership RLS.
          </p>
        </div>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={counts}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="status" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
              <Tooltip cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="count" fill="#0f766e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  detail,
  action,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{detail}</p>
      </div>
      {action}
    </div>
  );
}
