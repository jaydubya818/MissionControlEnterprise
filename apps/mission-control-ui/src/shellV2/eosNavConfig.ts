import {
  Activity, BarChart3, Bot, BookOpen, Brain, Building2, CheckCircle2,
  ClipboardList, Cog, FileSearch, FlaskConical, Gauge, GitBranch, Landmark,
  LayoutDashboard, ListChecks, Radar, ScrollText, Shield, Sparkles, Target,
  Wrench, Scale, Route,
} from "lucide-react";
import type { MainView } from "../TopNav";
import type { NavGroup } from "./navConfig";

/**
 * Engineering-OS information architecture (flag eos.command-center-preview).
 *
 * Groups follow the operator's questions: what needs attention, what is
 * executing, which factory contract governs it, what controls may advance it,
 * and what evidence proves the result. Route capability metadata remains the
 * authority for whether each destination is Live, Preview, or Demo.
 */
export const EOS_NAV_GROUPS: NavGroup[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, items: [
    { view: "command-center" as MainView, label: "Command Center", icon: LayoutDashboard },
  ]},
  { id: "operate", label: "Operate", icon: Target, items: [
    { view: "missions" as MainView, label: "Missions", icon: Target },
    { view: "control-work-orders" as MainView, label: "Work Orders", icon: ClipboardList },
    { view: "tasks" as MainView, label: "Tasks & Attempts", icon: ListChecks },
    { view: "control-approvals" as MainView, label: "Approvals", icon: CheckCircle2 },
  ]},
  { id: "factory", label: "Factory", icon: Wrench, items: [
    { view: "projects" as MainView, label: "Factory Registry", icon: Building2 },
    { view: "factory" as MainView, label: "Factory Runs", icon: Wrench },
    { view: "agents" as MainView, label: "Agent Fleet", icon: Bot },
    { view: "model-routing" as MainView, label: "Routing Decisions", icon: Route },
    { view: "harness-loops" as MainView, label: "Harnesses & Loops", icon: GitBranch },
    { view: "agent-catalog" as MainView, label: "Capability Catalog", icon: Bot },
  ]},
  { id: "control", label: "Control", icon: Shield, items: [
    { view: "policies" as MainView, label: "Policies", icon: Shield },
    { view: "automations" as MainView, label: "Automations", icon: Sparkles },
    { view: "atc" as MainView, label: "Execution Queue", icon: Radar },
    { view: "identity" as MainView, label: "Identities & Authority", icon: ClipboardList },
    { view: "deployments" as MainView, label: "Releases & Deployments", icon: GitBranch },
    { view: "gateway" as MainView, label: "Gateway", icon: Cog },
    { view: "system" as MainView, label: "Database", icon: Cog },
  ]},
  { id: "observe", label: "Observe", icon: Activity, items: [
    { view: "trace-inspector" as MainView, label: "Observability & Evals", icon: GitBranch },
    { view: "audit" as MainView, label: "Audit Trail", icon: ScrollText },
    { view: "telemetry" as MainView, label: "Incidents & Telemetry", icon: Activity },
    { view: "analytics" as MainView, label: "Cost & Usage", icon: BarChart3 },
    { view: "operator-evals" as MainView, label: "Operator Evals", icon: FlaskConical },
    { view: "factory-health" as MainView, label: "Factory Health", icon: CheckCircle2 },
    { view: "readiness" as MainView, label: "Environment Readiness", icon: Landmark },
  ]},
  { id: "build", label: "Build", icon: Cog, items: [
    { view: "code" as MainView, label: "Pipelines", icon: Cog },
    { view: "dag" as MainView, label: "Task Graph", icon: GitBranch },
    { view: "harness-code-review-wizard" as MainView, label: "Code Review Setup", icon: CheckCircle2 },
    { view: "harness-change-review" as MainView, label: "Change Review", icon: FileSearch },
    { view: "qc-rulesets" as MainView, label: "Quality Rulesets", icon: ListChecks },
    { view: "recorder" as MainView, label: "Recorder", icon: Activity },
    { view: "test-generation" as MainView, label: "Test Generation", icon: FlaskConical },
    { view: "api-import" as MainView, label: "API Import", icon: FileSearch },
  ]},
  { id: "knowledge", label: "Knowledge", icon: BookOpen, items: [
    { view: "skills" as MainView, label: "Context Catalog", icon: Sparkles },
    { view: "registry-lifecycle" as MainView, label: "Context Lifecycle", icon: BookOpen },
    { view: "registry-evaluate" as MainView, label: "Evaluate Skill", icon: FlaskConical },
    { view: "registry-inventory" as MainView, label: "Skill Inventory", icon: ClipboardList },
    { view: "registry-installations" as MainView, label: "Installations", icon: ClipboardList },
    { view: "registry-runs" as MainView, label: "Evaluation Runs", icon: FlaskConical },
    { view: "memory" as MainView, label: "Memory", icon: Brain },
    { view: "docs" as MainView, label: "Documentation", icon: BookOpen },
  ]},
  { id: "labs", label: "Labs", icon: FlaskConical, items: [
    { view: "effectiveness" as MainView, label: "AI Effectiveness", icon: Gauge },
    { view: "friction" as MainView, label: "Friction & Waste", icon: Activity },
    { view: "recommendations" as MainView, label: "Recommendations", icon: Sparkles },
    { view: "dossier" as MainView, label: "Evidence Dossiers", icon: Scale },
    { view: "harness-meta-loop" as MainView, label: "Improvement History", icon: GitBranch },
    { view: "flaky-steps" as MainView, label: "Flaky Steps", icon: Activity },
    { view: "gherkin" as MainView, label: "Gherkin Studio", icon: ScrollText },
    { view: "hybrid-workflows" as MainView, label: "Hybrid Workflows", icon: GitBranch },
    { view: "codegen" as MainView, label: "Code Generation", icon: Cog },
    { view: "pipeline" as MainView, label: "Build Pipeline", icon: Cog },
    { view: "design-system" as MainView, label: "Design DNA", icon: Sparkles },
  ]},
];
