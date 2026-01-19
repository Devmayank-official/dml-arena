import { Star } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface QualityRatingProps {
  rating: number | null;
  onRate: (rating: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function QualityRating({ 
  rating, 
  onRate, 
  disabled = false,
  size = 'sm' 
}: QualityRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  
  const displayRating = hoverRating ?? rating ?? 0;
  const starSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  
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
                  "transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm",
                  !disabled && "hover:scale-110"
                )}
                onMouseEnter={() => !disabled && setHoverRating(star)}
                onClick={() => !disabled && onRate(star)}
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
            <p>Your rating: {ratingLabels[rating - 1]} ({rating}/5)</p>
          ) : (
            <p>Rate this response</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}