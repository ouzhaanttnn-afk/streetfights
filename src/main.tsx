import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Fonts ship with the app (no request to Google at launch; same look offline)
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import './index.css';
import { ui } from './i18n/ui';
import type { Language } from './i18n/translations';

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
    console.error('Street Striker error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Uses the saved language if there is one; never deletes the save (a reload is enough in almost every case)
      let lang: Language = 'en';
      try {
        lang = (JSON.parse(localStorage.getItem('street_striker_rpg_save_v2') || '{}').lang as Language) || 'en';
      } catch {
        // unreadable save: keep English
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400 mb-4 text-2xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-white">{ui(lang, 'crash_title')}</h2>
          <p className="text-sm text-neutral-300 max-w-md mt-2">{ui(lang, 'crash_body')}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 min-h-11 px-6 rounded-xl bg-amber-500 text-neutral-950 font-bold text-sm cursor-pointer hover:bg-amber-400"
          >
            {ui(lang, 'crash_reload')}
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
