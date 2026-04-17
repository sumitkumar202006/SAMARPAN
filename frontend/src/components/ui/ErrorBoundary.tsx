'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

/**
 * Global Error Boundary
 * Catches React render errors and shows a recovery UI instead of a blank screen.
 * Wraps critical play surfaces and root layout.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log for debugging — replace with a real error reporting service (Sentry etc.) in production
    console.error('[ErrorBoundary] Caught render error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: '' });
    this.props.onReset?.();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="max-w-md w-full space-y-8">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto rounded-[24px] bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle size={36} className="text-red-400" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                Arena System Error
              </h2>
              <p className="text-sm text-text-soft leading-relaxed">
                Something went wrong rendering this component. Your session data is safe.
              </p>
            </div>

            {/* Error detail (development only) */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <div className="text-left bg-red-500/5 border border-red-500/10 rounded-2xl p-4">
                <p className="text-[10px] font-mono text-red-400/80 break-all leading-relaxed">
                  {this.state.errorInfo}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-accent text-white font-bold text-sm uppercase tracking-wider hover:bg-accent/80 transition-all"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="flex-1 flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm uppercase tracking-wider hover:bg-white/10 transition-all"
              >
                <Home size={16} />
                Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for simpler usage patterns
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedWithBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
