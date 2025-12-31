import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VotingButtonsProps {
  currentVote: 'up' | 'down' | null;
  onVote: (type: 'up' | 'down') => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function VotingButtons({ currentVote, onVote, disabled, size = 'sm' }: VotingButtonsProps) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const buttonSize = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          buttonSize,
          "transition-colors",
          currentVote === 'up' && "bg-green-500/20 text-green-500 hover:bg-green-500/30 hover:text-green-500"
        )}
        onClick={() => onVote('up')}
        disabled={disabled}
        title="Upvote this response"
      >
        <ThumbsUp className={cn(iconSize, currentVote === 'up' && "fill-current")} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          buttonSize,
          "transition-colors",
          currentVote === 'down' && "bg-red-500/20 text-red-500 hover:bg-red-500/30 hover:text-red-500"
        )}
        onClick={() => onVote('down')}
        disabled={disabled}
        title="Downvote this response"
      >
        <ThumbsDown className={cn(iconSize, currentVote === 'down' && "fill-current")} />
      </Button>
    </div>
  );
}
