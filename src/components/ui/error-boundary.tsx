"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Ripple } from "@/components/ui/ripple";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-danger/30 bg-danger/5 px-6 py-14 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger">
            <AlertTriangle className="h-7 w-7" />
          </span>
          <h3 className="text-lg font-semibold text-fg">حدث خطأ غير متوقع</h3>
          <p className="mt-1.5 max-w-sm text-sm text-fg-muted">
            {this.state.error?.message || "تعذر تحميل هذا القسم"}
          </p>
          <Ripple className="inline-flex rounded-lg">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-[var(--primary-fg)] hover:bg-primary-strong transition-colors"
            >
              <RefreshCw className="h-4 w-4" /> إعادة المحاولة
            </button>
          </Ripple>
        </div>
      );
    }
    return this.props.children;
  }
}
