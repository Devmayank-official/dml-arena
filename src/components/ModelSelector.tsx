import { 
  AI_MODELS, 
  OPENROUTER_MODELS, 
  AIModel, 
  getAllModels, 
  getProviderColor, 
  getProviderName, 
  ModelProvider, 
  PROVIDER_INFO, 
  hasOpenRouterKey,
  ModelCapability,
  CAPABILITY_INFO,
} from '@/lib/models';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Check, Info, Lock, Key, Search, Sparkles, X, Filter } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSubscription, FREE_PLAN_LIMITS } from '@/hooks/useSubscription';
import { Badge } from '@/components/ui/badge';
import { ModelPresetSelector } from '@/components/ModelPresetSelector';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCapabilities, setSelectedCapabilities] = useState<ModelCapability[]>([]);
  const { canUseModel, isPro } = useSubscription();
  const isMobile = useIsMobile();
  
  // Check if OpenRouter key is configured - refresh on storage changes
  const [openRouterConfigured, setOpenRouterConfigured] = useState(false);
  
  useEffect(() => {
    const checkKey = () => setOpenRouterConfigured(hasOpenRouterKey());
    checkKey();
    
    // Listen for storage changes
    window.addEventListener('storage', checkKey);
    // Also check periodically in case key was added in same tab
    const interval = setInterval(checkKey, 1000);
    
    return () => {
      window.removeEventListener('storage', checkKey);
      clearInterval(interval);
    };
  }, []);

  const allAvailableModels = useMemo(() => getAllModels(openRouterConfigured), [openRouterConfigured]);

  // Filter models by search and capabilities
  const filteredModels = useMemo(() => {
    let models = allAvailableModels;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      models = models.filter(m => 
        m.name.toLowerCase().includes(query) ||
        m.provider.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query)
      );
    }
    
    // Filter by capabilities
    if (selectedCapabilities.length > 0) {
      models = models.filter(m => 
        selectedCapabilities.some(cap => m.capabilities.includes(cap))
      );
    }
    
    return models;
  }, [allAvailableModels, searchQuery, selectedCapabilities]);

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
    
    filteredModels.forEach(model => {
      groups[model.provider].push(model);
    });
    
    return groups;
  }, [filteredModels]);

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

  const toggleCapability = (cap: ModelCapability) => {
    setSelectedCapabilities(prev => 
      prev.includes(cap) ? prev.filter(c => c !== cap) : [...prev, cap]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCapabilities([]);
  };

  const totalModels = isPro ? allAvailableModels.length : FREE_PLAN_LIMITS.allowedModels.length;
  const hasActiveFilters = searchQuery || selectedCapabilities.length > 0;

  // Shared content for both mobile sheet and desktop dropdown
  const renderContent = () => (
    <div className="flex flex-col h-full max-h-[80vh] md:max-h-[500px]">
      {/* Search Bar */}
      <div className="p-3 border-b border-border bg-background sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-10 bg-secondary/50"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Capability Filters */}
      <div className="p-3 border-b border-border bg-secondary/30 sticky top-[57px] z-10">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Filter by capability</span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-xs px-2 ml-auto"
              onClick={clearFilters}
            >
              Clear all
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(CAPABILITY_INFO) as ModelCapability[]).map((cap) => (
            <button
              key={cap}
              onClick={() => toggleCapability(cap)}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all",
                selectedCapabilities.includes(cap)
                  ? CAPABILITY_INFO[cap].color + " ring-1 ring-current"
                  : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
              )}
            >
              <span>{CAPABILITY_INFO[cap].icon}</span>
              <span>{CAPABILITY_INFO[cap].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-background">
        <span className="text-xs font-medium text-muted-foreground">
          {filteredModels.length} models {hasActiveFilters && '(filtered)'}
        </span>
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

      {/* Model List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-4">
          {/* Render each provider group */}
          {(Object.keys(PROVIDER_INFO) as ModelProvider[]).map((provider) => {
            const models = modelsByProvider[provider];
            if (models.length === 0) return null;
            
            return (
              <div key={provider} className="space-y-1">
                <div className="flex items-center gap-2 px-2 py-1.5 sticky top-0 bg-background/95 backdrop-blur-sm">
                  <div className={cn("w-2 h-2 rounded-full", getProviderColor(provider))} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {getProviderName(provider)}
                  </span>
                  <span className="text-xs text-muted-foreground/60">
                    ({models.length})
                  </span>
                  {models[0]?.requiresOpenRouter && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 ml-auto">
                      OpenRouter
                    </Badge>
                  )}
                </div>
                {models.map((model) => (
                  <ModelItem
                    key={model.id}
                    model={model}
                    isSelected={selectedModels.includes(model.id)}
                    onToggle={() => onToggleModel(model.id)}
                    isLocked={!canUseModel(model.id)}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            );
          })}

          {/* Empty state */}
          {filteredModels.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No models found</p>
              <Button
                variant="link"
                size="sm"
                className="text-xs mt-1"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            </div>
          )}

          {/* Show OpenRouter prompt if not configured */}
          {!openRouterConfigured && (
            <div className="px-3 py-4 bg-gradient-to-r from-pink-500/10 to-violet-500/10 rounded-lg border border-dashed border-pink-500/30">
              <div className="flex items-start gap-2 text-muted-foreground">
                <Key className="h-4 w-4 mt-0.5 shrink-0 text-pink-500" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">
                    Unlock {OPENROUTER_MODELS.length}+ More Models
                  </p>
                  <p className="text-xs">
                    Add your OpenRouter API key in Settings to access Claude, DeepSeek, Grok, Llama, and more.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // Trigger button content
  const triggerButton = (
    <Button 
      variant="outline" 
      className={cn(
        "w-full justify-between h-auto min-h-[48px] py-2.5 px-4 bg-card border-border hover:bg-secondary/50",
        "active:scale-[0.99] transition-all touch-manipulation"
      )}
      onClick={() => setIsOpen(true)}
    >
      <div className="flex flex-wrap gap-1.5 flex-1 text-left">
        {selectedModels.length === 0 ? (
          <span className="text-muted-foreground">Select AI models...</span>
        ) : selectedModels.length === allAvailableModels.length ? (
          <span className="text-foreground">All models selected</span>
        ) : (
          selectedNames.slice(0, isMobile ? 2 : 3).map((name, i) => (
            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
              {name}
            </span>
          ))
        )}
        {selectedNames.length > (isMobile ? 2 : 3) && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-muted-foreground text-xs">
            +{selectedNames.length - (isMobile ? 2 : 3)} more
          </span>
        )}
      </div>
      {isOpen ? (
        <ChevronUp className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
      ) : (
        <ChevronDown className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
      )}
    </Button>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-medium text-muted-foreground">Select Models</h3>
          {!isPro && (
            <Badge variant="secondary" className="text-xs">
              Free: 2 models only
            </Badge>
          )}
          {openRouterConfigured && (
            <Badge variant="outline" className="text-xs gap-1 border-pink-500/30 text-pink-500">
              <Key className="h-2.5 w-2.5" />
              OpenRouter Active
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

      {/* Mobile: Use Sheet for full-screen experience */}
      {isMobile ? (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            {triggerButton}
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] p-0 rounded-t-2xl">
            <SheetHeader className="p-4 border-b border-border">
              <SheetTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Select AI Models
              </SheetTitle>
            </SheetHeader>
            {renderContent()}
          </SheetContent>
        </Sheet>
      ) : (
        /* Desktop: Use custom dropdown for better control */
        <div className="relative">
          <div onClick={() => setIsOpen(!isOpen)}>
            {triggerButton}
          </div>
          
          {isOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsOpen(false)} 
              />
              
              {/* Dropdown Content */}
              <div 
                className={cn(
                  "absolute z-50 w-full mt-2 rounded-xl border border-border bg-card shadow-xl",
                  "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
                )}
              >
                {renderContent()}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface ModelItemProps {
  model: AIModel;
  isSelected: boolean;
  onToggle: () => void;
  isLocked: boolean;
  isMobile: boolean;
}

function ModelItem({ model, isSelected, onToggle, isLocked, isMobile }: ModelItemProps) {
  const providerColor = getProviderColor(model.provider);
  
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={isLocked ? undefined : onToggle}
        disabled={isLocked}
        className={cn(
          "flex-1 flex items-center gap-3 px-3 py-2.5 sm:py-2 rounded-xl transition-all duration-200 text-left",
          "touch-manipulation active:scale-[0.98]",
          isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-secondary/50",
          isSelected && !isLocked && "bg-primary/10 ring-1 ring-primary/30"
        )}
      >
        <div className={cn(
          "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
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
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm">{model.name}</p>
            {model.isNew && (
              <Badge variant="default" className="text-[9px] px-1 py-0 bg-gradient-to-r from-pink-500 to-violet-500">
                NEW
              </Badge>
            )}
            {isLocked && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Pro
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{model.description}</p>
          {/* Capability badges */}
          <div className="flex flex-wrap gap-1 mt-1">
            {model.capabilities.slice(0, isMobile ? 2 : 3).map((cap) => (
              <span 
                key={cap} 
                className={cn(
                  "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]",
                  CAPABILITY_INFO[cap].color
                )}
              >
                <span>{CAPABILITY_INFO[cap].icon}</span>
                <span className="hidden sm:inline">{CAPABILITY_INFO[cap].label}</span>
              </span>
            ))}
            {model.capabilities.length > (isMobile ? 2 : 3) && (
              <span className="text-[10px] text-muted-foreground">
                +{model.capabilities.length - (isMobile ? 2 : 3)}
              </span>
            )}
          </div>
        </div>
      </button>
      
      {!isMobile && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-1.5 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[280px]">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", providerColor)} />
                  <span className="font-semibold">{model.name}</span>
                  {model.isNew && (
                    <Badge variant="default" className="text-[9px] px-1 py-0 bg-gradient-to-r from-pink-500 to-violet-500">
                      NEW
                    </Badge>
                  )}
                </div>
                <p className="text-xs">{model.description}</p>
                <div className="flex flex-wrap gap-1">
                  {model.capabilities.map((cap) => (
                    <span 
                      key={cap} 
                      className={cn(
                        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]",
                        CAPABILITY_INFO[cap].color
                      )}
                    >
                      {CAPABILITY_INFO[cap].icon} {CAPABILITY_INFO[cap].label}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Provider: {getProviderName(model.provider)}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {model.openRouterId}
                </p>
                {model.requiresOpenRouter && (
                  <p className="text-xs text-pink-500">
                    Requires OpenRouter API key
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}