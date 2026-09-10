/** EOS Command Center — authoritative operating control plane. */

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import { ArrowRight, Bot, Clock3, Plus, Sparkles } from "lucide-react";
import { PageHeader } from "../../components/factory/DetailLayout";
import { StatusBadge } from "../../components/factory/badges";
import { AttentionQueuePanel } from "../../components/AttentionQueuePanel";
import { FactorySchematicOverview } from "../../components/schematic";
import { EmptyState } from "../../components/ui/empty-state";
import { QuotaFuelGauge } from "../../components/QuotaFuelGauge";
import { cn } from "../../lib/utils";
import { buildAttentionItems, exceptionCounts } from "../../lib/attentionQueue";
import { loadGatewayStatus } from "../../lib/gatewayStatus";
import { useFlag } from "../../hooks/useFlag";
import {
  EosSection,
  HealthSignalCard,
  InsightCard,
} from "../components";
import { adaptHealthSignals, adaptRecommendations } from "../liveAdapters";
import type { HealthSignal, Insight } from "../types";
import { OperatingControlPlane } from "../components/OperatingControlPlane";

export interface CommandCenterViewProps {
  projectId: Id<"projects">;
  onNavigate: (view: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Local helpers (copied from DashboardOverview per style-guide convention)
// ─────────────────────────────────────────────────────────────────────────────

const CARD_CLASS = "rounded-xl border border-line bg-surface-1";

function ViewAllLink({
  onClick,
  label = "View all",
}: {
  onClick: () => void;
  label?: string;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-medium text-ok transition-opacity duration-150 hover:opacity-80"
    >
      {label}
      <ArrowRight size={12} strokeWidth={1.75} aria-hidden />
    </button>
  );
}

/** Thin 4px green progress bar with a right-aligned mono value label. */
function ThinBar({ fraction, label }: { fraction: number; label?: string }): JSX.Element {
  const pct = Math.max(0, Math.min(1, Number.isFinite(fraction) ? fraction : 0)) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-ok" style={{ width: `${pct}%` }} />
      </div>
      {label && (
        <span className="shrink-0 text-right font-mono text-[11px] text-ink-muted">{label}</span>
      )}
    </div>
  );
}

function LoadingRows({ count = 3 }: { count?: number }): JSX.Element {
  return (
    <div className={cn(CARD_CLASS, "flex flex-col gap-3 p-4")}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-4 animate-pulse rounded bg-surface-2" />
      ))}
    </div>
  );
}

function AutomationPostureCard({
  data,
  onNavigate,
}: {
  data: any;
  onNavigate: (view: string) => void;
}): JSX.Element {
  const next = data.definitions
    .filter((definition: any) => definition.status === "ACTIVE" && definition.nextRunAt)
    .sort((a: any, b: any) => a.nextRunAt - b.nextRunAt)[0];
  const metrics = [
    ["Active", data.metrics.active],
    ["Paused", data.metrics.paused],
    ["Suspended", data.metrics.suspended],
    ["Awaiting approval", data.metrics.waitingApprovals],
    ["Missing receipts", data.metrics.overdueReceipts],
    ["Time saved", `${data.metrics.estimatedHumanMinutesSaved}m`],
  ];
  return (
    <section className={cn(CARD_CLASS, "p-4")} aria-label="Automation posture">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 text-ok" aria-hidden />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ok">Operations</div>
            <h2 className="mt-1 text-[15px] font-semibold text-ink">Governed Automations</h2>
            <p className="mt-1 text-[12.5px] text-ink-secondary">Read-only review gates with explicit approval and independent receipts.</p>
          </div>
        </div>
        <ViewAllLink onClick={() => onNavigate("automations")} label="Open Automations" />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-line bg-surface-2/40 px-3 py-2.5">
            <dt className="text-[11px] text-ink-muted">{label}</dt>
            <dd className="mt-1 font-mono text-[15px] text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex items-center gap-2 text-[12px] text-ink-secondary">
        <Clock3 className="h-3.5 w-3.5 text-ink-muted" aria-hidden />
        {next ? <>Next evaluation: {next.name} · {new Date(next.nextRunAt).toLocaleString()}</> : "No active Automation is scheduled."}
      </div>
    </section>
  );
}

