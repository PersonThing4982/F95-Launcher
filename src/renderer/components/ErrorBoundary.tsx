import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackComponent?: React.ComponentType<{
    error: Error;
    errorInfo: ErrorInfo;
    resetError: () => void;
  }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error details for debugging
    console.group('🚨 Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // Report error to main process for logging
    if (window.f95Api?.system) {
      try {
        // Note: This would need to be implemented in the IPC handlers
        console.log('Error reported to main process:', {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          errorId: this.state.errorId,
        });
      } catch (reportError) {
        console.error('Failed to report error to main process:', reportError);
      }
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorId: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallbackComponent) {
        const FallbackComponent = this.props.fallbackComponent;
        return (
          <FallbackComponent
            error={this.state.error!}
            errorInfo={this.state.errorInfo!}
            resetError={this.resetError}
          />
        );
      }

      // Default error UI
      return (
        <ErrorFallback
          error={this.state.error!}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          isolate={this.props.isolate}
          errorId={this.state.errorId}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo?: ErrorInfo;
  resetError: () => void;
  isolate?: boolean;
  errorId?: string;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  isolate = false,
  errorId,
}) => {
  const handleReloadApp = () => {
    if (window.f95Api?.system) {
      window.location.reload();
    } else {
      resetError();
    }
  };

  const handleGoHome = () => {
    resetError();
    // Could dispatch a navigation event here if router is available
  };

  const copyErrorDetails = () => {
    const errorDetails = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    navigator.clipboard
      .writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        alert('Error details copied to clipboard');
      })
      .catch(() => {
        console.error('Failed to copy error details');
      });
  };

  if (isolate) {
    // Minimal error display for isolated components
    return (
      <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
        <div className="flex items-center gap-2 text-red-400 mb-2">
          <AlertTriangle size={16} />
          <span className="text-sm font-medium">Component Error</span>
        </div>
        <p className="text-red-300 text-xs mb-3">{error.message}</p>
        <button
          onClick={resetError}
          className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Full error page for major errors
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-gray-800 rounded-lg shadow-xl border border-red-500/30">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-600 rounded-full">
              <AlertTriangle className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Something went wrong</h1>
              <p className="text-gray-400 text-sm">
                The application encountered an unexpected error
              </p>
            </div>
          </div>

          <div className="bg-gray-900 rounded p-3 mb-4">
            <p className="text-red-400 text-sm font-mono break-words">{error.message}</p>
            {errorId && <p className="text-gray-500 text-xs mt-2">Error ID: {errorId}</p>}
          </div>

          <div className="space-y-3">
            <div className="flex gap-3">
              <button
                onClick={resetError}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
              <button
                onClick={handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
              >
                <Home size={16} />
                Go Home
              </button>
            </div>

            <button
              onClick={handleReloadApp}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
            >
              Reload Application
            </button>

            <details className="mt-4">
              <summary className="text-gray-400 text-sm cursor-pointer hover:text-gray-300">
                Show technical details
              </summary>
              <div className="mt-2 p-3 bg-gray-900 rounded text-xs">
                <div className="mb-2">
                  <span className="text-gray-400">Stack trace:</span>
                  <pre className="text-red-400 font-mono mt-1 whitespace-pre-wrap break-words">
                    {error.stack}
                  </pre>
                </div>
                {errorInfo?.componentStack && (
                  <div>
                    <span className="text-gray-400">Component stack:</span>
                    <pre className="text-yellow-400 font-mono mt-1 whitespace-pre-wrap break-words">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
                <button
                  onClick={copyErrorDetails}
                  className="mt-3 text-blue-400 hover:text-blue-300 text-xs underline"
                >
                  Copy error details
                </button>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>,
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

export default ErrorBoundary;
