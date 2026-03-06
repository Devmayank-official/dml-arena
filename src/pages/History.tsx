import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  History as HistoryIcon, 
  Search, 
  Filter, 
  Calendar,
  Trash2,
  MessageSquare,
  Brain,
  Clock,
  ChevronDown,
  ChevronUp,
  Star,
  X,
  Sparkles
} from 'lucide-react';
import { BackgroundEffects } from '@/components/BackgroundEffects';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/AppLayout';
import { useHistory } from '@/hooks/useHistory';
import { useSettings } from '@/hooks/useSettings';
import { useFavorites } from '@/hooks/useFavorites';
import { useRatings } from '@/hooks/useRatings';
import { ResponseGrid } from '@/components/ResponseGrid';
import { ShareButton } from '@/components/ShareButton';
import { ExportDropdown } from '@/components/ExportDropdown';
import { BulkExport } from '@/components/BulkExport';
import { FavoriteButton } from '@/components/FavoriteButton';
import { getModelById, ALL_MODELS, PROVIDER_INFO, type ModelProvider } from '@/lib/models';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

type FilterType = 'all' | 'comparison' | 'debate' | 'favorites' | 'rated';
type SortType = 'newest' | 'oldest';
type DateRange = 'all' | 'today' | 'week' | 'month';

