import { AI_MODELS, AIModel } from '@/lib/models';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Check, Info, Lock } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSubscription, FREE_PLAN_LIMITS } from '@/hooks/useSubscription';
import { Badge } from '@/components/ui/badge';

interface ModelSelectorProps {
  selectedModels: string[];
  onToggleModel: (modelId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function ModelSelector({ 
  selectedModels, 
  onToggleModel, 
  onSelectAll, 
  onDeselectAll 
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { canUseModel, isPro } = useSubscription();
  
  const openaiModels = AI_MODELS.filter(m => m.provider === 'openai');
  const googleModels = AI_MODELS.filter(m => m.provider === 'google');

  const selectedNames = AI_MODELS
    .filter(m => selectedModels.includes(m.id))
    .map(m => m.name);

  const handleSelectAll = () => {
    if (isPro) {
      onSelectAll();
    } else {
      // Only select free models
      FREE_PLAN_LIMITS.allowedModels.forEach(modelId => {
        if (!selectedModels.includes(modelId)) {
          onToggleModel(modelId);
        }
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">Select Models</h3>
          {!isPro && (
            <Badge variant="secondary" className="text-xs">
              Free: 2 models only
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {selectedModels.length} of {isPro ? AI_MODELS.length : FREE_PLAN_LIMITS.allowedModels.length} selected
        </span>
      </div>

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between h-auto min-h-[44px] py-2 px-4 bg-card border-border hover:bg-secondary/50"
          >
            <div className="flex flex-wrap gap-1 flex-1 text-left">
              {selectedModels.length === 0 ? (
                <span className="text-muted-foreground">Select AI models...</span>
              ) : selectedModels.length === AI_MODELS.length ? (
                <span className="text-foreground">All models selected</span>
              ) : (
                selectedNames.slice(0, 3).map((name, i) => (
                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                    {name}
                  </span>
                ))
              )}
              {selectedNames.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-muted-foreground text-xs">
                  +{selectedNames.length - 3} more
                </span>
              )}
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          className="w-[var(--radix-dropdown-menu-trigger-width)] p-0 bg-card border-border"
          align="start"
        >
          {/* Quick Actions */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/30">
            <span className="text-xs font-medium text-muted-foreground">Quick Actions</span>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Select {isPro ? 'All' : 'Free'}
              </button>
              <span className="text-muted-foreground/30">|</span>
              <button
                onClick={onDeselectAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto p-2 space-y-3">
            {/* OpenAI Models */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">OpenAI</span>
              </div>
              {openaiModels.map((model) => (
                <DropdownModelItem
                  key={model.id}
                  model={model}
                  isSelected={selectedModels.includes(model.id)}
                  onToggle={() => onToggleModel(model.id)}
                  isLocked={!canUseModel(model.id)}
                />
              ))}
            </div>

            {/* Google Models */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Google</span>
              </div>
              {googleModels.map((model) => (
                <DropdownModelItem
                  key={model.id}
                  model={model}
                  isSelected={selectedModels.includes(model.id)}
                  onToggle={() => onToggleModel(model.id)}
                  isLocked={!canUseModel(model.id)}
                />
              ))}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface DropdownModelItemProps {
  model: AIModel;
  isSelected: boolean;
  onToggle: () => void;
  isLocked: boolean;
}

function DropdownModelItem({ model, isSelected, onToggle, isLocked }: DropdownModelItemProps) {
  const providerColor = model.provider === 'openai' ? 'bg-green-500' : 'bg-blue-500';
  
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={isLocked ? undefined : onToggle}
        disabled={isLocked}
        className={cn(
          "flex-1 flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-left",
          isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-secondary/50",
          isSelected && !isLocked && "bg-primary/10"
        )}
      >
        <div className={cn(
          "w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors",
          isLocked ? "border-muted-foreground/30 bg-muted" :
          isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
        )}>
          {isLocked ? (
            <Lock className="h-3 w-3 text-muted-foreground" />
          ) : isSelected ? (
            <Check className="h-3 w-3 text-primary-foreground" />
          ) : null}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{model.name}</p>
            {isLocked && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Pro
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{model.description}</p>
        </div>
      </button>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-1.5 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
              <Info className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[250px]">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", providerColor)} />
                <span className="font-semibold">{model.name}</span>
                {isLocked && <Badge variant="secondary" className="text-[10px]">Pro Only</Badge>}
              </div>
              <p className="text-xs">{model.description}</p>
              <p className="text-xs text-muted-foreground">
                Provider: {model.provider === 'openai' ? 'OpenAI' : 'Google'}
              </p>
              <p className="text-xs text-muted-foreground">
                ID: {model.id}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
