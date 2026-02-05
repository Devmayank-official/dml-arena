 import { supabase } from '@/integrations/supabase/client';
 
 export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
 export type LogCategory = 
   | 'auth'
   | 'navigation'
   | 'comparison'
   | 'debate'
   | 'api'
   | 'rate_limit'
   | 'subscription'
   | 'user_action'
   | 'error'
   | 'performance';
 
 interface LogEntry {
   timestamp: string;
   level: LogLevel;
   category: LogCategory;
   message: string;
   data?: Record<string, unknown>;
   userId?: string;
   sessionId?: string;
 }
 
 interface LoggerConfig {
   minLevel: LogLevel;
   enableConsole: boolean;
   enableRemote: boolean;
   maxLocalLogs: number;
 }
 
 const LOG_LEVELS: Record<LogLevel, number> = {
   debug: 0,
   info: 1,
   warn: 2,
   error: 3,
 };
 
 const LOG_COLORS: Record<LogLevel, string> = {
   debug: '#9ca3af',
   info: '#3b82f6',
   warn: '#f59e0b',
   error: '#ef4444',
 };
 
 const CATEGORY_ICONS: Record<LogCategory, string> = {
   auth: '🔐',
   navigation: '🧭',
   comparison: '⚖️',
   debate: '💬',
   api: '🌐',
   rate_limit: '⏱️',
   subscription: '💳',
   user_action: '👆',
   error: '❌',
   performance: '⚡',
 };
 
 class Logger {
   private config: LoggerConfig = {
     minLevel: import.meta.env.DEV ? 'debug' : 'info',
     enableConsole: true,
     enableRemote: false, // Can be enabled for production
     maxLocalLogs: 500,
   };
 
   private logs: LogEntry[] = [];
   private sessionId: string;
   private userId: string | null = null;
 
   constructor() {
     this.sessionId = this.generateSessionId();
     this.loadLogsFromStorage();
     
     // Clean up old logs on init
     this.cleanupOldLogs();
   }
 
   private generateSessionId(): string {
     return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
   }
 
   private loadLogsFromStorage(): void {
     try {
       const stored = localStorage.getItem('app_logs');
       if (stored) {
         this.logs = JSON.parse(stored);
       }
     } catch {
       this.logs = [];
     }
   }
 
   private saveLogsToStorage(): void {
     try {
       // Keep only the most recent logs
       const recentLogs = this.logs.slice(-this.config.maxLocalLogs);
       localStorage.setItem('app_logs', JSON.stringify(recentLogs));
     } catch {
       // Storage full or unavailable
     }
   }
 
   private cleanupOldLogs(): void {
     const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
     this.logs = this.logs.filter(log => {
       const logTime = new Date(log.timestamp).getTime();
       return logTime > oneDayAgo;
     });
     this.saveLogsToStorage();
   }
 
   setUserId(userId: string | null): void {
     this.userId = userId;
   }
 
   configure(config: Partial<LoggerConfig>): void {
     this.config = { ...this.config, ...config };
   }
 
   private shouldLog(level: LogLevel): boolean {
     return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
   }
 
   private formatMessage(entry: LogEntry): string {
     const icon = CATEGORY_ICONS[entry.category];
     return `${icon} [${entry.category.toUpperCase()}] ${entry.message}`;
   }
 
   private log(
     level: LogLevel,
     category: LogCategory,
     message: string,
     data?: Record<string, unknown>
   ): void {
     if (!this.shouldLog(level)) return;
 
     const entry: LogEntry = {
       timestamp: new Date().toISOString(),
       level,
       category,
       message,
       data,
       userId: this.userId || undefined,
       sessionId: this.sessionId,
     };
 
     // Add to local storage
     this.logs.push(entry);
     this.saveLogsToStorage();
 
     // Console output
     if (this.config.enableConsole) {
       const formattedMessage = this.formatMessage(entry);
       const color = LOG_COLORS[level];
       const style = `color: ${color}; font-weight: bold;`;
 
       switch (level) {
         case 'debug':
           console.debug(`%c${formattedMessage}`, style, data || '');
           break;
         case 'info':
           console.info(`%c${formattedMessage}`, style, data || '');
           break;
         case 'warn':
           console.warn(`%c${formattedMessage}`, style, data || '');
           break;
         case 'error':
           console.error(`%c${formattedMessage}`, style, data || '');
           break;
       }
     }
   }
 
   // Convenience methods
   debug(category: LogCategory, message: string, data?: Record<string, unknown>): void {
     this.log('debug', category, message, data);
   }
 
   info(category: LogCategory, message: string, data?: Record<string, unknown>): void {
     this.log('info', category, message, data);
   }
 
   warn(category: LogCategory, message: string, data?: Record<string, unknown>): void {
     this.log('warn', category, message, data);
   }
 
   error(category: LogCategory, message: string, data?: Record<string, unknown>): void {
     this.log('error', category, message, data);
   }
 
   // Specific logging helpers
   logAuth(action: string, data?: Record<string, unknown>): void {
     this.info('auth', action, data);
   }
 
   logNavigation(from: string, to: string): void {
     this.debug('navigation', `Navigated from ${from} to ${to}`, { from, to });
   }
 
   logComparison(action: string, data?: Record<string, unknown>): void {
     this.info('comparison', action, data);
   }
 
   logDebate(action: string, data?: Record<string, unknown>): void {
     this.info('debate', action, data);
   }
 
   logApiCall(endpoint: string, method: string, status?: number, duration?: number): void {
     const level = status && status >= 400 ? 'error' : 'debug';
     this.log(level, 'api', `${method} ${endpoint}`, { status, duration });
   }
 
   logRateLimit(window: string, usage: number, limit: number, exceeded: boolean): void {
     const level = exceeded ? 'warn' : 'debug';
     this.log(level, 'rate_limit', `Rate limit check: ${window}`, { usage, limit, exceeded });
   }
 
   logSubscription(action: string, plan?: string): void {
     this.info('subscription', action, { plan });
   }
 
   logUserAction(action: string, data?: Record<string, unknown>): void {
     this.debug('user_action', action, data);
   }
 
   logPerformance(metric: string, value: number, unit: string): void {
     this.debug('performance', `${metric}: ${value}${unit}`, { metric, value, unit });
   }
 
   logError(error: Error | string, context?: Record<string, unknown>): void {
     const message = error instanceof Error ? error.message : error;
     const stack = error instanceof Error ? error.stack : undefined;
     this.error('error', message, { ...context, stack });
   }
 
   // Get logs for debugging
   getLogs(options?: {
     level?: LogLevel;
     category?: LogCategory;
     limit?: number;
   }): LogEntry[] {
     let filtered = [...this.logs];
 
     if (options?.level) {
       const minLevel = LOG_LEVELS[options.level];
       filtered = filtered.filter(log => LOG_LEVELS[log.level] >= minLevel);
     }
 
     if (options?.category) {
       filtered = filtered.filter(log => log.category === options.category);
     }
 
     if (options?.limit) {
       filtered = filtered.slice(-options.limit);
     }
 
     return filtered;
   }
 
   // Export logs for debugging
   exportLogs(): string {
     return JSON.stringify(this.logs, null, 2);
   }
 
   // Clear all logs
   clearLogs(): void {
     this.logs = [];
     localStorage.removeItem('app_logs');
   }
 
   // Get session ID for tracking
   getSessionId(): string {
     return this.sessionId;
   }
 }
 
 // Singleton instance
 export const logger = new Logger();
 
 // React hook for using logger
 export function useLogger() {
   return logger;
 }