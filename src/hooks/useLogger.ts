 import { useEffect, useRef } from 'react';
 import { useLocation } from 'react-router-dom';
 import { logger, LogCategory } from '@/lib/logger';
 import { useAuth } from './useAuth';
 
 export function useAppLogger() {
   const { user } = useAuth();
   const location = useLocation();
   const prevLocation = useRef(location.pathname);
 
   // Set user ID when it changes
   useEffect(() => {
     logger.setUserId(user?.id || null);
     
     if (user) {
       logger.logAuth('User session active', { userId: user.id, email: user.email });
     }
   }, [user]);
 
   // Log navigation changes
   useEffect(() => {
     if (prevLocation.current !== location.pathname) {
       logger.logNavigation(prevLocation.current, location.pathname);
       prevLocation.current = location.pathname;
     }
   }, [location.pathname]);
 
   return {
     // Re-export all logger methods
     debug: (category: LogCategory, message: string, data?: Record<string, unknown>) => 
       logger.debug(category, message, data),
     info: (category: LogCategory, message: string, data?: Record<string, unknown>) => 
       logger.info(category, message, data),
     warn: (category: LogCategory, message: string, data?: Record<string, unknown>) => 
       logger.warn(category, message, data),
     error: (category: LogCategory, message: string, data?: Record<string, unknown>) => 
       logger.error(category, message, data),
     
     // Specific helpers
     logComparison: logger.logComparison.bind(logger),
     logDebate: logger.logDebate.bind(logger),
     logApiCall: logger.logApiCall.bind(logger),
     logRateLimit: logger.logRateLimit.bind(logger),
     logUserAction: logger.logUserAction.bind(logger),
     logPerformance: logger.logPerformance.bind(logger),
     logError: logger.logError.bind(logger),
     
     // Utilities
     getLogs: logger.getLogs.bind(logger),
     exportLogs: logger.exportLogs.bind(logger),
     clearLogs: logger.clearLogs.bind(logger),
   };
 }