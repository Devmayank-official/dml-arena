import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Brain, Minus, Plus, ChevronDown, ChevronUp, Zap, Target, Flame, Settings2, Lock, Mic, MicOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useSubscription } from '@/features/subscription';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

export interface DeepModeSettings {
  rounds: number;
  style: 'collaborative' | 'competitive' | 'analytical' | 'socratic' | 'devils_advocate' | 'consensus';
  responseLength: 'concise' | 'balanced' | 'detailed' | 'more_detailed';
  focusArea: 'balanced' | 'technical' | 'creative' | 'practical' | 'theoretical';
  persona: 'none' | 'scientist' | 'engineer' | 'philosopher' | 'business' | 'educator' | 'critic' | 'custom';
  customPersona?: string;
  synthesizer: string;
}

interface DeepModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  settings: DeepModeSettings;
  onSettingsChange: (settings: DeepModeSettings) => void;
  onVoicePrompt?: (prompt: string) => void;
}

type PresetMode = 'quick' | 'standard' | 'deep';

const PRESETS: Record<PresetMode, { settings: Partial<DeepModeSettings>; label: string; description: string; icon: typeof Zap }> = {
  quick: {
    label: 'Quick',
    description: '2 rounds, fast answers',
    icon: Zap,
    settings: {
      rounds: 2,
      style: 'collaborative',
      responseLength: 'concise',
      focusArea: 'balanced',
      persona: 'none',
    },
  },
  standard: {
    label: 'Standard',
    description: '3 rounds, balanced depth',
    icon: Target,
    settings: {
      rounds: 3,
      style: 'analytical',
      responseLength: 'balanced',
      focusArea: 'balanced',
      persona: 'none',
    },
  },
  deep: {
    label: 'Deep',
    description: '5 rounds, thorough analysis',
    icon: Flame,
    settings: {
      rounds: 5,
      style: 'competitive',
      responseLength: 'detailed',
      focusArea: 'technical',
      persona: 'scientist',
    },
  },
};

const SYNTHESIZER_OPTIONS = [
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'openai/gpt-5', name: 'GPT-5' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
];

const STYLE_OPTIONS = [
  { id: 'collaborative', name: 'Collaborative' },
  { id: 'competitive', name: 'Competitive' },
  { id: 'analytical', name: 'Analytical' },
  { id: 'socratic', name: 'Socratic' },
  { id: 'devils_advocate', name: "Devil's Advocate" },
  { id: 'consensus', name: 'Consensus-Building' },
];

const LENGTH_OPTIONS = [
  { id: 'concise', name: 'Concise' },
  { id: 'balanced', name: 'Balanced' },
  { id: 'detailed', name: 'Detailed' },
  { id: 'more_detailed', name: 'More Detailed' },
];

const FOCUS_OPTIONS = [
  { id: 'balanced', name: 'Balanced' },
  { id: 'technical', name: 'Technical' },
  { id: 'creative', name: 'Creative' },
  { id: 'practical', name: 'Practical' },
  { id: 'theoretical', name: 'Theoretical' },
];

const PERSONA_OPTIONS = [
  { id: 'none', name: 'No Persona' },
  { id: 'scientist', name: 'Research Scientist' },
  { id: 'engineer', name: 'Senior Engineer' },
  { id: 'philosopher', name: 'Philosopher' },
  { id: 'business', name: 'Business Strategist' },
  { id: 'educator', name: 'Expert Educator' },
  { id: 'critic', name: 'Critical Analyst' },
  { id: 'custom', name: 'Custom Persona...' },
];

function getActivePreset(settings: DeepModeSettings): PresetMode | null {
  for (const [key, preset] of Object.entries(PRESETS) as [PresetMode, typeof PRESETS['quick']][]) {
    const { rounds, style, responseLength, focusArea, persona } = preset.settings;
    if (
      settings.rounds === rounds &&
      settings.style === style &&
      settings.responseLength === responseLength &&
      settings.focusArea === focusArea &&
      settings.persona === persona
    ) {
      return key;
    }
  }
  return null;
}

