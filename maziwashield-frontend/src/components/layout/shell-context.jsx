"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const ShellContext = createContext(null);

export function ShellProvider({ children }) {
  const handlers = useRef(new Map());
  const [moreOpen, setMoreOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const register = useCallback((name, fn) => {
    handlers.current.set(name, fn);
    return () => {
      if (handlers.current.get(name) === fn) handlers.current.delete(name);
    };
  }, []);
  const trigger = useCallback((name) => handlers.current.get(name)?.(), []);

  const value = useMemo(
    () => ({ moreOpen, setMoreOpen, collapsed, setCollapsed, register, trigger }),
    [moreOpen, collapsed, register, trigger]
  );
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside <ShellProvider>");
  return ctx;
}

/** A page registers the handler for the header action button, e.g. useShellAction("add-farm", () => setOpen(true)) */
export function useShellAction(name, fn) {
  const { register } = useShell();
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => register(name, () => ref.current()), [name, register]);
}