const AGENT_DOT_COLOR: Record<string, string> = {
  ACTIVE: "bg-ok",
  PAUSED: "bg-warn",
  DRAINED: "bg-warn",
  QUARANTINED: "bg-err",
  OFFLINE: "bg-ink-muted",
};

const AGENT_BADGE_TONE: Record<string, "success" | "warning" | "error" | "neutral"> = {
  ACTIVE: "success",
  PAUSED: "warning",
  DRAINED: "warning",
  QUARANTINED: "error",
  OFFLINE: "neutral",
};

// ─────────────────────────────────────────────────────────────────────────────
// AI workforce (real Convex agents + task join; functional role titles)
// ─────────────────────────────────────────────────────────────────────────────

function WorkforceList({
  agents,
  tasks,
  onNavigate,
}: {
  agents: Doc<"agents">[];
  tasks: Doc<"tasks">[];
  onNavigate: (view: string) => void;
}): JSX.Element {
  if (agents.length === 0) {
    return (
      <EmptyState
        icon={Bot}
        title="No agents registered"
        description="Register an agent to put the factory to work."
      />
    );
  }
  const sorted = [...agents].sort((a, b) =>
    a.status === b.status ? 0 : a.status === "ACTIVE" ? -1 : 1
  );
  return (
    <ul className={CARD_CLASS}>
      {sorted.map((agent) => {
        const currentTask = agent.currentTaskId
          ? tasks.find((t) => t._id === agent.currentTaskId) ?? null
          : null;
        const recentResult = currentTask
          ? `Working: ${currentTask.title}`
          : agent.status === "ACTIVE"
            ? "Idle"
            : agent.status.toLowerCase();
        return (
          <li key={agent._id} className="border-b border-line last:border-b-0">
            <button
              type="button"
              onClick={() => onNavigate("agents")}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-2"
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  AGENT_DOT_COLOR[agent.status] ?? "bg-ink-muted"
                )}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="truncate text-[13px] font-medium text-ink">{agent.name}</span>
                  <span className="shrink-0 text-[11.5px] text-ink-muted">
                    {agent.role.toLowerCase()}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-ink-muted">
                  {recentResult}
                </span>
                {agent.status === "QUARANTINED" && (
                  <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-err">
                    <span className="truncate">Escalation: credential rotation required</span>
                  </span>
                )}
              </span>
              <span className="hidden w-32 shrink-0 sm:block">
                <ThinBar
                  fraction={agent.budgetDaily > 0 ? agent.spendToday / agent.budgetDaily : 0}
                  label={`$${agent.spendToday.toFixed(2)}/$${agent.budgetDaily.toFixed(0)}`}
                />
              </span>
              <StatusBadge tone={AGENT_BADGE_TONE[agent.status] ?? "neutral"}>
                {agent.status.charAt(0) + agent.status.slice(1).toLowerCase()}
              </StatusBadge>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory capacity (quota gauge + scheduler posture) and readiness
// ─────────────────────────────────────────────────────────────────────────────

function CapacityPostureCard({ usagePct }: { usagePct: number | null }): JSX.Element {
  const schedulerDot =
    usagePct == null ? "bg-ink-muted" : usagePct < 80 ? "bg-ok" : "bg-warn";
  return (
    <div className={cn(CARD_CLASS, "flex flex-col gap-2 p-4")}>
      <div className="flex items-center gap-2 text-[12.5px] text-ink-secondary">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", schedulerDot)} aria-hidden />
        Scheduler: safe to start background work
      </div>
      <div className="text-[12.5px] text-ink-muted">Constraint: provider quota</div>
    </div>
  );
}

function FactoryReadinessCard({
  gatewayConfigured,
  agents,
  nextJobLabel,
}: {
  gatewayConfigured: boolean | null;
  agents: Doc<"agents">[];
  nextJobLabel: string;
}): JSX.Element {
  const activeAgents = agents.filter((a) => a.status === "ACTIVE").length;
  const quarantined = agents.filter((a) => a.status === "QUARANTINED").length;
  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Gateway (Global)",
      value:
        gatewayConfigured == null ? (
          <span className="text-ink-muted">Checking…</span>
        ) : gatewayConfigured ? (
          <StatusBadge tone="success">Connected</StatusBadge>
        ) : (
          <StatusBadge tone="warning">Not configured</StatusBadge>
        ),
    },
    {
      label: "Agents",
      value: `${activeAgents} active / ${agents.length}${quarantined > 0 ? ` · ${quarantined} quarantined` : ""}`,
    },
    { label: "Scheduler", value: nextJobLabel },
  ];
  return (
    <div className={cn(CARD_CLASS, "p-4")}>
      <dl className="flex flex-col divide-y divide-line">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
            <dt className="text-[12.5px] text-ink-muted">{row.label}</dt>
            <dd className="text-[13px] text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main view
// ─────────────────────────────────────────────────────────────────────────────

export function CommandCenterView({
  projectId,
  onNavigate,
}: CommandCenterViewProps): JSX.Element {
  const [gatewayConfigured, setGatewayConfigured] = useState<boolean | null>(null);
  const showOperatingControlPlane = useFlag("control-plane.role-lenses");

  useEffect(() => {
    let cancelled = false;
    loadGatewayStatus().then((snapshot) => {
      if (!cancelled) {
        setGatewayConfigured(Boolean(snapshot.status?.configured));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Live Convex data ───────────────────────────────────────────────────────
  const approvals = useQuery(api.approvals.listPending, { projectId, limit: 25 });
  const tasks = useQuery(api.tasks.listAll, { projectId });
  const openAlerts = useQuery(api.alerts.listOpen, { projectId, limit: 10 });
  const agents = useQuery(api.agents.listAll, { projectId });
  const scheduledJobs = useQuery(api.scheduledJobs.list, { projectId });
  const quotaSnapshot = useQuery(api.quotaTracking.getLatestSnapshot, {});
  const liveSignals = useQuery(api.eos.projections.getHealthSignals, { projectId });
  const liveRecs = useQuery(api.eos.projections.getRecommendations, { projectId });
  const automationData = useQuery(api.automations.getControlPlane, { projectId });

  const healthSignals: HealthSignal[] =
    liveSignals && liveSignals.length > 0
      ? adaptHealthSignals(liveSignals as HealthSignal[])
      : [];
  const insights: Insight[] =
    liveRecs && liveRecs.length > 0
      ? adaptRecommendations(liveRecs as Insight[])
      : [];

  const alertsList = openAlerts ?? [];
  const blockedTasksList = (tasks ?? []).filter((t) => t.status === "BLOCKED");
  const failedTasksList = (tasks ?? []).filter((t) => t.status === "FAILED");
  const needsApprovalTasks = (tasks ?? []).filter((t) => t.status === "NEEDS_APPROVAL");
  const scannedAt = Date.now();

  const openTask = (taskId: Id<"tasks">) => {
    onNavigate("tasks");
    void taskId;
  };

  const attentionItems = buildAttentionItems({
    approvals: approvals ?? [],
    blockedTasks: blockedTasksList,
    needsApprovalTasks,
    failedTasks: failedTasksList,
    alerts: alertsList,
    openApproval: () => onNavigate("control-approvals"),
    openTask,
    openApprovalsModal: () => onNavigate("control-approvals"),
    openAlertRules: () => onNavigate("trace-inspector"),
  });

  const exceptions = exceptionCounts({
    approvals: approvals ?? [],
    blockedTasks: blockedTasksList,
    failedTasks: failedTasksList,
    alerts: alertsList,
  });

  const attentionLoading = !approvals || !tasks || !openAlerts;

  const now = Date.now();
  const nextJob = (scheduledJobs ?? [])
    .filter((j) => j.nextRun != null && j.nextRun >= now)
    .sort((a, b) => (a.nextRun ?? 0) - (b.nextRun ?? 0))[0];
  const nextJobLabel = nextJob
    ? `${nextJob.name} · ${new Date(nextJob.nextRun ?? 0).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : "No jobs scheduled";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex-1 overflow-auto bg-app">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-8 py-6">
        <PageHeader
          title="Command Center"
          description="The causal system of record and operating control plane for AI-native engineering."
          actions={
            <button
              type="button"
              onClick={() => onNavigate("control-work-orders")}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-act px-3 text-[13px] font-medium text-act-ink transition-opacity duration-150 hover:opacity-90"
            >
              <Plus size={14} strokeWidth={1.75} aria-hidden />
              Open work orders
            </button>
          }
        />

        {showOperatingControlPlane ? (
          <OperatingControlPlane projectId={projectId} onNavigate={onNavigate} />
        ) : null}

        <FactorySchematicOverview
          onNavigate={onNavigate}
          projectId={projectId}
          scannedAt={scannedAt}
          title="Factory overview"
        />

        {attentionLoading ? (
          <LoadingRows count={4} />
        ) : (
          <AttentionQueuePanel
            items={attentionItems}
            scannedAt={scannedAt}
            counts={exceptions}
            onOpenApprovals={() => onNavigate("control-approvals")}
            onOpenTasks={() => onNavigate("tasks")}
            onOpenAlerts={() => onNavigate("trace-inspector")}
          />
        )}

        {!automationData ? <LoadingRows count={2} /> : <AutomationPostureCard data={automationData} onNavigate={onNavigate} />}

        {healthSignals.length > 0 ? (
          <div
            className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6"
            aria-label="Factory health signals"
          >
            {healthSignals.map((signal) => (
              <HealthSignalCard key={signal.id} signal={signal} onNavigate={onNavigate} />
            ))}
          </div>
        ) : (
          <div className={cn(CARD_CLASS, "px-4 py-5 text-[13px] text-ink-secondary")}>
            No workspace health exceptions are currently reported.
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Main column */}
          <div className="flex min-w-0 flex-col gap-6 xl:col-span-8">
            <EosSection
              eyebrow="INTELLIGENCE"
              title="Recommended actions"
            >
              {insights.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {insights.map((insight) => (
                    <InsightCard key={insight.id} insight={insight} onNavigate={onNavigate} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-line px-4 py-5 text-[13px] text-ink-secondary">
                  No workspace recommendations are open.
                </div>
              )}
            </EosSection>

          </div>

          {/* Right rail */}
          <div className="flex min-w-0 flex-col gap-6 xl:col-span-4">
            <EosSection
              eyebrow="WORKFORCE"
              title="AI workforce"
              action={<ViewAllLink onClick={() => onNavigate("agents")} />}
            >
              {!agents || !tasks ? (
                <LoadingRows count={4} />
              ) : (
                <WorkforceList agents={agents} tasks={tasks} onNavigate={onNavigate} />
              )}
            </EosSection>

            <EosSection eyebrow="RESOURCES · GLOBAL" title="Provider capacity">
              <div className="flex flex-col gap-3">
                <QuotaFuelGauge />
                <CapacityPostureCard usagePct={quotaSnapshot?.usagePct ?? null} />
              </div>
            </EosSection>

            <EosSection eyebrow="SYSTEM" title="Factory readiness">
              <FactoryReadinessCard
                gatewayConfigured={gatewayConfigured}
                agents={agents ?? []}
                nextJobLabel={nextJobLabel}
              />
            </EosSection>
          </div>
        </div>
      </div>
    </div>
  );
}
