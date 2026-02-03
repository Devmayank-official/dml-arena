import { Star } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getModelById } from '@/lib/models';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DebateRoundRatingProps {
  modelId: string;
  rating: number | null;
  onRate: (rating: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function DebateRoundRating({ 
  modelId,
  rating, 
  onRate, 
  disabled = false,
  size = 'sm' 
}: DebateRoundRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const model = getModelById(modelId);
  
  const displayRating = hoverRating ?? rating ?? 0;
  const starSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  
  const ratingLabels = [
    'Poor',
    'Fair', 
    'Good',
    'Very Good',
    'Excellent'
  ];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "flex items-center gap-0.5",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onMouseLeave={() => setHoverRating(null)}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                disabled={disabled}
                className={cn(
                  "transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm p-0.5",
                  !disabled && "hover:scale-125"
                )}
                onMouseEnter={() => !disabled && setHoverRating(star)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) onRate(star);
                }}
              >
                <Star
                  className={cn(
                    starSize,
                    "transition-colors",
                    star <= displayRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/40"
                  )}
                />
              </button>
            ))}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {rating ? (
            <p>Rate {model?.name || modelId}: {ratingLabels[rating - 1]} ({rating}/5)</p>
          ) : (
            <p>Rate this {model?.name || modelId} response</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
