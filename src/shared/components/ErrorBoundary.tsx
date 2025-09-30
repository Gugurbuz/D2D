import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
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

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="text-center max-w-md">
            <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Bir şeyler ters gitti
            </h1>
            <p className="text-gray-600 mb-6">
              Uygulama beklenmeyen bir hatayla karşılaştı. 
              Sayfayı yeniden yükleyerek sorunu çözmeyi deneyebilirsiniz.
            </p>
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-[#0099CB] text-white px-4 py-2 rounded-lg hover:bg-[#0088B8] transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Tekrar Dene
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Sayfayı Yenile
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Teknik Detaylar
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                  {this.state.error.stack}
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

export default ErrorBoundary;