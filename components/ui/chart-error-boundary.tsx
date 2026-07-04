"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { EmptyState } from "./empty-state";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ChartErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Chart error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <EmptyState message="Unable to render chart" />
        )
      );
    }
    return this.props.children;
  }
}