export function DeepModeToggle({ enabled, onToggle, settings, onSettingsChange, onVoicePrompt }: DeepModeToggleProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { canUseDeepMode, isPro } = useSubscription();
  const { toast } = useToast();
  const activePreset = getActivePreset(settings);

  const {
    isListening,
    isSupported: voiceSupported,
    interimTranscript,
    startListening,
    stopListening,
    error: voiceError,
  } = useVoiceInput({
    onTranscript: (transcript) => {
      if (onVoicePrompt) {
        onVoicePrompt(transcript);
        toast({
          title: 'Voice captured',
          description: `"${transcript.slice(0, 50)}${transcript.length > 50 ? '...' : ''}"`,
        });
      }
    },
  });

  // Show voice error toast
  useEffect(() => {
    if (voiceError) {
      toast({
        title: 'Voice Input Error',
        description: voiceError,
        variant: 'destructive',
      });
    }
  }, [voiceError, toast]);

  const applyPreset = (preset: PresetMode) => {
    onSettingsChange({
      ...settings,
      ...PRESETS[preset].settings,
      customPersona: undefined,
    });
    setAdvancedOpen(false);
  };

  const handleToggle = (value: boolean) => {
    if (value && !canUseDeepMode) {
      return; // Don't enable if not allowed
    }
    onToggle(value);
  };

  const decreaseRounds = () => {
    if (settings.rounds > 2) onSettingsChange({ ...settings, rounds: settings.rounds - 1 });
  };

  const increaseRounds = () => {
    if (settings.rounds < 5) onSettingsChange({ ...settings, rounds: settings.rounds + 1 });
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className={cn(
      "p-3 sm:p-4 rounded-xl border transition-all duration-300",
      enabled ? "border-accent bg-accent/10" : "border-border bg-card",
      !canUseDeepMode && "opacity-60"
    )}>
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className={cn(
            "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-colors shrink-0",
            enabled ? "bg-accent/20" : "bg-secondary"
          )}>
            {canUseDeepMode ? (
              <Brain className={cn("h-4 w-4 sm:h-5 sm:w-5", enabled ? "text-accent" : "text-muted-foreground")} />
            ) : (
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Deep Mode</p>
              {!canUseDeepMode && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  Pro
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {!canUseDeepMode
                ? "Upgrade to Pro for AI debates"
                : enabled 
                  ? activePreset 
                    ? `${PRESETS[activePreset].label} • ${settings.rounds} rounds`
                    : `Custom • ${settings.rounds} rounds`
                  : "AI models debate & synthesize"
              }
            </p>
          </div>
        </div>
        
        {/* Voice input for Deep Mode */}
        {enabled && voiceSupported && onVoicePrompt && (
          <Button
            type="button"
            size="icon"
            variant={isListening ? "destructive" : "outline"}
            onClick={handleVoiceToggle}
            className={cn(
              "shrink-0 h-8 w-8 rounded-lg transition-all duration-200",
              isListening && "animate-pulse"
            )}
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        )}
        
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={!canUseDeepMode}
          className="data-[state=checked]:bg-accent shrink-0"
        />
      </div>

      {/* Voice listening indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 rounded-lg border border-red-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-xs text-red-500 flex-1">
                {interimTranscript || 'Listening for Deep Mode prompt...'}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={stopListening}
                className="h-5 w-5 text-red-500 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {enabled && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50 space-y-3 sm:space-y-4">
          {/* Preset Mode Selection */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {(Object.entries(PRESETS) as [PresetMode, typeof PRESETS['quick']][]).map(([key, preset]) => {
              const Icon = preset.icon;
              const isActive = activePreset === key;
              return (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className={cn(
                    "flex flex-col items-center gap-1 sm:gap-1.5 p-2 sm:p-3 rounded-lg border transition-all",
                    isActive 
                      ? "border-accent bg-accent/20 text-accent" 
                      : "border-border bg-secondary/30 hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-[10px] sm:text-xs font-medium">{preset.label}</span>
                  <span className="text-[9px] sm:text-[10px] opacity-70 hidden xs:block">{preset.description}</span>
                </button>
              );
            })}
          </div>

          {/* Advanced Settings Collapsible */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-between h-9 text-muted-foreground hover:text-foreground"
              >
                <span className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Advanced Settings
                </span>
                {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="pt-2 sm:pt-3 space-y-2.5 sm:space-y-3">
              {/* Rounds */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Debate Rounds</span>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 sm:h-7 sm:w-7"
                    onClick={decreaseRounds}
                    disabled={settings.rounds <= 2}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 sm:w-8 text-center text-xs sm:text-sm font-mono font-bold">{settings.rounds}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 sm:h-7 sm:w-7"
                    onClick={increaseRounds}
                    disabled={settings.rounds >= 5}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Debate Style */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Debate Style</span>
                <Select
                  value={settings.style}
                  onValueChange={(value: DeepModeSettings['style']) => 
                    onSettingsChange({ ...settings, style: value })
                  }
                >
                  <SelectTrigger className="w-[110px] sm:w-[140px] h-7 sm:h-8 text-[10px] sm:text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLE_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Response Length */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Response Length</span>
                <Select
                  value={settings.responseLength}
                  onValueChange={(value: DeepModeSettings['responseLength']) => 
                    onSettingsChange({ ...settings, responseLength: value })
                  }
                >
                  <SelectTrigger className="w-[110px] sm:w-[140px] h-7 sm:h-8 text-[10px] sm:text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LENGTH_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Focus Area */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Focus Area</span>
                <Select
                  value={settings.focusArea}
                  onValueChange={(value: DeepModeSettings['focusArea']) => 
                    onSettingsChange({ ...settings, focusArea: value })
                  }
                >
                  <SelectTrigger className="w-[110px] sm:w-[140px] h-7 sm:h-8 text-[10px] sm:text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FOCUS_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Expert Persona */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Expert Persona</span>
                <Select
                  value={settings.persona}
                  onValueChange={(value: DeepModeSettings['persona']) => 
                    onSettingsChange({ ...settings, persona: value, customPersona: value === 'custom' ? settings.customPersona : undefined })
                  }
                >
                  <SelectTrigger className="w-[110px] sm:w-[140px] h-7 sm:h-8 text-[10px] sm:text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERSONA_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Persona Input */}
              {settings.persona === 'custom' && (
                <div className="space-y-1">
                  <span className="text-[10px] sm:text-xs text-muted-foreground">Custom Persona Description</span>
                  <Input
                    placeholder="e.g., You are a venture capitalist..."
                    value={settings.customPersona || ''}
                    onChange={(e) => onSettingsChange({ ...settings, customPersona: e.target.value })}
                    className="h-7 sm:h-8 text-[10px] sm:text-xs"
                  />
                </div>
              )}

              {/* Synthesizer Model */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Synthesizer</span>
                <Select
                  value={settings.synthesizer}
                  onValueChange={(value) => onSettingsChange({ ...settings, synthesizer: value })}
                >
                  <SelectTrigger className="w-[110px] sm:w-[140px] h-7 sm:h-8 text-[10px] sm:text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SYNTHESIZER_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
}