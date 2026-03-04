"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import LaunchSplash from "@/components/LaunchSplash";

type Props = { children: React.ReactNode };

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (window.navigator as any).standalone === true || window.matchMedia?.("(display-mode: standalone)").matches === true;
}

function isDesktop(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(min-width: 1024px)").matches === true;
}

export default function AppShell({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [showBoot, setShowBoot] = useState(false);

  useEffect(() => {
    const shouldBoot = isStandalone() || isDesktop();
    setShowBoot(shouldBoot);
  }, []);

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      {/* Global top-left hamburger */}
      <button
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="fixed z-[10000] left-3 top-3 md:left-4 md:top-4 px-3 py-2 rounded-xl border border-white/10 bg-black/40 backdrop-blur"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 8px)" as any }}
      >
        ☰
      </button>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-[9999]">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-0 h-full w-[82%] max-w-[320px] bg-black/70 backdrop-blur border-r border-white/10 p-4"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" as any }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold tracking-widest text-[#FFD90F]">SPRINGFIELD</div>
              <button className="px-2 py-1 rounded-lg border border-white/10" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>
            <nav className="space-y-2">
              <Link className="block px-3 py-2 rounded-xl bg-white/5 border border-white/10" href="/" onClick={() => setOpen(false)}>
                Mission Control
              </Link>
              <Link className="block px-3 py-2 rounded-xl bg-white/5 border border-white/10" href="/kanban" onClick={() => setOpen(false)}>
                Kanban
              </Link>
              <a className="block px-3 py-2 rounded-xl bg-white/5 border border-white/10 opacity-70" href="#" onClick={(e) => e.preventDefault()}>
                Team (soon)
              </a>
              <a className="block px-3 py-2 rounded-xl bg-white/5 border border-white/10 opacity-70" href="#" onClick={(e) => e.preventDefault()}>
                Relay Chat (soon)
              </a>
            </nav>
            <div className="mt-6 text-xs text-white/60">Tip: This menu is now global (all routes).</div>
          </div>
        </div>
      )}

      {/* Boot overlay: global (standalone + desktop) */}
      {showBoot ? <LaunchSplash /> : null}

      {/* Route content */}
      <div className="pt-16">{children}</div>
    </div>
  );
}