export default function History() {
  const { settings } = useSettings();
  const history = useHistory(settings.autoSaveHistory);
  const { isFavorite, toggleFavorite, favorites } = useFavorites();
  const ratings = useRatings(settings.autoSaveHistory);
  
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortOrder, setSortOrder] = useState<SortType>('newest');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Combine and filter history
  const combinedHistory = useMemo(() => {
    const comparisons = history.comparisonHistory.map(h => ({
      id: h.id,
      type: 'comparison' as const,
      query: h.query,
      responses: h.responses,
      created_at: h.created_at,
      models: (h.responses as any[]).map(r => r.model),
    }));

    const debates = history.debateHistory.map(h => ({
      id: h.id,
      type: 'debate' as const,
      query: h.query,
      responses: [],
      created_at: h.created_at,
      models: h.models,
      totalRounds: h.total_rounds,
      finalAnswer: h.final_answer,
    }));

    let combined = [...comparisons, ...debates];

    // Filter by type
    if (filterType === 'favorites') {
      combined = combined.filter(h => isFavorite(h.type, h.id));
    } else if (filterType === 'rated') {
      combined = combined.filter(h => 
        ratings.ratings.some(r => r.history_id === h.id)
      );
    } else if (filterType !== 'all') {
      combined = combined.filter(h => h.type === filterType);
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      switch (dateRange) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
      }
      combined = combined.filter(h => new Date(h.created_at) >= cutoff);
    }

    // Filter by selected models
    if (selectedModels.length > 0) {
      combined = combined.filter(h => 
        selectedModels.some(m => h.models.includes(m))
      );
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      combined = combined.filter(h => 
        h.query.toLowerCase().includes(query) ||
        h.models.some(m => m.toLowerCase().includes(query))
      );
    }

    // Sort
    combined.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return combined;
  }, [history.comparisonHistory, history.debateHistory, filterType, searchQuery, sortOrder, dateRange, selectedModels, favorites, isFavorite, ratings.ratings]);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterType !== 'all') count++;
    if (dateRange !== 'all') count++;
    if (selectedModels.length > 0) count++;
    return count;
  }, [filterType, dateRange, selectedModels]);

  const clearAllFilters = () => {
    setFilterType('all');
    setDateRange('all');
    setSelectedModels([]);
    setSearchQuery('');
  };

  const toggleModelFilter = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(m => m !== modelId)
        : [...prev, modelId]
    );
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <AppLayout>
      <BackgroundEffects />

      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8 relative z-10 max-w-5xl">
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <HistoryIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">History</h1>
                <p className="text-sm text-muted-foreground">
                  {combinedHistory.length} {combinedHistory.length === 1 ? 'entry' : 'entries'}
                </p>
              </div>
            </div>
            
            {combinedHistory.length > 0 && (
              <div className="flex items-center gap-2">
                <BulkExport 
                  comparisons={history.comparisonHistory}
                  debates={history.debateHistory}
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all your comparison and debate history. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => history.clearHistory()}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>

          {/* Filters */}
          <Card className="p-4 bg-card border-border space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search queries or models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {/* Type Filter */}
              <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="comparison">Comparisons</SelectItem>
                  <SelectItem value="debate">Debates</SelectItem>
                  <SelectItem value="favorites">
                    <span className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-yellow-500" />
                      Favorites
                    </span>
                  </SelectItem>
                  <SelectItem value="rated">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Rated
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
                <SelectTrigger className="w-full sm:w-36">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortType)}>
                <SelectTrigger className="w-full sm:w-36">
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>

              {/* Model Filter Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="default" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Models
                    {selectedModels.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                        {selectedModels.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="end">
                    <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Filter by Model</span>
                      {selectedModels.length > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs"
                          onClick={() => setSelectedModels([])}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    <Input 
                      placeholder="Search models..." 
                      className="h-8 text-sm"
                      onChange={(e) => {
                        const search = e.target.value.toLowerCase();
                        document.querySelectorAll('[data-history-model-item]').forEach((el) => {
                          const name = el.getAttribute('data-model-name')?.toLowerCase() || '';
                          (el as HTMLElement).style.display = name.includes(search) ? '' : 'none';
                        });
                        document.querySelectorAll('[data-history-provider-group]').forEach((el) => {
                          const items = el.querySelectorAll('[data-history-model-item]');
                          const anyVisible = Array.from(items).some(item => (item as HTMLElement).style.display !== 'none');
                          (el as HTMLElement).style.display = anyVisible ? '' : 'none';
                        });
                      }}
                    />
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {Object.entries(
                        ALL_MODELS.reduce((groups, model) => {
                          const provider = model.provider;
                          if (!groups[provider]) groups[provider] = [];
                          groups[provider].push(model);
                          return groups;
                        }, {} as Record<string, typeof ALL_MODELS>)
                      ).map(([provider, models]) => (
                        <div key={provider} data-history-provider-group>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            {PROVIDER_INFO[provider as ModelProvider]?.name || provider}
                          </p>
                          <div className="space-y-1">
                            {models.map(model => (
                              <label 
                                key={model.id}
                                data-history-model-item
                                data-model-name={model.name}
                                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1.5 rounded-md"
                              >
                                <Checkbox
                                  checked={selectedModels.includes(model.id)}
                                  onCheckedChange={() => toggleModelFilter(model.id)}
                                />
                                <span className="text-sm">{model.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Active Filters */}
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Active filters:</span>
                {filterType !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {filterType}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => setFilterType('all')}
                    />
                  </Badge>
                )}
                {dateRange !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {dateRange}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => setDateRange('all')}
                    />
                  </Badge>
                )}
                {selectedModels.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedModels.length} models
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => setSelectedModels([])}
                    />
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs text-muted-foreground"
                  onClick={clearAllFilters}
                >
                  Clear all
                </Button>
              </div>
            )}
          </Card>

          {/* History List */}
          {history.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : combinedHistory.length === 0 ? (
            <Card className="p-8 text-center bg-card border-border">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <HistoryIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No history found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchQuery || filterType !== 'all' 
                  ? 'Try adjusting your filters or search query.'
                  : 'Start comparing AI models to build your history.'}
              </p>
              <Link to="/chat" className="mt-4 inline-block">
                <Button>Start Comparing</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {combinedHistory.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Collapsible open={expandedItems.has(item.id)}>
                      <Card className="bg-card border-border overflow-hidden">
                        <CollapsibleTrigger asChild>
                          <div 
                            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => toggleExpanded(item.id)}
                          >
                            <div className="flex items-start gap-3">
                              {/* Icon */}
                              <div className={`p-2 rounded-lg shrink-0 ${
                                item.type === 'debate' 
                                  ? 'bg-accent/20 text-accent' 
                                  : 'bg-primary/20 text-primary'
                              }`}>
                                {item.type === 'debate' ? (
                                  <Brain className="h-4 w-4" />
                                ) : (
                                  <MessageSquare className="h-4 w-4" />
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="font-medium line-clamp-2">{item.query}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                      <Badge variant="outline" className="text-xs">
                                        {item.type === 'debate' ? 'Deep Debate' : 'Comparison'}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDate(item.created_at)}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {item.models.length} models
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 shrink-0">
                                    {expandedItems.has(item.id) ? (
                                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>

                                {/* Model badges */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {item.models.slice(0, 4).map(modelId => {
                                    const model = getModelById(modelId);
                                    return (
                                      <span 
                                        key={modelId}
                                        className="text-xs px-2 py-0.5 rounded-full bg-muted"
                                        style={{ 
                                          borderLeft: `3px solid ${model?.color || 'hsl(var(--primary))'}`
                                        }}
                                      >
                                        {model?.name || modelId.split('/')[1]}
                                      </span>
                                    );
                                  })}
                                  {item.models.length > 4 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                                      +{item.models.length - 4} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="border-t border-border p-4 bg-muted/30">
                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                              <FavoriteButton
                                isFavorite={isFavorite(item.type, item.id)}
                                onToggle={() => toggleFavorite(item.type, item.id)}
                                size="sm"
                              />
                              <ShareButton
                                onShare={() => history.shareResult(item.id, item.type)}
                              />
                              {item.type === 'comparison' && item.responses.length > 0 && (
                                <ExportDropdown
                                  query={item.query}
                                  responses={item.responses as any}
                                  createdAt={item.created_at}
                                />
                              )}
                            </div>

                            {/* Responses */}
                            {item.type === 'comparison' && item.responses.length > 0 && (
                              <ResponseGrid
                                responses={item.responses as any}
                                loadingModels={[]}
                                historyId={item.id}
                                showVoting
                                onVote={(modelId, type) => history.vote(item.id, 'comparison', modelId, type)}
                                getVote={(modelId) => history.getVote(item.id, modelId)}
                              />
                            )}

                            {item.type === 'debate' && (item as any).finalAnswer && (
                              <div className="p-4 rounded-lg bg-card border border-border">
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                  <Brain className="h-4 w-4 text-accent" />
                                  Final Synthesized Answer
                                </h4>
                                <p className="text-sm text-muted-foreground line-clamp-6">
                                  {(item as any).finalAnswer}
                                </p>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>
    </AppLayout>
  );
}
