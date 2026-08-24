import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useAuditLog } from "../hooks/use-audit-log";
import { formatDate } from "../lib/utils";
import { PageHeading } from "./dashboard";

export function AuditPage() {
  const audit = useAuditLog();
  return (
    <div>
      <PageHeading
        eyebrow="Traceability"
        title="Audit trail"
        detail="The latest material membership changes and future business events owned by this application."
      />
      <Card className="mt-8 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {audit.isPending ? (
            <p className="p-10 text-center text-slate-500">Loading audit history…</p>
          ) : (
            audit.data?.map((entry) => (
              <article
                key={entry.id}
                className="grid gap-3 p-5 sm:grid-cols-[10rem_1fr_auto] sm:items-center"
              >
                <time className="text-xs text-slate-500">{formatDate(entry.occurred_at)}</time>
                <div>
                  <p className="font-semibold">{entry.action}</p>
                  <p className="mt-1 font-mono text-xs text-slate-500">
                    {entry.entity} · {entry.record_id ?? "system"}
                  </p>
                </div>
                <Badge variant="secondary">{entry.actor_user_id ? "user" : "system"}</Badge>
              </article>
            ))
          )}
          {audit.data?.length === 0 && (
            <p className="p-10 text-center text-slate-500">No audited changes yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
