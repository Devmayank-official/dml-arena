import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  ArrowLeft, 
  User, 
  Layers, 
  Monitor,
  Download,
  Trash2,
  AlertTriangle,
  Check,
  Loader2,
  CreditCard,
  Crown,
  Zap,
  Calendar,
  ArrowUpRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription, FREE_PLAN_LIMITS } from '@/hooks/useSubscription';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ALL_MODELS, PROVIDER_INFO, type ModelProvider } from '@/lib/models';
import { ApiKeysSettings } from '@/components/ApiKeysSettings';
import { useRazorpay } from '@/hooks/useRazorpay';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings, updateSettings } = useSettings();
  const { subscription, isPro, remainingQueries, isLoading: subscriptionLoading, refetch: refetchSubscription } = useSubscription();
  const { cancelSubscription } = useRazorpay();
  const [isCancelling, setIsCancelling] = useState(false);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [understandConfirmation, setUnderstandConfirmation] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const handleModelToggle = (modelId: string) => {
    const current = settings.defaultModels;
    const updated = current.includes(modelId)
      ? current.filter(id => id !== modelId)
      : [...current, modelId];
    
    if (updated.length === 0) {
      toast({ title: 'Error', description: 'You must have at least one default model', variant: 'destructive' });
      return;
    }
    
    updateSettings({ defaultModels: updated });
  };

  const handleExportData = async () => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be signed in to export data', variant: 'destructive' });
      return;
    }

    setIsExporting(true);
    try {
      const [comparisons, debates, votes] = await Promise.all([
        supabase.from('comparison_history').select('*').eq('user_id', user.id),
        supabase.from('debate_history').select('*').eq('user_id', user.id),
        supabase.from('community_votes').select('*').eq('user_id', user.id),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: { id: user.id, email: user.email },
        settings,
        comparisons: comparisons.data || [],
        debates: debates.data || [],
        votes: votes.data || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dmlarena-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Export complete', description: 'Your data has been downloaded.' });
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: 'Error', description: 'Failed to export data', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const canDelete = deleteConfirmText.toUpperCase() === 'DELETE' && understandConfirmation;

  const handleClearHistory = async () => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be signed in', variant: 'destructive' });
      return;
    }

    if (!canDelete) {
      toast({ title: 'Error', description: 'Please type DELETE and check the confirmation', variant: 'destructive' });
      return;
    }

    setIsClearing(true);
    try {
      await Promise.all([
        supabase.from('comparison_history').delete().eq('user_id', user.id),
        supabase.from('debate_history').delete().eq('user_id', user.id),
        supabase.from('community_votes').delete().eq('user_id', user.id),
      ]);

      toast({ title: 'History cleared', description: 'All your data has been permanently deleted.' });
      setClearDialogOpen(false);
      setDeleteConfirmText('');
      setUnderstandConfirmation(false);
    } catch (error) {
      console.error('Clear history error:', error);
      toast({ title: 'Error', description: 'Failed to clear history', variant: 'destructive' });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <AppLayout>
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8 relative z-10 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4 sm:mb-6"
        >
          <Link to="/chat">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 sm:space-y-6"
        >
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
          </div>

          {/* Profile Link */}
          {user && (
            <Card className="p-3 sm:p-4 bg-card border-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{user.email}</p>
                    <p className="text-sm text-muted-foreground">Manage your profile, avatar and bio</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/chat/profile/${user.id}`)}
                  className="w-full sm:w-auto shrink-0"
                >
                  View Profile
                </Button>
              </div>
            </Card>
          )}

          {/* Subscription Management */}
          {user && (
            <Card className="p-4 sm:p-6 bg-card border-border">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="text-base sm:text-lg font-semibold">Subscription</h2>
                {isPro && (
                  <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0">
                    <Crown className="h-3 w-3 mr-1" />
                    Pro
                  </Badge>
                )}
              </div>

              {subscriptionLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : isPro ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                      <span className="font-semibold">Pro Plan</span>
                      <span className="text-muted-foreground">
                        {(subscription as any)?.billing_cycle === 'yearly' ? '₹15,300/yr' : '₹1,500/mo'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      1,000 credits/month, all 55+ AI models, Deep Mode, Community access, and more.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <Zap className="h-3 w-3" />
                        1,000 Credits/mo
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <Layers className="h-3 w-3" />
                        All Models
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <Check className="h-3 w-3" />
                        Deep Mode
                      </Badge>
                    </div>
                  </div>

                  {(subscription as any)?.subscription_end && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {(subscription as any)?.cancelled_at 
                          ? `Pro until: ${new Date((subscription as any).subscription_end).toLocaleDateString()}`
                          : `Next billing: ${new Date((subscription as any).subscription_end).toLocaleDateString()}`
                        }
                      </span>
                    </div>
                  )}

                  {(subscription as any)?.cancelled_at ? (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
                      Subscription cancelled. Pro features remain active until the end of your billing period.
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-3">
                        Need to cancel your subscription?
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        disabled={isCancelling}
                        onClick={async () => {
                          setIsCancelling(true);
                          await cancelSubscription();
                          await refetchSubscription();
                          setIsCancelling(false);
                        }}
                      >
                        {isCancelling ? (
                          <><Loader2 className="h-3 w-3 animate-spin" /> Cancelling...</>
                        ) : (
                          <>Cancel Subscription</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">Free Plan</span>
                      <span className="text-muted-foreground">$0/month</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Limited access to AI comparison features.
                    </p>
                    
                    {/* Usage Progress */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Monthly Credits</span>
                        <span className="font-medium">
                          {subscription?.monthly_usage || 0} / {FREE_PLAN_LIMITS.perMonth}
                        </span>
                      </div>
                      <Progress 
                        value={((subscription?.monthly_usage || 0) / FREE_PLAN_LIMITS.perMonth) * 100} 
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        {remainingQueries} credits remaining this month
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="gap-1">
                        Gemini 2.5 Flash Lite
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        GPT-5 Nano
                      </Badge>
                    </div>
                  </div>

                  {subscription?.usage_reset_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Usage resets: {new Date(subscription.usage_reset_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shrink-0">
                        <Crown className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1">Upgrade to Pro</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Get unlimited queries, all 55+ AI models, Deep Mode debates, community access, sharing & export.
                        </p>
                        <Button 
                          onClick={() => navigate('/pricing')}
                          className="gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600"
                        >
                          <Crown className="h-4 w-4" />
                          Upgrade for $15/month
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Default Models */}
          <Card className="p-4 sm:p-6 bg-card border-border">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Layers className="h-5 w-5 text-primary" />
              <h2 className="text-base sm:text-lg font-semibold">Default Models</h2>
              <Badge variant="secondary" className="ml-auto text-xs">
                {settings.defaultModels.length} selected
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3 sm:mb-4">
              Select which models are pre-selected when you start a new comparison.
            </p>
            <Input
              placeholder="Search models..."
              className="mb-3"
              onChange={(e) => {
                const search = e.target.value.toLowerCase();
                document.querySelectorAll('[data-model-item]').forEach((el) => {
                  const name = el.getAttribute('data-model-name')?.toLowerCase() || '';
                  const provider = el.getAttribute('data-model-provider')?.toLowerCase() || '';
                  (el as HTMLElement).style.display = (name.includes(search) || provider.includes(search)) ? '' : 'none';
                });
                document.querySelectorAll('[data-provider-group]').forEach((el) => {
                  const items = el.querySelectorAll('[data-model-item]');
                  const anyVisible = Array.from(items).some(item => (item as HTMLElement).style.display !== 'none');
                  (el as HTMLElement).style.display = anyVisible ? '' : 'none';
                });
              }}
            />
            <div className="max-h-80 overflow-y-auto space-y-4 pr-1">
              {Object.entries(
                ALL_MODELS.reduce((groups, model) => {
                  const provider = model.provider;
                  if (!groups[provider]) groups[provider] = [];
                  groups[provider].push(model);
                  return groups;
                }, {} as Record<string, typeof ALL_MODELS>)
              ).map(([provider, models]) => (
                <div key={provider} data-provider-group>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {PROVIDER_INFO[provider as ModelProvider]?.name || provider} ({models.length})
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {models.map((model) => (
                      <div
                        key={model.id}
                        data-model-item
                        data-model-name={model.name}
                        data-model-provider={provider}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors active:scale-[0.98] ${
                          settings.defaultModels.includes(model.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleModelToggle(model.id)}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: model.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{model.name}</p>
                        </div>
                        {settings.defaultModels.includes(model.id) && (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Response Display */}
          <Card className="p-4 sm:p-6 bg-card border-border">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Monitor className="h-5 w-5 text-primary" />
              <h2 className="text-base sm:text-lg font-semibold">Response Display</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <div className="min-w-0">
                  <Label>Default View</Label>
                  <p className="text-sm text-muted-foreground">How responses are displayed by default</p>
                </div>
                <Select
                  value={settings.responseDisplay}
                  onValueChange={(value: 'grid' | 'diff') => updateSettings({ responseDisplay: value })}
                >
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid View</SelectItem>
                    <SelectItem value="diff">Diff View</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Label>Auto-save History</Label>
                  <p className="text-sm text-muted-foreground">Automatically save comparisons to history</p>
                </div>
                <Switch
                  checked={settings.autoSaveHistory}
                  onCheckedChange={(checked) => updateSettings({ autoSaveHistory: checked })}
                />
              </div>
            </div>
          </Card>

          {/* API Keys Settings */}
          <ApiKeysSettings />

          {/* Data Management */}
          <Card className="p-4 sm:p-6 bg-card border-border">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Download className="h-5 w-5 text-primary" />
              <h2 className="text-base sm:text-lg font-semibold">Data Management</h2>
            </div>
            
            <div className="space-y-4">
              {/* Export Data */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-lg border border-border">
                <div className="min-w-0">
                  <p className="font-medium">Export All Data</p>
                  <p className="text-sm text-muted-foreground">Download all your comparisons, debates, and settings</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleExportData}
                  disabled={isExporting || !user}
                  className="w-full sm:w-auto shrink-0"
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export
                </Button>
              </div>

              {/* Clear History */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                <div className="min-w-0">
                  <p className="font-medium text-destructive">Clear All History</p>
                  <p className="text-sm text-muted-foreground">Permanently delete all your data</p>
                </div>
                <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={!user} className="w-full sm:w-auto shrink-0">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear History
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-md mx-4 sm:mx-auto">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Clear All History
                      </AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="space-y-4">
                          <p>
                            This action will permanently delete all your data including:
                          </p>
                          <ul className="list-disc pl-5 text-sm space-y-1">
                            <li>All comparison history</li>
                            <li>All debate history</li>
                            <li>All your votes on community comparisons</li>
                          </ul>
                          <p className="font-medium text-destructive">
                            This action cannot be undone.
                          </p>
                          
                          <div className="space-y-4 pt-2">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                id="understand"
                                checked={understandConfirmation}
                                onCheckedChange={(checked) => setUnderstandConfirmation(checked === true)}
                                className="mt-0.5"
                              />
                              <Label htmlFor="understand" className="text-sm cursor-pointer leading-relaxed">
                                I understand that all my data will be permanently deleted and this action is irreversible
                              </Label>
                            </div>

                            <div>
                              <Label htmlFor="deleteConfirm" className="text-sm font-medium">
                                Type <span className="font-bold text-destructive">DELETE</span> to confirm
                              </Label>
                              <Input
                                id="deleteConfirm"
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="Type DELETE here"
                                className="mt-1.5"
                                autoComplete="off"
                              />
                            </div>
                          </div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                      <AlertDialogCancel 
                        onClick={() => {
                          setDeleteConfirmText('');
                          setUnderstandConfirmation(false);
                        }}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </AlertDialogCancel>
                      <Button
                        variant="destructive"
                        onClick={handleClearHistory}
                        disabled={!canDelete || isClearing}
                        className="w-full sm:w-auto"
                      >
                        {isClearing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Delete Everything
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>

          {!user && (
            <Card className="p-4 sm:p-6 bg-card border-border text-center">
              <p className="text-muted-foreground mb-4">Sign in to access all settings and data management features.</p>
              <Link to="/auth">
                <Button className="w-full sm:w-auto">Sign In</Button>
              </Link>
            </Card>
          )}
        </motion.div>
      </main>
    </AppLayout>
  );
}
