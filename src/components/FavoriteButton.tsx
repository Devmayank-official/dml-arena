import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: 'sm' | 'default';
  disabled?: boolean;
}

export function FavoriteButton({
  isFavorite,
  onToggle,
  size = 'default',
  disabled = false,
}: FavoriteButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={size === 'sm' ? 'icon' : 'sm'}
            className={cn(
              size === 'sm' ? 'h-7 w-7' : 'h-8 gap-1.5',
              isFavorite && 'text-yellow-500 hover:text-yellow-600'
            )}
            onClick={onToggle}
            disabled={disabled}
          >
            <Star
              className={cn(
                size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
                isFavorite && 'fill-current'
              )}
            />
            {size !== 'sm' && (isFavorite ? 'Saved' : 'Save')}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isFavorite ? 'Remove from favorites' : 'Add to favorites'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
