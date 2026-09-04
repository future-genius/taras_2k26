import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('TARAS 2K26 Uncaught Component Exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-lg w-full p-8 rounded-3xl bg-[#0a0c10] border-2 border-[#b91c1c] shadow-[0_0_50px_rgba(185,28,28,0.3)] space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-[#1a0000] border-2 border-[#b91c1c] text-[#b91c1c] flex items-center justify-center mx-auto shadow-lg">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-[#b91c1c] uppercase tracking-widest block">
                SYSTEM EXCEPTION CAUGHT
              </span>
              <h2 className="text-xl font-black text-white font-mono uppercase tracking-tight">
                An Unexpected Error Occurred
              </h2>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                The application encountered an unhandled interface exception. Your data and session in Firestore remain secure.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-[#1a0000]/60 rounded-xl border border-[#b91c1c]/40 text-left overflow-x-auto max-h-32">
                <p className="text-[11px] font-mono text-rose-300 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white font-mono text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0f1117] hover:bg-white/10 text-slate-300 font-mono text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
