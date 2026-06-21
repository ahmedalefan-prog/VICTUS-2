"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface UseIntersectionOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export function useIntersectionObserver({
  threshold = 0,
  rootMargin = "100px",
  once = true,
}: UseIntersectionOptions = {}) {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const callbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        ([e]) => {
          setEntry(e);
          setIsIntersecting(e.isIntersecting);
          if (e.isIntersecting && once && observerRef.current) {
            observerRef.current.disconnect();
          }
        },
        { threshold, rootMargin },
      );
      observerRef.current.observe(node);
      targetRef.current = node;
    },
    [threshold, rootMargin, once],
  );

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  return { ref: callbackRef, entry, isIntersecting };
}
