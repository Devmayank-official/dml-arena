import { useState, useEffect, useCallback } from 'react';
import { Key, Eye, EyeOff, Check, AlertCircle, Trash2, ExternalLink } from 'lucide-react';
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
  openrouter?: string;
}

interface ProviderConfig {
  id: keyof ApiKeyConfig;
  name: string;
  placeholder: string;
  color: string;
  description: string;
  docsUrl?: string;
}

const PROVIDERS: ProviderConfig[] = [
  { 
    id: 'openrouter', 
    name: 'OpenRouter', 
    placeholder: 'sk-or-v1-...', 
    color: 'bg-gradient-to-r from-pink-500 to-violet-500',
    description: 'Access 100+ models from OpenAI, Anthropic, Google, Meta, Mistral and more',
    docsUrl: 'https://openrouter.ai/keys'
  },
  { 
    id: 'openai', 
    name: 'OpenAI', 
    placeholder: 'sk-...', 
    color: 'bg-green-500',
    description: 'GPT-4, GPT-5, and other OpenAI models',
    docsUrl: 'https://platform.openai.com/api-keys'
  },
  { 
    id: 'anthropic', 
    name: 'Anthropic', 
    placeholder: 'sk-ant-...', 
    color: 'bg-orange-500',
    description: 'Claude models from Anthropic',
    docsUrl: 'https://console.anthropic.com/settings/keys'
  },
  { 
    id: 'google', 
    name: 'Google AI', 
    placeholder: 'AIza...', 
    color: 'bg-blue-500',
    description: 'Gemini models from Google',
    docsUrl: 'https://aistudio.google.com/app/apikey'
  },
  { 
    id: 'mistral', 
    name: 'Mistral AI', 
    placeholder: 'your-mistral-key', 
    color: 'bg-purple-500',
    description: 'Mistral models',
    docsUrl: 'https://console.mistral.ai/api-keys'
  },
  { 
    id: 'groq', 
    name: 'Groq', 
    placeholder: 'gsk_...', 
    color: 'bg-rose-500',
    description: 'Fast inference with Groq',
    docsUrl: 'https://console.groq.com/keys'
  },
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
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setApiKeys(getStoredApiKeys());
    setIsLoaded(true);
  }, []);

  const updateApiKey = useCallback((provider: keyof ApiKeyConfig, value: string) => {
    setApiKeys(prev => {
      const newKeys = { ...prev, [provider]: value || undefined };
      if (!value) delete newKeys[provider];
      saveApiKeys(newKeys);
      return newKeys;
    });
  }, []);

  const clearApiKey = useCallback((provider: keyof ApiKeyConfig) => {
    setApiKeys(prev => {
      const newKeys = { ...prev };
      delete newKeys[provider];
      saveApiKeys(newKeys);
      return newKeys;
    });
  }, []);

  const hasAnyKey = Object.values(apiKeys).some(Boolean);
  const hasOpenRouter = !!apiKeys.openrouter;

  return { apiKeys, updateApiKey, clearApiKey, hasAnyKey, hasOpenRouter, isLoaded };
}

export function ApiKeysSettings() {
  const { apiKeys, updateApiKey, clearApiKey, hasOpenRouter } = useApiKeys();
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
    const trimmedValue = tempValue.trim();
    if (!trimmedValue) {
      toast({
        title: 'Error',
        description: 'API key cannot be empty',
        variant: 'destructive',
      });
      return;
    }
    updateApiKey(providerId, trimmedValue);
    setEditingKey(null);
    setTempValue('');
    toast({
      title: 'API Key saved',
      description: `${PROVIDERS.find(p => p.id === providerId)?.name} key has been saved. Your key will be used for API calls.`,
    });
  };

  const handleClear = (providerId: keyof ApiKeyConfig) => {
    clearApiKey(providerId);
    toast({
      title: 'API Key removed',
      description: `${PROVIDERS.find(p => p.id === providerId)?.name} key has been removed. System key will be used instead.`,
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
        <h2 className="text-base sm:text-lg font-semibold">API Keys</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Add your own API keys to use your personal quotas. <strong>Your keys are always preferred</strong> over system keys when available.
      </p>
      
      {/* Priority Notice */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-2">
          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="text-xs text-foreground/80">
            <strong className="text-primary">User Key Priority:</strong> When you add your own API key, it will be used instead of the system key. This gives you full control over your API usage and costs.
          </div>
        </div>
      </div>
      
      {/* OpenRouter Highlight */}
      {!hasOpenRouter && (
        <div className="bg-gradient-to-r from-pink-500/10 to-violet-500/10 border border-pink-500/20 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-pink-500 mt-0.5 shrink-0" />
            <div className="text-xs">
              <strong className="text-pink-400">Recommended:</strong> OpenRouter gives you access to 100+ AI models from all major providers with a single API key.{' '}
              <a 
                href="https://openrouter.ai/keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-pink-400 hover:text-pink-300 underline inline-flex items-center gap-0.5"
              >
                Get your key <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Keys are stored securely in your browser's local storage. They are sent encrypted to our servers for API calls only.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {PROVIDERS.map((provider) => {
          const hasKey = !!apiKeys[provider.id];
          const isEditing = editingKey === provider.id;
          const isVisible = showKeys[provider.id];
          const isOpenRouter = provider.id === 'openrouter';

          return (
            <div
              key={provider.id}
              className={cn(
                "p-3 sm:p-4 rounded-lg border transition-colors",
                hasKey ? "border-green-500/30 bg-green-500/5" : "border-border",
                isOpenRouter && !hasKey && "border-pink-500/30 bg-gradient-to-r from-pink-500/5 to-violet-500/5"
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", provider.color)} />
                  <Label className="font-medium truncate">{provider.name}</Label>
                  {hasKey && (
                    <Badge variant="outline" className="text-xs gap-1 border-green-500/30 text-green-600 dark:text-green-400 shrink-0">
                      <Check className="h-3 w-3" />
                      Active
                    </Badge>
                  )}
                  {isOpenRouter && (
                    <Badge variant="secondary" className="text-xs bg-gradient-to-r from-pink-500/20 to-violet-500/20 shrink-0">
                      100+ models
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {provider.docsUrl && (
                    <a
                      href={provider.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                    >
                      Get key <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
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
              </div>
              
              <p className="text-xs text-muted-foreground mb-2">{provider.description}</p>

              {isEditing ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={isVisible ? 'text' : 'password'}
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      placeholder={provider.placeholder}
                      className="pr-10"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveKey(provider.id);
                        if (e.key === 'Escape') {
                          setEditingKey(null);
                          setTempValue('');
                        }
                      }}
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
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveKey(provider.id)} className="flex-1 sm:flex-none">
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingKey(null);
                        setTempValue('');
                      }}
                      className="flex-1 sm:flex-none"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  {hasKey ? (
                    <>
                      <code className="flex-1 text-sm bg-muted px-2 py-1 rounded font-mono overflow-hidden text-ellipsis">
                        {isVisible ? apiKeys[provider.id] : maskKey(apiKeys[provider.id] || '')}
                      </code>
                      <div className="flex gap-2">
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
                      </div>
                    </>
                  ) : (
                    <Button
                      variant={isOpenRouter ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-8 text-xs",
                        isOpenRouter && "bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600"
                      )}
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
