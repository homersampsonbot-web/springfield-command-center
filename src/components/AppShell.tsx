"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LaunchSplash from "@/components/LaunchSplash";
import { useAuth } from "@/components/AuthProvider";

type Props = { children: React.ReactNode; isAuthed?: boolean; onBootComplete?: () => void };

export default function AppShell({ children, isAuthed: isAuthedProp, onBootComplete }: Props) {
  const [open, setOpen] = useState(false);
  const [bootDone, setBootDone] = useState(false);
  const { isAuthed: isAuthedCtx } = useAuth();
  const isAuthed = isAuthedProp ?? isAuthedCtx;
  const prevAuthed = useRef(isAuthed);

  useEffect(() => {
    // reset boot if user logs out
    if (!isAuthed) setBootDone(false);
  }, [isAuthed]);

  useEffect(() => {
    prevAuthed.current = isAuthed;
  }, [isAuthed]);

  // Only boot when auth transitions false -> true
  const shouldBoot = isAuthed && !prevAuthed.current && !bootDone;

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      {/* Global top-left hamburger */}
      <button
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="fixed z-[110] left-3 top-3 md:left-4 md:top-4 px-3 py-2 rounded-xl border border-white/10 bg-black/40 backdrop-blur"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 8px)" as any }}
      >
        ☰
      </button>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-[90]">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-0 h-full w-[82%] max-w-[320px] bg-black/70 backdrop-blur border-r border-white/10 p-4 z-[100]"
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
              <button className="w-full text-left px-3 py-2 rounded-xl bg-white/5 border border-white/10 opacity-70" disabled>
                Team (soon)
              </button>
              <button className="w-full text-left px-3 py-2 rounded-xl bg-white/5 border border-white/10 opacity-70" disabled>
                Relay Chat (soon)
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Boot overlay: only after auth transition */}
      {shouldBoot ? (
        <LaunchSplash
          onComplete={() => {
            setBootDone(true);
            onBootComplete?.();
          }}
        />
      ) : null}

      {/* Route content */}
      <div className="pt-16">{children}</div>
    </div>
  );
}
