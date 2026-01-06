import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface StreamingIndicatorProps {
  streamingModels: string[];
  totalModels: number;
}

export function StreamingIndicator({ streamingModels, totalModels }: StreamingIndicatorProps) {
  const completedCount = totalModels - streamingModels.length;
  const progress = totalModels > 0 ? (completedCount / totalModels) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-3 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg"
    >
      <Loader2 className="h-4 w-4 text-primary animate-spin" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-foreground font-medium">
            Streaming responses...
          </span>
          <span className="text-muted-foreground">
            {completedCount}/{totalModels}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Streaming models dots */}
      <div className="flex items-center gap-1">
        {streamingModels.slice(0, 3).map((model, i) => (
          <motion.div
            key={model}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
        {streamingModels.length > 3 && (
          <span className="text-[10px] text-muted-foreground">
            +{streamingModels.length - 3}
          </span>
        )}
      </div>
    </motion.div>
  );
}
