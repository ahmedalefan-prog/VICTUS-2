"use client";

import { useState, useCallback, useEffect } from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
}

const listeners = new Set<(state: ToastState) => void>();
let memoryState: ToastState = { toasts: [] };

function dispatch(toast: Omit<Toast, "id">) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const t: Toast = { ...toast, id };
  memoryState = { toasts: [...memoryState.toasts, t] };
  listeners.forEach((fn) => fn(memoryState));

  const duration = toast.duration ?? 5000;
  if (duration > 0) {
    setTimeout(() => dismiss(id), duration);
  }
  return id;
}

function dismiss(id: string) {
  memoryState = { toasts: memoryState.toasts.filter((t) => t.id !== id) };
  listeners.forEach((fn) => fn(memoryState));
}

export function toast(toast: Omit<Toast, "id">) {
  return dispatch(toast);
}

export function useToast() {
  const [state, setState] = useState(memoryState);

  useEffect(() => {
    listeners.add(setState);
    return () => { listeners.delete(setState); };
  }, []);

  const notify = useCallback((t: Omit<Toast, "id">) => dispatch(t), []);
  const close = useCallback((id: string) => dismiss(id), []);

  return { toasts: state.toasts, toast: notify, dismiss: close };
}
