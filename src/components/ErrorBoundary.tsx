import { Component, type ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'root' | 'route' | 'feature';
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.level ?? 'unknown'}]`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const level = this.props.level ?? 'feature';

    return (
      <div className="flex min-h-[300px] w-full items-center justify-center p-8">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>

          <h2 className="text-xl font-semibold text-foreground">
            {level === 'root'
              ? 'Application Error'
              : level === 'route'
                ? 'Page Error'
                : 'Something went wrong'}
          </h2>

          <p className="text-sm text-muted-foreground">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>

          <div className="flex gap-3">
            <Button variant="outline" onClick={this.handleReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>

            {level !== 'feature' && (
              <Button
                variant="default"
                onClick={() => {
                  window.location.href = '/';
                }}
              >
                <Home className="mr-2 h-4 w-4" />
                Go home
              </Button>
            )}
          </div>

          {import.meta.env.DEV && this.state.error?.stack && (
            <pre className="mt-4 max-h-40 w-full overflow-auto rounded-md bg-muted p-3 text-left text-xs text-muted-foreground">
              {this.state.error.stack}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
