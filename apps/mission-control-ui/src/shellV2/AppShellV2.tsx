import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BellRing, Menu, MessageSquare } from "lucide-react";
import type { MainView } from "../TopNav";
import { Sidebar } from "./Sidebar";
import { ChatDock } from "./ChatDock";
import { ResizerHandle } from "./ResizerHandle";
import { useResizableColumns } from "./useResizableColumns";
import { groupForView, itemForView } from "./navConfig";
import { ENTERPRISE_NAV_GROUPS } from "./enterpriseNavConfig";
import { filterNavGroups } from "./navFilter";
import { routeBadge } from "./routeCapabilities";
import {
  ENTERPRISE_ROUTE_VIEWS,
  canonicalEnterpriseView,
  enterprisePathForView,
  enterpriseRedirectLocation,
  enterpriseRouteAccess,
} from "./enterpriseRouteContract";
import { useNavGroupsWithCounts } from "./useNavGroupsWithCounts";
import { useFlag } from "../hooks/useFlag";
import { Breadcrumbs } from "../components/factory/Breadcrumbs";
import { useHarnessAnimation } from "../components/schematic/useHarnessAnimation";
import { cn } from "../lib/utils";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  canonicalMissionLocation,
  isCanonicalMissionDetail,
  missionIdFromLocation,
} from "../eos/missionRoutes";

const ROUTE_PREFIX = "/v2";
const COMPACT_SHELL_QUERY = "(max-width: 899px)";

export function viewFromPath(
  pathname: string,
  validViews: string[],
  search = ""
): MainView | null {
  if (!pathname.startsWith(`${ROUTE_PREFIX}/`)) return null;
  if (
    missionIdFromLocation(pathname, search) &&
    validViews.includes("mission-detail")
  ) {
    return "mission-detail";
  }
  const candidate = pathname.slice(ROUTE_PREFIX.length + 1).split("/")[0];
  return validViews.includes(candidate) ? (candidate as MainView) : null;
}

export function shouldDeferRouteWrite(
  pathname: string,
  validViews: string[],
  activeView: MainView,
  search = ""
): boolean {
  const pathView = viewFromPath(pathname, validViews, search);
  if (pathname.startsWith(`${ROUTE_PREFIX}/`) && pathView === null) {
    return true;
  }
  return pathView !== null && pathView !== activeView;
}

export function initialViewFromLocation(
  pathname: string,
  validViews: string[],
  persistedView: MainView | null,
  search = ""
): MainView {
  const requestedView = viewFromPath(pathname, validViews, search);
  if (requestedView) {
    return canonicalEnterpriseView(requestedView) ?? "command-center";
  }
  if (persistedView) {
    return canonicalEnterpriseView(persistedView) ?? "command-center";
  }
  return "command-center";
}

interface AppShellV2Props {
  activeView: MainView;
  onNavigate: (view: MainView) => void;
  workspaceSwitcher: ReactNode;
  companySwitcher?: ReactNode;
  onOpenSearch: () => void;
  pendingApprovals: number;
  onOpenApprovals: () => void;
  headerActions?: ReactNode;
  footer?: ReactNode;
  projectId?: Id<"projects"> | null;
  children: ReactNode;
}

/**
 * Software Factory shell: resizable nav | main | chat dock (waku-agent 3-column).
 */
