import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupGlobalErrorHandling } from '@/services/errorHandling'

// Setup global error handling
setupGlobalErrorHandling();

createRoot(document.getElementById("root")!).render(<App />);
