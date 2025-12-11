
import { LogEntry } from '../types';

class LoggerService {
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  constructor() {
    // Load existing logs if needed, but for clinical safety, we usually start fresh or persist per session.
    // For now, in-memory log for the session.
    this.log('Session', 'App Initialized');
  }

  public log(action: string, details: string) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      action,
      details
    };
    this.logs.unshift(entry); // Newest first
    this.notify();
  }

  public getLogs() {
    return this.logs;
  }

  public subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    listener(this.logs);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.logs));
  }

  public downloadLogs() {
    const text = this.logs.map(l => `[${l.timestamp}] ${l.action}: ${l.details}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuroflow-session-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export const logger = new LoggerService();
