import { useState } from 'react';
import { Key, Eye, EyeOff, Check, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export interface ApiKeyConfig {
  openai?: string;
  anthropic?: string;
  google?: string;
  mistral?: string;
  groq?: string;
}

interface ProviderConfig {
  id: keyof ApiKeyConfig;
  name: string;
  placeholder: string;
  color: string;
  icon?: string;
}

const PROVIDERS: ProviderConfig[] = [
  { id: 'openai', name: 'OpenAI', placeholder: 'sk-...', color: 'bg-green-500' },
  { id: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-...', color: 'bg-orange-500' },
  { id: 'google', name: 'Google AI', placeholder: 'AIza...', color: 'bg-blue-500' },
  { id: 'mistral', name: 'Mistral AI', placeholder: 'your-mistral-key', color: 'bg-purple-500' },
  { id: 'groq', name: 'Groq', placeholder: 'gsk_...', color: 'bg-rose-500' },
];

const STORAGE_KEY = 'compareai-api-keys';

function getStoredApiKeys(): ApiKeyConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveApiKeys(keys: ApiKeyConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig>(getStoredApiKeys);

  const updateApiKey = (provider: keyof ApiKeyConfig, value: string) => {
    const newKeys = { ...apiKeys, [provider]: value || undefined };
    if (!value) delete newKeys[provider];
    setApiKeys(newKeys);
    saveApiKeys(newKeys);
  };

  const clearApiKey = (provider: keyof ApiKeyConfig) => {
    const newKeys = { ...apiKeys };
    delete newKeys[provider];
    setApiKeys(newKeys);
    saveApiKeys(newKeys);
  };

  const hasAnyKey = Object.values(apiKeys).some(Boolean);

  return { apiKeys, updateApiKey, clearApiKey, hasAnyKey };
}

export function ApiKeysSettings() {
  const { apiKeys, updateApiKey, clearApiKey } = useApiKeys();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const { toast } = useToast();

  const toggleShowKey = (providerId: string) => {
    setShowKeys(prev => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const startEditing = (providerId: string, currentValue?: string) => {
    setEditingKey(providerId);
    setTempValue(currentValue || '');
  };

  const saveKey = (providerId: keyof ApiKeyConfig) => {
    updateApiKey(providerId, tempValue.trim());
    setEditingKey(null);
    setTempValue('');
    toast({
      title: 'API Key saved',
      description: `${PROVIDERS.find(p => p.id === providerId)?.name} key has been saved locally.`,
    });
  };

  const handleClear = (providerId: keyof ApiKeyConfig) => {
    clearApiKey(providerId);
    toast({
      title: 'API Key removed',
      description: `${PROVIDERS.find(p => p.id === providerId)?.name} key has been removed.`,
    });
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return key.slice(0, 4) + '••••••••' + key.slice(-4);
  };

  return (
    <Card className="p-4 sm:p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Key className="h-5 w-5 text-primary" />
        <h2 className="text-base sm:text-lg font-semibold">Custom API Keys</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Add your own API keys to use additional providers. Keys are stored locally in your browser.
      </p>
      
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            API keys are stored in your browser's local storage. For enhanced security, consider using environment variables in a production setup.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {PROVIDERS.map((provider) => {
          const hasKey = !!apiKeys[provider.id];
          const isEditing = editingKey === provider.id;
          const isVisible = showKeys[provider.id];

          return (
            <div
              key={provider.id}
              className={cn(
                "p-3 rounded-lg border transition-colors",
                hasKey ? "border-green-500/30 bg-green-500/5" : "border-border"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2.5 h-2.5 rounded-full", provider.color)} />
                  <Label className="font-medium">{provider.name}</Label>
                  {hasKey && (
                    <Badge variant="outline" className="text-xs gap-1 border-green-500/30 text-green-600 dark:text-green-400">
                      <Check className="h-3 w-3" />
                      Configured
                    </Badge>
                  )}
                </div>
                {hasKey && !isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => handleClear(provider.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={isVisible ? 'text' : 'password'}
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      placeholder={provider.placeholder}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => toggleShowKey(provider.id)}
                    >
                      {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <Button size="sm" onClick={() => saveKey(provider.id)}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingKey(null);
                      setTempValue('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {hasKey ? (
                    <>
                      <code className="flex-1 text-sm bg-muted px-2 py-1 rounded font-mono">
                        {isVisible ? apiKeys[provider.id] : maskKey(apiKeys[provider.id] || '')}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => toggleShowKey(provider.id)}
                      >
                        {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => startEditing(provider.id, apiKeys[provider.id])}
                      >
                        Edit
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => startEditing(provider.id)}
                    >
                      Add Key
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
