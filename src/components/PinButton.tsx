import { Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface PinButtonProps {
  isPinned: boolean;
  onPin: () => void;
  onUnpin: () => void;
  size?: 'sm' | 'default';
  className?: string;
}

export function PinButton({ isPinned, onPin, onUnpin, size = 'sm', className }: PinButtonProps) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isPinned ? 'secondary' : 'ghost'}
          size="icon"
          className={cn(
            size === 'sm' ? 'h-7 w-7' : 'h-8 w-8',
            isPinned && 'text-primary',
            className
          )}
          onClick={isPinned ? onUnpin : onPin}
        >
          {isPinned ? (
            <PinOff className={iconSize} />
          ) : (
            <Pin className={iconSize} />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isPinned ? 'Unpin response' : 'Pin response'}
      </TooltipContent>
    </Tooltip>
  );
}
