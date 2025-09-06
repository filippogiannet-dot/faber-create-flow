export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  projectId?: string;
  timestamp: Date;
}

export interface ErrorReport {
  id: string;
  type: 'generation' | 'validation' | 'preview' | 'api' | 'ui';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  context: ErrorContext;
  stack?: string;
  resolved: boolean;
}

class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errors: ErrorReport[] = [];

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  reportError(
    type: ErrorReport['type'],
    severity: ErrorReport['severity'],
    message: string,
    context: Partial<ErrorContext> = {},
    error?: Error
  ): string {
    const errorId = crypto.randomUUID();
    
    const errorReport: ErrorReport = {
      id: errorId,
      type,
      severity,
      message,
      context: {
        timestamp: new Date(),
        ...context
      },
      stack: error?.stack,
      resolved: false
    };

    this.errors.push(errorReport);
    
    // Log to console with appropriate level
    const logLevel = severity === 'critical' ? 'error' : severity === 'high' ? 'error' : 'warn';
    console[logLevel](`[${type.toUpperCase()}] ${message}`, {
      errorId,
      context,
      stack: error?.stack
    });

    // Send to monitoring service (placeholder)
    this.sendToMonitoring(errorReport);

    return errorId;
  }

  private async sendToMonitoring(error: ErrorReport) {
    try {
      // In production, send to monitoring service like Sentry
      console.log('📊 Error reported to monitoring:', error.id);
    } catch (e) {
      console.error('Failed to send error to monitoring:', e);
    }
  }

  getErrors(type?: ErrorReport['type']): ErrorReport[] {
    return type 
      ? this.errors.filter(e => e.type === type)
      : this.errors;
  }

  resolveError(errorId: string): boolean {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      return true;
    }
    return false;
  }

  clearErrors(): void {
    this.errors = [];
  }

  // User-friendly error messages
  getUserFriendlyMessage(error: ErrorReport): string {
    const messages = {
      generation: {
        low: "Si è verificato un piccolo problema durante la generazione. Riprova.",
        medium: "La generazione ha incontrato alcuni problemi. Controlla il prompt e riprova.",
        high: "Errore durante la generazione del codice. Il servizio potrebbe essere temporaneamente non disponibile.",
        critical: "Errore critico nel sistema di generazione. Contatta il supporto."
      },
      validation: {
        low: "Il codice generato ha alcuni warning minori.",
        medium: "Il codice generato necessita di alcune correzioni.",
        high: "Il codice generato contiene errori che potrebbero causare problemi.",
        critical: "Il codice generato non è valido e non può essere utilizzato."
      },
      preview: {
        low: "La preview ha alcuni warning minori.",
        medium: "Problema nel caricamento della preview. Riprova.",
        high: "Errore nella preview. Il codice potrebbe avere problemi di sintassi.",
        critical: "Impossibile caricare la preview. Errore critico nel codice."
      },
      api: {
        low: "Problema temporaneo con l'API.",
        medium: "Errore di connessione. Controlla la tua connessione internet.",
        high: "Servizio temporaneamente non disponibile. Riprova tra qualche minuto.",
        critical: "Errore critico del servizio. Contatta il supporto."
      },
      ui: {
        low: "Problema minore nell'interfaccia utente.",
        medium: "Errore nell'interfaccia. Ricarica la pagina.",
        high: "Problema nell'interfaccia utente. Ricarica l'applicazione.",
        critical: "Errore critico nell'interfaccia. Contatta il supporto."
      }
    };

    return messages[error.type]?.[error.severity] || error.message;
  }
}

export const errorHandler = ErrorHandlingService.getInstance();

// Global error handler setup
export function setupGlobalErrorHandling() {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.reportError(
      'ui',
      'high',
      `Unhandled promise rejection: ${event.reason}`,
      { component: 'global' },
      event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    );
  });

  // Catch JavaScript errors
  window.addEventListener('error', (event) => {
    errorHandler.reportError(
      'ui',
      'medium',
      `JavaScript error: ${event.message}`,
      { 
        component: 'global',
        action: 'script_error'
      },
      event.error
    );
  });
}