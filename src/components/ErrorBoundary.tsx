import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Qualcosa è andato storto
            </h2>
            <p className="text-muted-foreground mb-6">
              Si è verificato un errore durante il rendering dell'applicazione.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded-md transition-colors"
              >
                Riprova
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 py-2 px-4 rounded-md transition-colors"
              >
                Ricarica pagina
              </button>
            </div>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-muted-foreground cursor-pointer">
                  Dettagli errore
                </summary>
                <pre className="text-xs text-destructive mt-2 p-3 bg-destructive/10 rounded border overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}