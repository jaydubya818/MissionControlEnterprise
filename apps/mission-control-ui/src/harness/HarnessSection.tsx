import type { Id } from "../../../../convex/_generated/dataModel";
import type { MainView } from "../TopNav";
import { isHarnessView, type HarnessView } from "./harnessViews";
import { HarnessLoopsView } from "./views/HarnessLoopsView";
import { HarnessWorkLedgerView } from "./views/HarnessWorkLedgerView";
import { HarnessMetaLoopView } from "./views/HarnessMetaLoopView";
import { HarnessBuilderView } from "./views/HarnessBuilderView";
import { HarnessWorkshopView } from "./views/HarnessWorkshopView";
import { HarnessSoftwareFactoryView } from "./views/HarnessSoftwareFactoryView";
import { HarnessArchitectView } from "./views/HarnessArchitectView";
import { HarnessPatternsView } from "./views/HarnessPatternsView";
import { HarnessCodeReviewWizardView } from "./views/HarnessCodeReviewWizardView";

export { isHarnessView, HARNESS_VIEWS } from "./harnessViews";
export type { HarnessView } from "./harnessViews";

interface HarnessSectionProps {
  currentView: MainView;
  projectId: Id<"projects"> | null;
  onNavigate: (view: MainView) => void;
}

export function HarnessSection({ currentView, projectId, onNavigate }: HarnessSectionProps): JSX.Element | null {
  if (!isHarnessView(currentView)) return null;

  switch (currentView) {
    case "harness-software-factory":
      return <HarnessSoftwareFactoryView projectId={projectId} onNavigate={onNavigate} />;
    case "harness-workshop":
      return <HarnessWorkshopView />;
    case "harness-architect":
      return <HarnessArchitectView projectId={projectId} onNavigate={onNavigate} />;
    case "harness-patterns":
      return <HarnessPatternsView projectId={projectId} onNavigate={onNavigate} />;
    case "harness-loops":
      return <HarnessLoopsView projectId={projectId} onNavigate={onNavigate} />;
    case "harness-work-ledger":
      return <HarnessWorkLedgerView projectId={projectId} />;
    case "harness-meta-loop":
      return <HarnessMetaLoopView projectId={projectId} onNavigate={onNavigate} />;
    case "harness-builder":
      return <HarnessBuilderView onNavigate={onNavigate} />;
    case "harness-code-review-wizard":
      return <HarnessCodeReviewWizardView onNavigate={onNavigate} projectId={projectId} />;
    case "harness-health":
    case "harness-control-plane":
    case "harness-verifiers":
    case "harness-change-review":
    case "harness-change-risk":
    case "harness-launch":
    case "harness-team-pulse":
    case "harness-maintenance":
    case "harness-automations":
    case "harness-agent-fleet":
      return null;
    default: {
      const _exhaustive: never = currentView;
      return _exhaustive;
    }
  }
}
