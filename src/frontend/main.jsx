import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import './i18n';
import './styles/globals.css';
import App from './App.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <Toaster
      position="top-right"
      theme="dark"
      toastOptions={{
        style: {
          background: '#1a1a2e',
          border: '1px solid rgba(91, 194, 231, 0.2)',
          color: '#ffffff',
        },
      }}
    />
  </QueryClientProvider>
);
