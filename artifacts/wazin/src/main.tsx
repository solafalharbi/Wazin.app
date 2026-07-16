import { createRoot } from 'react-dom/client';
import { setAuthTokenGetter } from '@workspace/api-client-react';

import App from './App';

import './index.css';

// Attach the static API token to every outgoing API request.
// The token is embedded at build time via the VITE_API_TOKEN env var.
const apiToken = import.meta.env.VITE_API_TOKEN as string | undefined;
if (apiToken) {
  setAuthTokenGetter(() => apiToken);
}

createRoot(document.getElementById('root')!).render(<App />);
