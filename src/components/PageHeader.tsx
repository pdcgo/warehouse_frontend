import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { Crumb } from "../nav";

// What a page may override about the centralized top-bar chrome. Everything is optional:
// breadcrumb + title default to the route (see breadcrumbFor/pageTitle in nav.ts), and a
// page only sets `back` to opt into the back button (detail/sub-pages).
export interface PageHeaderOverride {
  title?: string;
  breadcrumb?: Crumb[];
  back?: { to?: string; label?: string };
}

interface PageHeaderContextValue {
  override: PageHeaderOverride;
  setOverride: (o: PageHeaderOverride | null) => void;
  actionsSlot: HTMLElement | null;
  setActionsSlot: (el: HTMLElement | null) => void;
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

// Wraps the top bar and the routed page (<Outlet>) so a child page can register its chrome
// and inject action buttons into the bar's slot. Only one page is mounted at a time, so a
// single override slot is enough.
export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [override, setOverrideState] = useState<PageHeaderOverride>({});
  const [actionsSlot, setActionsSlot] = useState<HTMLElement | null>(null);

  const setOverride = useCallback(
    (o: PageHeaderOverride | null) => setOverrideState(o ?? {}),
    [],
  );

  return (
    <PageHeaderContext.Provider
      value={{ override, setOverride, actionsSlot, setActionsSlot }}
    >
      {children}
    </PageHeaderContext.Provider>
  );
}

function usePageHeaderContext(): PageHeaderContextValue {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) throw new Error("PageHeader must be used within a PageHeaderProvider");
  return ctx;
}

// Read access for the top bar (Layout): the active override + the actions-slot ref setter.
export function usePageHeaderState() {
  return usePageHeaderContext();
}

// Page-facing API. Render at the top of a page to push chrome up to the top bar:
//   <PageHeader>            -> just inject action buttons (breadcrumb/title from route)
//   <PageHeader back={{ to }} title="…" breadcrumb={[…]} >  -> detail/sub-page overrides
// `children` are the action buttons; they portal into the bar and stay live/reactive.
export function PageHeader({
  title,
  breadcrumb,
  back,
  children,
}: {
  title?: string;
  breadcrumb?: Crumb[];
  back?: { to?: string; label?: string };
  children?: ReactNode;
}) {
  const { setOverride, actionsSlot } = usePageHeaderContext();

  const breadcrumbKey = breadcrumb ? JSON.stringify(breadcrumb) : "";
  useEffect(() => {
    setOverride({ title, breadcrumb, back });
    return () => setOverride(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setOverride, title, back?.to, back?.label, breadcrumbKey]);

  return actionsSlot && children ? createPortal(children, actionsSlot) : null;
}
