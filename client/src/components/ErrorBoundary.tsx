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
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#fee2e2', color: '#991b1b', minHeight: '100vh' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Application Error</h1>
          <p style={{ marginBottom: '16px' }}>Sorry, an unexpected error has occurred in the application.</p>
          {this.state.error && (
            <div style={{ marginBottom: '16px' }}>
              <strong>Error Message:</strong>
              <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#fecaca', padding: '10px', marginTop: '8px', borderRadius: '4px' }}>
                {this.state.error.toString()}
              </pre>
            </div>
          )}
          {this.state.errorInfo && (
            <div>
              <strong>Component Stack:</strong>
              <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#fecaca', padding: '10px', marginTop: '8px', borderRadius: '4px', fontSize: '12px', overflowX: 'auto' }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </div>
          )}
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px', padding: '8px 16px', backgroundColor: '#b91c1c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
