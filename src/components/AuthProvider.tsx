"use client";
import React, { createContext, useContext, useMemo, useState } from "react";

type AuthContextValue = {
  isAuthed: boolean;
  setAuthed: (v: boolean) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthed, setAuthed] = useState(false);
  const value = useMemo(() => ({ isAuthed, setAuthed }), [isAuthed]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
