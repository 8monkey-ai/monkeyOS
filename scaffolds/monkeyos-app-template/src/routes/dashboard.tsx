import { BookOpenCheck, Database, Rocket } from "lucide-react";
import { Card } from "../components/ui/card";

const foundations = [
  {
    title: "Define the business",
    detail: "Name the owners and capture the first real process in BUSINESS.md and its own skill.",
    icon: BookOpenCheck,
  },
  {
    title: "Own data locally",
    detail: "Add only application-owned tables, migrations, RLS policies, and seeds.",
    icon: Database,
  },
  {
    title: "Ship through the platform",
    detail: "Keep app workflows thin; central CI builds and promotes an immutable tested image.",
    icon: Rocket,
  },
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeading
        eyebrow="Application foundation"
        title="Ready for the first real module."
        detail="Authentication, app-local access, configuration, and delivery are ready without inventing a placeholder business domain."
      />
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {foundations.map(({ title, detail, icon: Icon }) => (
          <Card key={title} className="p-5 sm:p-7">
            <div className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
              <Icon className="size-5" />
            </div>
            <h2 className="mt-5 text-lg font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
          </Card>
        ))}
      </div>
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
