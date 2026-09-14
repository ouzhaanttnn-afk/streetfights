import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("TradeUp 3D Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400 mb-4 text-2xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-white">Bir Yükleme Hatası Oluştu</h2>
          <p className="text-xs text-neutral-400 max-w-md mt-2 font-mono">
            {this.state.error?.message || "Bilinmeyen bir hata"}
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="mt-6 px-6 py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-sm cursor-pointer hover:bg-amber-400"
          >
            Önbelleği Temizle & Yeniden Başlat
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