export function AppShellV2({
  activeView,
  onNavigate,
  workspaceSwitcher,
  companySwitcher,
  onOpenSearch,
  pendingApprovals,
  onOpenApprovals,
  headerActions,
  footer,
  projectId,
  children,
}: AppShellV2Props): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const syncingFromUrl = useRef(false);
  const [compactShell, setCompactShell] = useState(() =>
    typeof window !== "undefined" && window.matchMedia(COMPACT_SHELL_QUERY).matches
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileDockOpen, setMobileDockOpen] = useState(false);

  const columns = useResizableColumns();
  const { statusLabel } = useHarnessAnimation(projectId ?? undefined);

  const showPreviewRoutes = useFlag("ui.navigation.previews");
  const showLabsRoutes = useFlag("ui.navigation.demo-routes");
  const filteredGroups = filterNavGroups(ENTERPRISE_NAV_GROUPS, {
    enforceRouteCapabilities: true,
    showPreviewRoutes,
    showDemoRoutes: showLabsRoutes,
  });
  const navGroups = useNavGroupsWithCounts(filteredGroups, projectId);
  const validViews = ENTERPRISE_ROUTE_VIEWS;
  const group =
    navGroups.find((g) => g.items.some((i) => i.view === activeView)) ??
    ENTERPRISE_NAV_GROUPS.find((g) => g.items.some((i) => i.view === activeView)) ??
    groupForView(activeView);
  const item =
    navGroups.flatMap((g) => g.items).find((i) => i.view === activeView) ??
    itemForView(activeView);
  const crumbs = [
    ...(group ? [{ label: group.label }] : []),
    ...(item ? [{ label: item.label, current: true }] : []),
  ];
  const activeRouteBadge = routeBadge(activeView);

  useEffect(() => {
    const normalizedMission = canonicalMissionLocation(
      location.pathname,
      location.search
    );
    if (normalizedMission) {
      navigate(normalizedMission, { replace: true });
      return;
    }
    const pathView = viewFromPath(location.pathname, validViews, location.search);
    if (!pathView && location.pathname.startsWith(`${ROUTE_PREFIX}/`)) {
      const source = location.pathname.slice(ROUTE_PREFIX.length + 1).split("/")[0] || "unknown";
      onNavigate("command-center");
      navigate(
        enterpriseRedirectLocation("command-center", location.search, source, "unknown"),
        { replace: true }
      );
      return;
    }
    if (!pathView) return;

    const access = enterpriseRouteAccess(pathView, {
      showPreviewRoutes,
      showLabsRoutes,
    });
    if (access.status === "redirect") {
      const destinationAccess = enterpriseRouteAccess(access.view, {
        showPreviewRoutes,
        showLabsRoutes,
      });
      const destination = destinationAccess.status === "admitted"
        ? access.view
        : "command-center";
      onNavigate(destination);
      navigate(
        enterpriseRedirectLocation(destination, location.search, pathView, access.reason),
        { replace: true }
      );
      return;
    }
    if (access.status === "unavailable") {
      onNavigate("command-center");
      navigate(
        enterpriseRedirectLocation("command-center", location.search, pathView, access.reason),
        { replace: true }
      );
      return;
    }
    if (pathView !== activeView) {
      syncingFromUrl.current = true;
      onNavigate(pathView);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    location.pathname,
    location.search,
    showLabsRoutes,
    showPreviewRoutes,
    validViews.join(","),
  ]);

  useEffect(() => {
    // Let the URL → state effect settle before writing state back to the URL.
    // Without this guard a persisted view can replace a direct deep link on
    // initial render (for example /v2/agents becoming /v2/command-center).
    if (canonicalMissionLocation(location.pathname, location.search)) {
      return;
    }
    if (shouldDeferRouteWrite(location.pathname, validViews, activeView, location.search)) {
      return;
    }
    const access = enterpriseRouteAccess(activeView, {
      showPreviewRoutes,
      showLabsRoutes,
    });
    if (access.status === "redirect") {
      const destinationAccess = enterpriseRouteAccess(access.view, {
        showPreviewRoutes,
        showLabsRoutes,
      });
      const destination = destinationAccess.status === "admitted"
        ? access.view
        : "command-center";
      onNavigate(destination);
      navigate(
        enterpriseRedirectLocation(destination, location.search, activeView, access.reason),
        { replace: true }
      );
      return;
    }
    if (access.status === "unavailable") {
      onNavigate("command-center");
      navigate(
        enterpriseRedirectLocation("command-center", location.search, activeView, access.reason),
        { replace: true }
      );
      return;
    }
    if (syncingFromUrl.current) {
      syncingFromUrl.current = false;
      return;
    }
    const isAutomationDetail = activeView === "automations"
      && location.pathname.startsWith(`${ROUTE_PREFIX}/automations/`);
    const isAutomationRunDetail = activeView === "automation-runs"
      && location.pathname.startsWith(`${ROUTE_PREFIX}/automation-runs/`);
    if (isAutomationDetail || isAutomationRunDetail) return;
    const expected =
      activeView === "mission-detail" && isCanonicalMissionDetail(location.pathname)
        ? location.pathname
        : enterprisePathForView(activeView);
    if (location.pathname !== expected) {
      navigate({ pathname: expected, search: location.search }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeView,
    location.pathname,
    location.search,
    showLabsRoutes,
    showPreviewRoutes,
  ]);

  useEffect(() => {
    document.body.classList.toggle("shell-resizing", columns.resizing);
    return () => document.body.classList.remove("shell-resizing");
  }, [columns.resizing]);

  useEffect(() => {
    const media = window.matchMedia(COMPACT_SHELL_QUERY);
    const sync = (event: MediaQueryListEvent | MediaQueryList) => {
      setCompactShell(event.matches);
      if (!event.matches) {
        setMobileNavOpen(false);
        setMobileDockOpen(false);
      }
    };

    sync(media);
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const navigateFromSidebar = (view: MainView) => {
    onNavigate(view);
    const expected = `${ROUTE_PREFIX}/${view}`;
    if (location.pathname !== expected) {
      navigate({ pathname: expected, search: location.search });
    }
    setMobileNavOpen(false);
  };

  const archStatus = statusLabel ? (
    <>
      <span className="schematic-live-dot" aria-hidden />
      {statusLabel}
    </>
  ) : null;

  return (
    <div className="shell-v2 flex h-screen overflow-hidden">
      {compactShell ? (
        mobileNavOpen ? (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-black/65"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="relative z-10 h-full w-[min(86vw,320px)] shadow-2xl">
              <Sidebar
                width={Math.min(columns.navWidth, 320)}
                groups={navGroups}
                activeView={activeView}
                onNavigate={navigateFromSidebar}
                onOpenSearch={() => {
                  setMobileNavOpen(false);
                  onOpenSearch();
                }}
                workspaceSwitcher={workspaceSwitcher}
                companySwitcher={companySwitcher}
                footer={footer}
                onHide={() => setMobileNavOpen(false)}
              />
            </div>
          </div>
        ) : null
      ) : !columns.navHidden ? (
        <>
          <Sidebar
            width={columns.navWidth}
            groups={navGroups}
            activeView={activeView}
            onNavigate={navigateFromSidebar}
            onOpenSearch={onOpenSearch}
            workspaceSwitcher={workspaceSwitcher}
            companySwitcher={companySwitcher}
            footer={footer}
            onHide={() => columns.setNavHidden(true)}
          />
          <ResizerHandle
            onResize={columns.onNavResize}
            onBegin={columns.beginResize}
            onEnd={columns.endResize}
            title="Drag to resize sidebar"
          />
        </>
      ) : (
        <button
          type="button"
          onClick={() => columns.setNavHidden(false)}
          className="fixed left-3 top-3 z-30 flex h-[30px] w-[34px] items-center justify-center rounded-lg border border-line bg-surface-1 text-ink-secondary shadow-sm hover:text-ink"
          title="Show sidebar"
          aria-label="Show sidebar"
        >
          <Menu size={16} aria-hidden />
        </button>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-line bg-app px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            {compactShell ? (
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-1 text-ink-secondary hover:text-ink"
                aria-label="Open navigation"
                aria-expanded={mobileNavOpen}
              >
                <Menu size={16} aria-hidden />
              </button>
            ) : null}
            <div className="min-w-0 overflow-hidden">
              <Breadcrumbs items={crumbs} />
            </div>
            {activeRouteBadge ? (
              <span
                data-route-badge={activeRouteBadge.toLowerCase()}
                className="shrink-0 rounded border border-line bg-surface-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-ink-secondary"
              >
                {activeRouteBadge}
              </span>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerActions}
            {compactShell ? (
              <button
                type="button"
                onClick={() => setMobileDockOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface-1 text-ink-secondary hover:text-ink"
                aria-label="Open chat"
                aria-expanded={mobileDockOpen}
              >
                <MessageSquare size={14} aria-hidden />
              </button>
            ) : null}
            <button
              type="button"
              onClick={onOpenApprovals}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12.5px] transition-colors duration-150",
                pendingApprovals > 0
                  ? "border-line-strong bg-warn-soft text-warn"
                  : "border-line text-ink-muted hover:text-ink-secondary"
              )}
              aria-label={
                pendingApprovals > 0
                  ? `${pendingApprovals} pending approval${pendingApprovals === 1 ? "" : "s"}`
                  : "Open approvals"
              }
            >
              <BellRing size={13} aria-hidden />
              {compactShell
                ? pendingApprovals || null
                : pendingApprovals > 0
                  ? `${pendingApprovals} approval${pendingApprovals === 1 ? "" : "s"}`
                  : "Approvals"}
            </button>
          </div>
        </header>
        <main className="flex min-h-0 flex-1 overflow-hidden bg-app">
          <div className="shell-main factory-page min-h-0 min-w-0 flex-1 overflow-y-auto">
            {children}
          </div>
          {!compactShell && !columns.dockClosed ? (
            <>
              <ResizerHandle
                onResize={columns.onDockResize}
                onBegin={columns.beginResize}
                onEnd={columns.endResize}
                title="Drag to resize chat"
              />
              <ChatDock
                width={columns.dockWidth}
                onClose={() => columns.setDockClosed(true)}
                projectId={projectId}
                archStatus={archStatus}
                onNavigate={onNavigate}
              />
            </>
          ) : !compactShell ? (
            <button
              type="button"
              onClick={() => columns.setDockClosed(false)}
              className="fixed right-3 top-14 z-30 flex items-center gap-1 rounded-lg border border-line bg-surface-1 px-3 py-1.5 text-[12px] text-ink-secondary shadow-sm hover:text-ink"
              title="Open chat"
              aria-label="Open chat"
            >
              <MessageSquare size={14} aria-hidden />
              Chat
            </button>
          ) : null}
        </main>
      </div>

      {compactShell && mobileDockOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close chat"
            className="absolute inset-0 bg-black/65"
            onClick={() => setMobileDockOpen(false)}
          />
          <div className="relative z-10 h-full w-full max-w-[440px] shadow-2xl">
            <ChatDock
              width="100%"
              onClose={() => setMobileDockOpen(false)}
              projectId={projectId}
              archStatus={archStatus}
              onNavigate={(view) => {
                setMobileDockOpen(false);
                onNavigate(view);
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
