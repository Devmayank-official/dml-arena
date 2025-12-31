import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HelpButtonProps {
  onClick: () => void;
}

export function HelpButton({ onClick }: HelpButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          className="h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
        >
          <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="sr-only">Start tour</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>Take a tour</p>
      </TooltipContent>
    </Tooltip>
  );
}
