import { RefreshCw, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { AI_MODELS } from '@/lib/models';
import { useState } from 'react';

interface QuickReRunProps {
  lastQuery: string;
  lastModels: string[];
  onReRun: (query: string, models: string[]) => void;
  disabled?: boolean;
}

export function QuickReRun({ lastQuery, lastModels, onReRun, disabled }: QuickReRunProps) {
  const [selectedModels, setSelectedModels] = useState<string[]>(lastModels);

  const handleReRunSame = () => {
    onReRun(lastQuery, lastModels);
  };

  const handleReRunSelected = () => {
    if (selectedModels.length > 0) {
      onReRun(lastQuery, selectedModels);
    }
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  if (!lastQuery) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={disabled}
          data-action="quick-rerun"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Re-run</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleReRunSame}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Re-run with same models
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Select different models
        </DropdownMenuLabel>
        
        {AI_MODELS.map((model) => (
          <DropdownMenuCheckboxItem
            key={model.id}
            checked={selectedModels.includes(model.id)}
            onCheckedChange={() => toggleModel(model.id)}
            onSelect={(e) => e.preventDefault()}
          >
            <span className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  model.provider === 'openai' ? 'bg-green-500' : 'bg-blue-500'
                }`}
              />
              {model.name}
            </span>
          </DropdownMenuCheckboxItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={handleReRunSelected}
          disabled={selectedModels.length === 0}
          className="text-primary"
        >
          <Check className="mr-2 h-4 w-4" />
          Run with {selectedModels.length} selected
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
