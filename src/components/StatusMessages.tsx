import React from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface StatusMessage {
  id: string;
  text: string;
  type: 'loading' | 'success' | 'error';
  timestamp: Date;
}

interface StatusMessagesProps {
  messages: StatusMessage[];
}

export function StatusMessages({ messages }: StatusMessagesProps) {
  if (messages.length === 0) return null;

  return (
    <div className="space-y-2">
      {messages.map((message) => (
        <div
          key={message.id}
          className="flex items-center gap-2 text-sm p-3 rounded-lg bg-card/50 border border-border/50"
        >
          {message.type === 'loading' && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
          {message.type === 'success' && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          {message.type === 'error' && (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          <span className="text-foreground">{message.text}</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export type { StatusMessage };