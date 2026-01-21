import { AI_MODELS, OPENROUTER_MODELS, AIModel, getAllModels, getProviderColor, getProviderName, ModelProvider, PROVIDER_INFO } from '@/lib/models';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Check, Info, Lock, Key } from 'lucide-react';
import { useState, useMemo } from 'react';
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
import { ModelPresetSelector } from '@/components/ModelPresetSelector';

interface ModelSelectorProps {
  selectedModels: string[];
  onToggleModel: (modelId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSetModels?: (models: string[]) => void;
}

export function ModelSelector({ 
  selectedModels, 
  onToggleModel, 
  onSelectAll, 
  onDeselectAll,
  onSetModels,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { canUseModel, isPro } = useSubscription();
  
  // Check if OpenRouter key is configured
  const hasOpenRouterKey = useMemo(() => {
    const keys = localStorage.getItem('apiKeys');
    if (keys) {
      try {
        const parsed = JSON.parse(keys);
        return !!parsed.openrouter;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  const allAvailableModels = useMemo(() => getAllModels(hasOpenRouterKey), [hasOpenRouterKey]);

  // Group models by provider
  const modelsByProvider = useMemo(() => {
    const groups: Record<ModelProvider, AIModel[]> = {
      openai: [],
      google: [],
      anthropic: [],
      meta: [],
      mistral: [],
      deepseek: [],
      qwen: [],
      xai: [],
      zhipu: [],
      moonshot: [],
    };
    
    allAvailableModels.forEach(model => {
      groups[model.provider].push(model);
    });
    
    return groups;
  }, [allAvailableModels]);

  const selectedNames = allAvailableModels
    .filter(m => selectedModels.includes(m.id))
    .map(m => m.name);

  const handleSelectAll = () => {
    if (isPro) {
      onSelectAll();
    } else {
      FREE_PLAN_LIMITS.allowedModels.forEach(modelId => {
        if (!selectedModels.includes(modelId)) {
          onToggleModel(modelId);
        }
      });
    }
  };

  const totalModels = isPro ? allAvailableModels.length : FREE_PLAN_LIMITS.allowedModels.length;

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
          {hasOpenRouterKey && (
            <Badge variant="outline" className="text-xs gap-1">
              <Key className="h-2.5 w-2.5" />
              OpenRouter
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onSetModels && (
            <ModelPresetSelector
              selectedModels={selectedModels}
              onApplyPreset={onSetModels}
            />
          )}
          <span className="text-xs text-muted-foreground">
            {selectedModels.length} of {totalModels}
          </span>
        </div>
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
              ) : selectedModels.length === allAvailableModels.length ? (
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
            {/* Render each provider group */}
            {(Object.keys(PROVIDER_INFO) as ModelProvider[]).map((provider) => {
              const models = modelsByProvider[provider];
              if (models.length === 0) return null;
              
              return (
                <div key={provider} className="space-y-1">
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <div className={cn("w-2 h-2 rounded-full", getProviderColor(provider))} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {getProviderName(provider)}
                    </span>
                    {models[0]?.requiresOpenRouter && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        OpenRouter
                      </Badge>
                    )}
                  </div>
                  {models.map((model) => (
                    <DropdownModelItem
                      key={model.id}
                      model={model}
                      isSelected={selectedModels.includes(model.id)}
                      onToggle={() => onToggleModel(model.id)}
                      isLocked={!canUseModel(model.id)}
                    />
                  ))}
                </div>
              );
            })}

            {/* Show OpenRouter prompt if not configured */}
            {!hasOpenRouterKey && (
              <div className="px-3 py-4 bg-secondary/30 rounded-lg border border-dashed border-border">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Key className="h-4 w-4" />
                  <span className="text-xs">
                    Add your OpenRouter API key in Settings to unlock 20+ more models including Claude, DeepSeek, Grok, and more.
                  </span>
                </div>
              </div>
            )}
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
  const providerColor = getProviderColor(model.provider);
  
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
                Provider: {getProviderName(model.provider)}
              </p>
              <p className="text-xs text-muted-foreground">
                ID: {model.openRouterId}
              </p>
              {model.requiresOpenRouter && (
                <p className="text-xs text-amber-500">
                  Requires OpenRouter API key
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
