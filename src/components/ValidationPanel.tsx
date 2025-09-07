import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Info, Lightbulb, RefreshCw } from 'lucide-react';

interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    file: string;
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning';
    code?: string;
  }>;
  warnings: Array<{
    file: string;
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning';
    code?: string;
  }>;
  score: number;
  suggestions: string[];
}

interface ValidationPanelProps {
  validationResult: ValidationResult | null;
  onRevalidate?: () => void;
  className?: string;
}

export function ValidationPanel({ validationResult, onRevalidate, className }: ValidationPanelProps) {
  if (!validationResult) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-6 text-center">
          <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Genera del codice per vedere i risultati della validazione
          </p>
        </CardContent>
      </Card>
    );
  }

  const { isValid, errors, warnings, score, suggestions } = validationResult;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {isValid ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            )}
            Validazione Codice
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getScoreBadgeVariant(score)} className="text-sm">
              Score: {Math.round(score)}/100
            </Badge>
            {onRevalidate && (
              <Button size="sm" variant="outline" onClick={onRevalidate}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-destructive">{errors.length}</div>
            <div className="text-xs text-muted-foreground">Errori</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-yellow-600">{warnings.length}</div>
            <div className="text-xs text-muted-foreground">Warning</div>
          </div>
          <div className="space-y-1">
            <div className={`text-2xl font-bold ${getScoreColor(score)}`}>{Math.round(score)}</div>
            <div className="text-xs text-muted-foreground">Qualità</div>
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Errori ({errors.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {errors.slice(0, 5).map((error, index) => (
                <div key={index} className="text-sm bg-destructive/10 border border-destructive/20 rounded p-2">
                  <div className="font-medium text-destructive">{error.file}</div>
                  <div className="text-destructive/80">{error.message}</div>
                  {error.code && (
                    <div className="text-xs text-muted-foreground mt-1">Code: {error.code}</div>
                  )}
                </div>
              ))}
              {errors.length > 5 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{errors.length - 5} altri errori...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-yellow-600 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Warning ({warnings.length})
            </h4>
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {warnings.slice(0, 3).map((warning, index) => (
                <div key={index} className="text-sm bg-yellow-50 border border-yellow-200 rounded p-2">
                  <div className="font-medium text-yellow-700">{warning.file}</div>
                  <div className="text-yellow-600">{warning.message}</div>
                </div>
              ))}
              {warnings.length > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{warnings.length - 3} altri warning...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-primary flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Suggerimenti ({suggestions.length})
            </h4>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <div key={index} className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
                  {suggestion}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success state */}
        {isValid && errors.length === 0 && warnings.length === 0 && (
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-green-600 font-medium">
              Codice validato con successo!
            </p>
            <p className="text-xs text-muted-foreground">
              Tutti i controlli sono passati
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ValidationPanel;