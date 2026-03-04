"use client";
import { useEffect, useRef, useState } from "react";
import LaunchSplash from "@/components/LaunchSplash";
import { useAuth } from "@/components/AuthProvider";
import AppDrawer from "@/components/AppDrawer";

type Props = { children: React.ReactNode; isAuthed?: boolean; onBootComplete?: () => void };

export default function AppShell({ children, isAuthed: isAuthedProp, onBootComplete }: Props) {
  const [open, setOpen] = useState(false);
  const [bootDone, setBootDone] = useState(false);
  const { isAuthed: isAuthedCtx } = useAuth();
  const isAuthed = isAuthedProp ?? isAuthedCtx;
  const prevAuthed = useRef(isAuthed);

  useEffect(() => {
    if (!isAuthed) setBootDone(false);
  }, [isAuthed]);

  useEffect(() => {
    prevAuthed.current = isAuthed;
  }, [isAuthed]);

  const shouldBoot = isAuthed && !prevAuthed.current && !bootDone;

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      {isAuthed && (
        <AppDrawer
          isOpen={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          authStamp={String(isAuthed)}
        />
      )}

      {shouldBoot ? (
        <LaunchSplash
          onComplete={() => {
            setBootDone(true);
            onBootComplete?.();
          }}
        />
      ) : null}

      <div className="pt-16">{children}</div>
    </div>
  );
}
