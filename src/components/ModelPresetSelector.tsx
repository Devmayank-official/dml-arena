import { useState } from 'react';
import { ModelPreset, useModelPresets } from '@/hooks/useModelPresets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Layers, Plus, Trash2, Save, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AI_MODELS } from '@/lib/models';
import { toast } from 'sonner';

interface ModelPresetSelectorProps {
  selectedModels: string[];
  onApplyPreset: (models: string[]) => void;
}

export function ModelPresetSelector({ selectedModels, onApplyPreset }: ModelPresetSelectorProps) {
  const { presets, addPreset, deletePreset } = useModelPresets();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetIcon, setNewPresetIcon] = useState('🎯');
  const [newPresetDescription, setNewPresetDescription] = useState('');

  const iconOptions = ['🎯', '🚀', '🔬', '📝', '🎨', '🧪', '💡', '🔧', '📱', '🌐'];

  const handleApplyPreset = (preset: ModelPreset) => {
    onApplyPreset(preset.models);
    setIsOpen(false);
    toast.success(`Applied "${preset.name}" preset`);
  };

  const handleCreatePreset = () => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }
    if (selectedModels.length === 0) {
      toast.error('Select at least one model first');
      return;
    }

    addPreset({
      name: newPresetName.trim(),
      icon: newPresetIcon,
      description: newPresetDescription.trim() || `Custom preset with ${selectedModels.length} models`,
      models: selectedModels,
    });

    setNewPresetName('');
    setNewPresetDescription('');
    setNewPresetIcon('🎯');
    setShowCreateDialog(false);
    toast.success('Preset saved successfully');
  };

  const handleDeletePreset = (e: React.MouseEvent, presetId: string) => {
    e.stopPropagation();
    deletePreset(presetId);
    toast.success('Preset deleted');
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2" data-action="preset-selector">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Presets</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72 p-0">
          <div className="p-2 border-b border-border bg-secondary/30">
            <p className="text-xs font-medium text-muted-foreground">Model Presets</p>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                data-preset={preset.id}
                className={cn(
                  "w-full flex items-start gap-3 p-2.5 rounded-lg transition-all",
                  "hover:bg-secondary/50 text-left group"
                )}
              >
                <span className="text-lg shrink-0">{preset.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{preset.name}</span>
                    {preset.isBuiltIn && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        Built-in
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {preset.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {preset.models.slice(0, 3).map((modelId) => {
                      const model = AI_MODELS.find(m => m.id === modelId);
                      return model ? (
                        <span
                          key={modelId}
                          className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]"
                        >
                          {model.name}
                        </span>
                      ) : null;
                    })}
                    {preset.models.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{preset.models.length - 3}
                      </span>
                    )}
                  </div>
                </div>
                {!preset.isBuiltIn && (
                  <button
                    onClick={(e) => handleDeletePreset(e, preset.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </button>
            ))}
          </div>

          <DropdownMenuSeparator />
          
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-primary"
              onClick={() => {
                setIsOpen(false);
                setShowCreateDialog(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Save Current as Preset
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Custom Preset</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Icon</label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setNewPresetIcon(icon)}
                    className={cn(
                      "w-10 h-10 rounded-lg text-lg flex items-center justify-center transition-all",
                      newPresetIcon === icon
                        ? "bg-primary/20 ring-2 ring-primary"
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Preset Name</label>
              <Input
                placeholder="e.g., My Coding Setup"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                placeholder="Brief description of this preset"
                value={newPresetDescription}
                onChange={(e) => setNewPresetDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Selected Models</label>
              <div className="flex flex-wrap gap-1.5 p-3 bg-secondary/50 rounded-lg min-h-[60px]">
                {selectedModels.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No models selected</span>
                ) : (
                  selectedModels.map((modelId) => {
                    const model = AI_MODELS.find(m => m.id === modelId);
                    return model ? (
                      <Badge key={modelId} variant="secondary" className="text-xs">
                        {model.name}
                      </Badge>
                    ) : null;
                  })
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePreset} className="gap-2">
              <Save className="h-4 w-4" />
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
