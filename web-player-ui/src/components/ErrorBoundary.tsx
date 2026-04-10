import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="app">
          <div className="card" style={{ textAlign: 'center', marginTop: '2rem' }}>
            <h2 style={{ color: 'var(--color-damage)', marginBottom: '0.75rem' }}>
              Something went wrong
            </h2>
            <p style={{ marginBottom: '1rem', color: 'var(--color-gray-dark)' }}>
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <button onClick={this.handleReload}>Reload Page</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
