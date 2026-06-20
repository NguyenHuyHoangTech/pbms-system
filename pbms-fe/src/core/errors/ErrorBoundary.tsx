import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
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
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-8 font-sans">
          <div className="max-w-3xl w-full bg-white p-8 rounded-xl shadow-lg border-l-4 border-red-500">
            <h1 className="text-3xl font-bold text-red-600 mb-4">React Application Crash</h1>
            <p className="text-gray-700 mb-6">
              A fatal error occurred during rendering. This is usually caused by an undefined component, a bad import, or a runtime exception in a render method.
            </p>
            
            <div className="bg-gray-100 p-4 rounded-md overflow-x-auto mb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Error Message:</h2>
              <code className="text-red-500 font-mono text-sm">{this.state.error?.toString()}</code>
            </div>

            {this.state.errorInfo && (
              <div className="bg-gray-100 p-4 rounded-md overflow-x-auto mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Component Stack:</h2>
                <pre className="text-gray-600 font-mono text-xs whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
